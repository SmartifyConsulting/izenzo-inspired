import express from 'express'
import cors from 'cors'
import crypto from 'node:crypto'
import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from './db.js'
import { initGates, completeGate, allGatesVerified, gateProgress } from './gates.js'
import { screenName } from './sanctions.js'

const JWT_SECRET = process.env.JWT_SECRET || 'izenzo-dev-secret-change-in-production'
const app = express()
app.use(cors())
app.use(express.json())

function log(workspaceId, event, detail) {
  db.prepare(
    `INSERT INTO audit_logs (id, workspace_id, event, detail_json, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(nanoid(), workspaceId ?? null, event, JSON.stringify(detail ?? {}), new Date().toISOString())
}

function hashPayload(obj) {
  return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex')
}

// ---- Auth (workspace provisioning) ----
app.post('/auth/signup', async (req, res) => {
  const { name, email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })
  const existing = db.prepare('SELECT id FROM workspaces WHERE email = ?').get(email)
  if (existing) return res.status(409).json({ error: 'workspace already exists for this email' })
  const id = nanoid()
  const hash = await bcrypt.hash(password, 10)
  db.prepare(
    'INSERT INTO workspaces (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, name || email.split('@')[0], email, hash, new Date().toISOString())
  const token = jwt.sign({ workspace_id: id }, JWT_SECRET, { expiresIn: '7d' })
  log(id, 'workspace_provisioned', { email })
  res.status(201).json({ workspace_id: id, token })
})

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body
  const ws = db.prepare('SELECT * FROM workspaces WHERE email = ?').get(email)
  if (!ws || !(await bcrypt.compare(password, ws.password_hash))) {
    return res.status(401).json({ error: 'invalid credentials' })
  }
  const token = jwt.sign({ workspace_id: ws.id }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ workspace_id: ws.id, token })
})

function auth(req, res, next) {
  const header = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '')
  if (!header) return res.status(401).json({ error: 'missing X-API-Key or bearer token' })
  try {
    const key = db.prepare('SELECT * FROM api_keys WHERE key = ? AND revoked_at IS NULL').get(header)
    if (key) {
      req.workspaceId = key.workspace_id
      return next()
    }
    const decoded = jwt.verify(header, JWT_SECRET)
    req.workspaceId = decoded.workspace_id
    next()
  } catch {
    return res.status(401).json({ error: 'invalid credentials' })
  }
}

// ---- Operational ----
app.get('/healthz', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }))

app.post('/api-keys', auth, (req, res) => {
  const id = nanoid()
  const key = `izk_${nanoid(32)}`
  db.prepare('INSERT INTO api_keys (id, workspace_id, key, label, created_at) VALUES (?, ?, ?, ?, ?)').run(
    id, req.workspaceId, key, req.body?.label || null, new Date().toISOString()
  )
  log(req.workspaceId, 'api_key_created', { id })
  res.status(201).json({ id, key })
})
app.get('/api-keys', auth, (req, res) => {
  const rows = db.prepare('SELECT id, label, created_at, revoked_at FROM api_keys WHERE workspace_id = ?').all(req.workspaceId)
  res.json(rows)
})
app.delete('/api-keys/:id', auth, (req, res) => {
  db.prepare('UPDATE api_keys SET revoked_at = ? WHERE id = ? AND workspace_id = ?').run(
    new Date().toISOString(), req.params.id, req.workspaceId
  )
  log(req.workspaceId, 'api_key_revoked', { id: req.params.id })
  res.json({ revoked: true })
})

app.get('/audit-logs', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM audit_logs WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 200').all(req.workspaceId)
  res.json(rows.map((r) => ({ ...r, detail_json: JSON.parse(r.detail_json) })))
})

// ---- Counterparties (Entities) ----
app.post('/entities', auth, (req, res) => {
  const { legal_name, registration_number, jurisdiction, ubos } = req.body
  if (!legal_name) return res.status(400).json({ error: 'legal_name required' })
  const id = nanoid()
  db.prepare(
    'INSERT INTO entities (id, workspace_id, legal_name, registration_number, jurisdiction, kyb_status, sanctions_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, req.workspaceId, legal_name, registration_number || null, jurisdiction || null, 'pending', 'unscreened', new Date().toISOString())
  for (const u of ubos || []) {
    db.prepare('INSERT INTO ubos (id, entity_id, name, ownership_pct, sanctions_status) VALUES (?, ?, ?, ?, ?)').run(
      nanoid(), id, u.name, u.ownership_pct, 'unscreened'
    )
  }
  log(req.workspaceId, 'entity_registered', { id, legal_name })
  res.status(201).json({ id, legal_name, kyb_status: 'pending' })
})

app.get('/entities', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM entities WHERE workspace_id = ?').all(req.workspaceId)
  const withUbos = rows.map((e) => ({
    ...e,
    sanctions_result: e.sanctions_result ? JSON.parse(e.sanctions_result) : null,
    ubos: db.prepare('SELECT * FROM ubos WHERE entity_id = ?').all(e.id).map((u) => ({
      ...u,
      sanctions_result: u.sanctions_result ? JSON.parse(u.sanctions_result) : null,
    })),
  }))
  res.json(withUbos)
})

// Real sanctions screening — calls OpenSanctions live API
app.post('/entities/:id/screen', auth, async (req, res) => {
  const entity = db.prepare('SELECT * FROM entities WHERE id = ? AND workspace_id = ?').get(req.params.id, req.workspaceId)
  if (!entity) return res.status(404).json({ error: 'entity not found' })

  const entityResult = await screenName(entity.legal_name, 'Company')
  db.prepare('UPDATE entities SET sanctions_status = ?, sanctions_result = ? WHERE id = ?').run(
    entityResult.status, JSON.stringify(entityResult), entity.id
  )

  const ubos = db.prepare('SELECT * FROM ubos WHERE entity_id = ?').all(entity.id)
  for (const u of ubos) {
    const uboResult = await screenName(u.name, 'Person')
    db.prepare('UPDATE ubos SET sanctions_status = ?, sanctions_result = ? WHERE id = ?').run(
      uboResult.status, JSON.stringify(uboResult), u.id
    )
  }

  const anyHit = entityResult.status === 'hit' || ubos.length > 0 && db.prepare(
    'SELECT COUNT(*) as c FROM ubos WHERE entity_id = ? AND sanctions_status = ?'
  ).get(entity.id, 'hit').c > 0

  const kybStatus = entityResult.status === 'error' ? 'pending' : anyHit ? 'flagged' : 'reviewed'
  db.prepare('UPDATE entities SET kyb_status = ? WHERE id = ?').run(kybStatus, entity.id)

  log(req.workspaceId, 'sanctions_screened', { entity_id: entity.id, result: entityResult.status })
  res.json({ entity_result: entityResult, kyb_status: kybStatus })
})

app.post('/authority-bind', auth, (req, res) => {
  const { entity_id, signatory_name } = req.body
  const entity = db.prepare('SELECT * FROM entities WHERE id = ? AND workspace_id = ?').get(entity_id, req.workspaceId)
  if (!entity) return res.status(404).json({ error: 'entity not found' })
  log(req.workspaceId, 'authority_bound', { entity_id, signatory_name })
  res.json({ entity_id, bound: true, signatory_name })
})

app.post('/trade-approval', auth, (req, res) => {
  const { entity_id } = req.body
  const entity = db.prepare('SELECT * FROM entities WHERE id = ? AND workspace_id = ?').get(entity_id, req.workspaceId)
  if (!entity) return res.status(404).json({ error: 'entity not found' })
  const approved = entity.kyb_status === 'reviewed'
  res.json({ entity_id, approved, reason: approved ? null : `kyb_status=${entity.kyb_status}, run /entities/:id/screen first` })
})

app.get('/trade-status', auth, (req, res) => {
  const { entity_id } = req.query
  const entity = db.prepare('SELECT * FROM entities WHERE id = ? AND workspace_id = ?').get(entity_id, req.workspaceId)
  if (!entity) return res.status(404).json({ error: 'entity not found' })
  res.json({ entity_id, kyb_status: entity.kyb_status, sanctions_status: entity.sanctions_status })
})

// ---- Matches (9-Gate workflow) ----
app.post('/match', auth, (req, res) => {
  const { counterparty_entity_id, commodity, volume_mt, price_usd, incoterms } = req.body
  const id = nanoid()
  const gates = initGates()
  db.prepare(
    `INSERT INTO matches (id, workspace_id, counterparty_entity_id, commodity, volume_mt, price_usd, incoterms, status, gates_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, req.workspaceId, counterparty_entity_id || null, commodity, volume_mt, price_usd, incoterms, 'pending_verification', JSON.stringify(gates), new Date().toISOString())
  log(req.workspaceId, 'match_created', { id, commodity })
  res.status(201).json({ match_id: id, status: 'pending_verification', gates })
})

app.get('/match/:id', auth, (req, res) => {
  const m = db.prepare('SELECT * FROM matches WHERE id = ? AND workspace_id = ?').get(req.params.id, req.workspaceId)
  if (!m) return res.status(404).json({ error: 'match not found' })
  res.json({ ...m, gates: JSON.parse(m.gates_json), gate_progress: gateProgress(m.gates_json) })
})

app.get('/matches', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM matches WHERE workspace_id = ?').all(req.workspaceId)
  res.json(rows.map((m) => ({ ...m, gates: JSON.parse(m.gates_json), gate_progress: gateProgress(m.gates_json) })))
})

// Advance a specific gate — this is real server-enforced state, not decorative
app.post('/match/:id/gate/:gateIndex', auth, (req, res) => {
  const m = db.prepare('SELECT * FROM matches WHERE id = ? AND workspace_id = ?').get(req.params.id, req.workspaceId)
  if (!m) return res.status(404).json({ error: 'match not found' })
  const idx = Number(req.params.gateIndex)
  try {
    const gatesJson = completeGate(m.gates_json, idx, req.body?.note)
    db.prepare('UPDATE matches SET gates_json = ? WHERE id = ?').run(gatesJson, m.id)
    log(req.workspaceId, 'gate_advanced', { match_id: m.id, gate: idx })
    res.json({ gates: JSON.parse(gatesJson), gate_progress: gateProgress(gatesJson) })
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) })
  }
})

app.post('/match/:id/settle', auth, (req, res) => {
  const m = db.prepare('SELECT * FROM matches WHERE id = ? AND workspace_id = ?').get(req.params.id, req.workspaceId)
  if (!m) return res.status(404).json({ error: 'match not found' })
  if (!allGatesVerified(m.gates_json)) {
    return res.status(409).json({
      error: 'cannot settle: not all 9 gates are verified',
      gate_progress: gateProgress(m.gates_json),
    })
  }
  const payload = {
    match_id: m.id,
    commodity: m.commodity,
    volume_mt: m.volume_mt,
    price_usd: m.price_usd,
    incoterms: m.incoterms,
    gates: JSON.parse(m.gates_json),
    settled_at: new Date().toISOString(),
  }
  const hash = hashPayload(payload)
  db.prepare(`UPDATE matches SET status = 'settled', payload_hash = ?, settled_at = ? WHERE id = ?`).run(
    hash, payload.settled_at, m.id
  )
  log(req.workspaceId, 'match_settled', { match_id: m.id, payload_hash: hash })
  res.json({ match_id: m.id, status: 'settled', payload_hash: hash, settled_at: payload.settled_at })
})

// ---- Evidence & settlement ----
app.post('/pods', auth, (req, res) => {
  const { match_id, filename, content_base64 } = req.body
  const m = db.prepare('SELECT * FROM matches WHERE id = ? AND workspace_id = ?').get(match_id, req.workspaceId)
  if (!m) return res.status(404).json({ error: 'match not found' })
  const buffer = Buffer.from(content_base64 || '', 'base64')
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex')
  const id = nanoid()
  db.prepare('INSERT INTO evidence_files (id, match_id, filename, sha256, created_at) VALUES (?, ?, ?, ?, ?)').run(
    id, match_id, filename || 'document', sha256, new Date().toISOString()
  )
  log(req.workspaceId, 'evidence_recorded', { match_id, filename, sha256 })
  res.status(201).json({ id, filename, sha256 })
})

app.get('/evidence-pack/:matchId', auth, (req, res) => {
  const m = db.prepare('SELECT * FROM matches WHERE id = ? AND workspace_id = ?').get(req.params.matchId, req.workspaceId)
  if (!m) return res.status(404).json({ error: 'match not found' })
  const files = db.prepare('SELECT * FROM evidence_files WHERE match_id = ?').all(m.id)
  res.json({
    match_id: m.id,
    status: m.status,
    payload_hash: m.payload_hash,
    gates: JSON.parse(m.gates_json),
    evidence_files: files,
  })
})

app.post('/p3-wad', auth, (req, res) => {
  const { match_id } = req.body
  const m = db.prepare('SELECT * FROM matches WHERE id = ? AND workspace_id = ?').get(match_id, req.workspaceId)
  if (!m) return res.status(404).json({ error: 'match not found' })
  if (m.status !== 'settled') return res.status(409).json({ error: 'match must be settled before certificate issuance' })
  res.json({
    certificate_class: 'WaD/A',
    match_id: m.id,
    payload_hash: m.payload_hash,
    issued_at: new Date().toISOString(),
    verify_url: `/evidence-pack/${m.id}`,
  })
})

// ---- Discovery & signals (kept simple/real: DB-backed, no fake data) ----
app.post('/signals', auth, (req, res) => {
  const id = nanoid()
  log(req.workspaceId, 'signal_created', { id, ...req.body })
  res.status(201).json({ signal_id: id, ...req.body, status: 'active' })
})
app.post('/search', auth, (req, res) => {
  const rows = db.prepare('SELECT id, legal_name, jurisdiction, kyb_status FROM entities WHERE workspace_id = ? AND kyb_status = ?').all(req.workspaceId, 'reviewed')
  res.json({ results: rows })
})

// ---- Webhooks ----
app.post('/webhooks', auth, (req, res) => {
  const id = nanoid()
  db.prepare('INSERT INTO webhooks (id, workspace_id, url, created_at) VALUES (?, ?, ?, ?)').run(
    id, req.workspaceId, req.body.url, new Date().toISOString()
  )
  res.status(201).json({ id, url: req.body.url })
})
app.get('/webhooks', auth, (req, res) => {
  res.json(db.prepare('SELECT * FROM webhooks WHERE workspace_id = ?').all(req.workspaceId))
})
app.delete('/webhooks/:id', auth, (req, res) => {
  db.prepare('DELETE FROM webhooks WHERE id = ? AND workspace_id = ?').run(req.params.id, req.workspaceId)
  res.json({ deleted: true })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Izenzo backend listening on :${PORT}`))
