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
export const TOKEN_UNIT_USD = 10

export class InsufficientTokensError extends Error {
  constructor(required, available) {
    super(`Insufficient tokens: requires ${required}, wallet has ${available}`)
    this.required = required
    this.available = available
  }
}

export function walletLedger(workspaceId) {
  const entries = db
    .prepare('SELECT * FROM token_entries WHERE workspace_id = ? ORDER BY created_at ASC')
    .all(workspaceId)
  // Purchases are positive credits; poi/wad/adjustment-debit entries are negative consumption.
  // Stored as unsigned tokens/usd with gate_type distinguishing direction.
  const purchased = entries.filter((e) => e.gate_type === 'purchase').reduce((s, e) => s + e.tokens, 0)
  const consumed = entries.filter((e) => e.gate_type === 'poi' || e.gate_type === 'wad').reduce((s, e) => s + e.tokens, 0)
  const purchasedUsd = entries.filter((e) => e.gate_type === 'purchase').reduce((s, e) => s + e.usd, 0)
  const consumedUsd = entries.filter((e) => e.gate_type === 'poi' || e.gate_type === 'wad').reduce((s, e) => s + e.usd, 0)
  return {
    entries,
    tokens_purchased: purchased,
    tokens_consumed: consumed,
    tokens_available: purchased - consumed,
    usd_purchased: purchasedUsd,
    usd_consumed: consumedUsd,
  }
}

// Atomically consumes a fixed token charge for a hard gate. Idempotent on
// (transactionId, gateType): a retry never double-charges. Requires a
// sufficient real wallet balance (from settled purchases) — this is a real
// gate, not decorative: insufficient balance throws and the caller must
// purchase tokens first via the sandbox payment flow.
export function chargeGate(workspaceId, transactionId, gateType, tokens, usd) {
  const existing = db
    .prepare('SELECT * FROM token_entries WHERE transaction_id = ? AND gate_type = ?')
    .get(transactionId, gateType)
  if (existing) return existing

  const wallet = walletLedger(workspaceId)
  if (wallet.tokens_available < tokens) {
    throw new InsufficientTokensError(tokens, wallet.tokens_available)
  }

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

// Credits a workspace's wallet after a payment session settles. Idempotent
// on the session id — a retried/duplicate webhook never double-credits.
export function creditPurchase(workspaceId, tokens, usd, sessionId) {
  const already = db.prepare(`SELECT * FROM token_entries WHERE idempotency_key = ?`).get(sessionId)
  if (already) return already
  const id = nanoid()
  db.prepare(
    `INSERT INTO token_entries (id, workspace_id, transaction_id, gate_type, tokens, usd, idempotency_key, created_at)
     VALUES (?, ?, NULL, 'purchase', ?, ?, ?, ?)`
  ).run(id, workspaceId, tokens, usd, sessionId, new Date().toISOString())
  return db.prepare('SELECT * FROM token_entries WHERE id = ?').get(id)
}
