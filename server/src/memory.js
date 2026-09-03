import crypto from 'node:crypto'
import { nanoid } from 'nanoid'
import { db } from './db.js'

function canonicalize(obj) {
  return JSON.stringify(obj, Object.keys(obj).sort())
}

// Appends one hash-chained MemoryEvent for a transaction. Each event's hash
// covers the previous event's hash, so the chain is tamper-evident: editing
// or deleting an old event breaks every hash after it. This is the spec's
// "Memory substrate" (section 14) — every spine stage writes here.
export function writeMemoryEvent(transactionId, eventType, payload) {
  const prev = db
    .prepare('SELECT event_hash FROM memory_events WHERE transaction_id = ? ORDER BY occurred_at DESC LIMIT 1')
    .get(transactionId)
  const prevHash = prev ? prev.event_hash : null
  const occurredAt = new Date().toISOString()
  const canonical = canonicalize({ transactionId, eventType, payload, prevHash, occurredAt })
  const eventHash = crypto.createHash('sha256').update(canonical).digest('hex')
  const id = nanoid()
  db.prepare(
    `INSERT INTO memory_events (id, transaction_id, event_type, payload_json, prev_hash, event_hash, occurred_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, transactionId, eventType, JSON.stringify(payload), prevHash, eventHash, occurredAt)
  return { id, event_hash: eventHash, prev_hash: prevHash, occurred_at: occurredAt }
}

export function getTimeline(transactionId) {
  return db
    .prepare('SELECT * FROM memory_events WHERE transaction_id = ? ORDER BY occurred_at ASC')
    .all(transactionId)
    .map((e) => ({ ...e, payload: JSON.parse(e.payload_json) }))
}

// Verifies the hash chain is intact — proves no event was altered or removed.
export function verifyChain(transactionId) {
  const events = getTimeline(transactionId)
  let prevHash = null
  for (const e of events) {
    const canonical = canonicalize({
      transactionId,
      eventType: e.event_type,
      payload: e.payload,
      prevHash,
      occurredAt: e.occurred_at,
    })
    const expected = crypto.createHash('sha256').update(canonical).digest('hex')
    if (expected !== e.event_hash) {
      return { valid: false, brokenAt: e.id }
    }
    prevHash = e.event_hash
  }
  return { valid: true, eventCount: events.length }
}
