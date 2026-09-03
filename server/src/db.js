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

CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  registration_number TEXT,
  jurisdiction TEXT,
  kyb_status TEXT NOT NULL DEFAULT 'pending',
  sanctions_status TEXT NOT NULL DEFAULT 'unscreened',
  sanctions_result TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ubos (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  name TEXT NOT NULL,
  ownership_pct REAL NOT NULL,
  sanctions_status TEXT NOT NULL DEFAULT 'unscreened',
  sanctions_result TEXT
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  counterparty_entity_id TEXT,
  commodity TEXT,
  volume_mt REAL,
  price_usd REAL,
  incoterms TEXT,
  status TEXT NOT NULL DEFAULT 'pending_verification',
  gates_json TEXT NOT NULL,
  payload_hash TEXT,
  created_at TEXT NOT NULL,
  settled_at TEXT
);

CREATE TABLE IF NOT EXISTS evidence_files (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  created_at TEXT NOT NULL
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
