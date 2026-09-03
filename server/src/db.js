import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '..', 'db', 'izenzo.sqlite')

export const db = new DatabaseSync(dbPath)

db.exec(`
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  key TEXT UNIQUE NOT NULL,
  label TEXT,
  created_at TEXT NOT NULL,
  revoked_at TEXT
);

-- The five-part spine container. Created on the first Bid/Offer.
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  lifecycle TEXT NOT NULL DEFAULT 'OPEN',
  trading_stage TEXT NOT NULL DEFAULT 'BID_OFFER',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bid_offers (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  actor_person TEXT,
  represented_org TEXT,
  role TEXT,
  contact TEXT,
  subject_type TEXT,
  subject_description TEXT,
  commercial_json TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  parent_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS other_documents (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  semantic_type TEXT NOT NULL, -- AUTHORITY | EVIDENCE | CONTEXT | combination
  issuer TEXT,
  subject TEXT,
  extracted_facts_json TEXT,
  content_hash TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS social_news_items (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  source_url TEXT,
  publisher TEXT,
  subject_match TEXT,
  excerpt TEXT,
  observed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS search_runs (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  queries_json TEXT,
  candidates_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_analyses (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  search_run_id TEXT NOT NULL,
  output_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS decision_sessions (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  ai_analysis_id TEXT NOT NULL,
  choice_set_json TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS counterparty_sets (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  decision_session_id TEXT NOT NULL,
  entities_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS choices (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  counterparty_set_id TEXT NOT NULL,
  selected_entity_json TEXT NOT NULL,
  actor TEXT,
  reason TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS intents (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  choice_id TEXT NOT NULL,
  frozen_snapshot_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pois (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  intent_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'LOCKED', -- LOCKED -> DRAFT -> SEALED
  token_entry_id TEXT,
  canonical_hash TEXT,
  sealed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wads (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  poi_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'LOCKED', -- LOCKED -> PENDING -> PASSED/FAILED
  token_entry_id TEXT,
  predicates_json TEXT,
  decision TEXT,
  decided_at TEXT,
  created_at TEXT NOT NULL
);

-- Append-only, double-entry token ledger. Never edit a balance directly.
CREATE TABLE IF NOT EXISTS token_entries (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  transaction_id TEXT,
  gate_type TEXT NOT NULL, -- purchase | poi | wad | reversal | refund | adjustment
  tokens INTEGER NOT NULL,
  usd REAL NOT NULL,
  idempotency_key TEXT,
  created_at TEXT NOT NULL
);

-- Append-only, hash-chained Memory substrate. INSERT-only, no UPDATE/DELETE.
CREATE TABLE IF NOT EXISTS memory_events (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  prev_hash TEXT,
  event_hash TEXT NOT NULL,
  occurred_at TEXT NOT NULL
);

-- Execution: ENTRY -> EXECUTION -> EXIT. Only enters from a WaD PASSED decision.
CREATE TABLE IF NOT EXISTS executions (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  wad_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ENTRY_REVIEW', -- ENTRY_REVIEW -> ACTIVE -> EXIT_REVIEW -> COMPLETE
  baseline_json TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE -> SUBMITTED -> ACCEPTED
  evidence_hash TEXT,
  created_at TEXT NOT NULL,
  accepted_at TEXT
);

-- Finality: terminal record. Cannot be issued while Execution is incomplete.
CREATE TABLE IF NOT EXISTS finality_records (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  execution_id TEXT NOT NULL,
  finality_type TEXT NOT NULL, -- PAYMENT | SETTLEMENT | HANDOVER_DELIVERY | SYNTHETIC | OTHER
  status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT -> VALIDATION -> ACCEPTED -> ISSUED
  canonical_hash TEXT,
  certificate_json TEXT,
  created_at TEXT NOT NULL,
  issued_at TEXT
);

-- Sandbox payment sessions. A real settlement-verification pattern (spec
-- BIL-01/BIL-02, 16.4 adapter contract) backed by a simulated provider
-- instead of a live processor -- no real money moves, but the flow (create
-- session -> redirect -> signed callback -> idempotent reconciliation) is
-- the genuine mechanism, not a UI-only fake.
CREATE TABLE IF NOT EXISTS payment_sessions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  tokens INTEGER NOT NULL,
  usd REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING -> SETTLED
  idempotency_key TEXT,
  created_at TEXT NOT NULL,
  settled_at TEXT
);

CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT,
  event TEXT NOT NULL,
  detail_json TEXT,
  created_at TEXT NOT NULL
);
`)
