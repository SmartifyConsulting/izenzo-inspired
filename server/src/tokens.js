import { nanoid } from 'nanoid'
import { db } from './db.js'

// Fixed, non-configurable pricing per the spec (section 15.2).
// These are NOT read from any config, env var, tenant setting, or admin
// panel — they are hard-coded, exactly as the spec requires ("not
// runtime-configurable by tenant, domain, role, administrator, AI or agent").
export const POI_TOKENS = 1
export const POI_USD = 10
export const WAD_TOKENS = 3
export const WAD_USD = 30

// Atomically consumes a fixed token charge for a hard gate. Idempotent on
// (transactionId, gateType): a retry never double-charges. Returns the
// existing entry if one already exists for this gate, otherwise creates
// exactly one new ledger entry.
export function chargeGate(workspaceId, transactionId, gateType, tokens, usd) {
  const existing = db
    .prepare('SELECT * FROM token_entries WHERE transaction_id = ? AND gate_type = ?')
    .get(transactionId, gateType)
  if (existing) return existing

  const id = nanoid()
  const entry = {
    id,
    workspace_id: workspaceId,
    transaction_id: transactionId,
    gate_type: gateType,
    tokens,
    usd,
    created_at: new Date().toISOString(),
  }
  db.prepare(
    `INSERT INTO token_entries (id, workspace_id, transaction_id, gate_type, tokens, usd, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(entry.id, entry.workspace_id, entry.transaction_id, entry.gate_type, entry.tokens, entry.usd, entry.created_at)
  return entry
}

export function walletLedger(workspaceId) {
  const entries = db
    .prepare('SELECT * FROM token_entries WHERE workspace_id = ? ORDER BY created_at ASC')
    .all(workspaceId)
  const totalUsd = entries.reduce((sum, e) => sum + e.usd, 0)
  const totalTokens = entries.reduce((sum, e) => sum + e.tokens, 0)
  return { entries, total_tokens_consumed: totalTokens, total_usd_consumed: totalUsd }
}
