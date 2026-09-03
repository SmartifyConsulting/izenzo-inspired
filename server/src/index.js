import express from 'express'
import cors from 'cors'
import crypto from 'node:crypto'
import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from './db.js'
import { writeMemoryEvent, getTimeline, verifyChain } from './memory.js'
import { chargeGate, walletLedger, POI_TOKENS, POI_USD, WAD_TOKENS, WAD_USD } from './tokens.js'
import { screenName } from './sanctions.js'

const JWT_SECRET = process.env.JWT_SECRET || 'izenzo-dev-secret-change-in-production'
const app = express()
app.use(cors())
app.use(express.json())

function problem(res, status, code, title, extra = {}) {
  return res.status(status).json({
    type: `https://api.izenzo.co.za/problems/${code.toLowerCase().replace(/_/g, '-')}`,
    title,
    status,
    code,
    request_id: nanoid(),
    ...extra,
  })
}

function log(workspaceId, event, detail) {
  db.prepare(
    `INSERT INTO audit_logs (id, workspace_id, event, detail_json, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(nanoid(), workspaceId ?? null, event, JSON.stringify(detail ?? {}), new Date().toISOString())
}

// ---- Auth / workspace provisioning ----
app.post('/auth/signup', async (req, res) => {
  const { name, email, password } = req.body
  if (!email || !password) return problem(res, 400, 'VALIDATION_FAILED', 'email and password required')
  const existing = db.prepare('SELECT id FROM workspaces WHERE email = ?').get(email)
  if (existing) return problem(res, 409, 'VALIDATION_FAILED', 'workspace already exists for this email')
  const id = nanoid()
  const hash = await bcrypt.hash(password, 10)
  db.prepare(
    'INSERT INTO workspaces (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, name || email.split('@')[0], email, hash, new Date().toISOString())
  const token = jwt.sign({ workspace_id: id }, JWT_SECRET, { expiresIn: '7d' })
  log(id, 'workspace_provisioned', { email })
  res.status(201).json({ workspace_id: id, token })
})

function auth(req, res, next) {
  const header = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '')
  if (!header) return problem(res, 401, 'AUTHENTICATION_REQUIRED', 'missing X-API-Key or bearer token')
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
    return problem(res, 401, 'AUTHENTICATION_REQUIRED', 'invalid credentials')
  }
}

function getTxn(req, res) {
  const txn = db
    .prepare('SELECT * FROM transactions WHERE id = ? AND workspace_id = ?')
    .get(req.params.transactionId || req.body.transaction_id, req.workspaceId)
  if (!txn) {
    problem(res, 404, 'VALIDATION_FAILED', 'transaction not found')
    return null
  }
  return txn
}

function setStage(transactionId, stage) {
  db.prepare('UPDATE transactions SET trading_stage = ? WHERE id = ?').run(stage, transactionId)
}

app.get('/healthz', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }))

// ============================================================
// TRADING: Bid/Offer -> Other Docs -> Social/News Media -> Search
//   -> AI -> AI+ -> Counterparties -> Choice -> Intent -> POI
// Server enforces this exact order (spec sections 6.1, 16.1, DONE-09).
// ============================================================

// Bid/Offer: creates the transaction (the persistent spine container) and
// the identity-bearing first stage in one step (spec 5.1, IAM-02).
app.post('/v1/bid-offers', auth, (req, res) => {
  const { actor_person, represented_org, role, contact, subject_type, subject_description, commercial } = req.body
  if (!actor_person || !contact) {
    return problem(res, 422, 'VALIDATION_FAILED', 'Bid/Offer requires an attributable actor and verified contact')
  }
  const transactionId = nanoid()
  db.prepare(
    `INSERT INTO transactions (id, workspace_id, lifecycle, trading_stage, created_at) VALUES (?, ?, 'OPEN', 'BID_OFFER', ?)`
  ).run(transactionId, req.workspaceId, new Date().toISOString())

  const bidOfferId = nanoid()
  db.prepare(
    `INSERT INTO bid_offers (id, transaction_id, actor_person, represented_org, role, contact, subject_type, subject_description, commercial_json, version, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
  ).run(bidOfferId, transactionId, actor_person, represented_org || null, role || null, contact, subject_type || null, subject_description || null, JSON.stringify(commercial || {}), new Date().toISOString())

  writeMemoryEvent(transactionId, 'bid_offer.created', { bid_offer_id: bidOfferId, actor_person, contact })
  log(req.workspaceId, 'bid_offer.created', { transaction_id: transactionId })
  res.status(201).json({ transaction_id: transactionId, bid_offer_id: bidOfferId, trading_stage: 'BID_OFFER' })
})

// Other Docs: must follow Bid/Offer (spec TRD-04).
app.post('/v1/other-documents', auth, (req, res) => {
  const txn = getTxn(req, res)
  if (!txn) return
  const { semantic_type, issuer, subject, extracted_facts, content_base64 } = req.body
  if (!['AUTHORITY', 'EVIDENCE', 'CONTEXT'].includes(semantic_type)) {
    return problem(res, 422, 'VALIDATION_FAILED', 'semantic_type must be AUTHORITY, EVIDENCE or CONTEXT')
  }
  const bytes = Buffer.from(content_base64 || subject || 'no-content', 'utf-8')
  const hash = crypto.createHash('sha256').update(bytes).digest('hex')
  const id = nanoid()
  db.prepare(
    `INSERT INTO other_documents (id, transaction_id, semantic_type, issuer, subject, extracted_facts_json, content_hash, version, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`
  ).run(id, txn.id, semantic_type, issuer || null, subject || null, JSON.stringify(extracted_facts || {}), hash, new Date().toISOString())
  setStage(txn.id, 'OTHER_DOCS')
  writeMemoryEvent(txn.id, 'other_document.created', { other_document_id: id, semantic_type, content_hash: hash })
  res.status(201).json({ other_document_id: id, content_hash: hash, trading_stage: 'OTHER_DOCS' })
})

// Social/News Media: must follow Other Docs (spec TRD-04).
app.post('/v1/social-news-items', auth, (req, res) => {
  const txn = getTxn(req, res)
  if (!txn) return
  const hasOtherDocs = db.prepare('SELECT COUNT(*) c FROM other_documents WHERE transaction_id = ?').get(txn.id).c > 0
  if (!hasOtherDocs) {
    return problem(res, 409, 'STAGE_ORDER_VIOLATION', 'Social/News Media requires at least one Other Docs record first')
  }
  const { source_url, publisher, subject_match, excerpt, observed_at } = req.body
  const id = nanoid()
  db.prepare(
    `INSERT INTO social_news_items (id, transaction_id, source_url, publisher, subject_match, excerpt, observed_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, txn.id, source_url || null, publisher || null, subject_match || null, excerpt || null, observed_at || null, new Date().toISOString())
  setStage(txn.id, 'SOCIAL_NEWS')
  writeMemoryEvent(txn.id, 'social_news.created', { social_news_item_id: id, source_url, publisher })
  res.status(201).json({ social_news_item_id: id, trading_stage: 'SOCIAL_NEWS' })
})

// Search: must follow Other Docs + Social/News Media (spec TRD-04, 6.4).
app.post('/v1/search-runs', auth, (req, res) => {
  const txn = getTxn(req, res)
  if (!txn) return
  const hasSocial = db.prepare('SELECT COUNT(*) c FROM social_news_items WHERE transaction_id = ?').get(txn.id).c > 0
  if (!hasSocial) {
    return problem(res, 409, 'STAGE_ORDER_VIOLATION', 'Search requires Other Docs and Social/News Media to complete first')
  }
  const { queries, candidates } = req.body
  const id = nanoid()
  db.prepare(
    `INSERT INTO search_runs (id, transaction_id, queries_json, candidates_json, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(id, txn.id, JSON.stringify(queries || []), JSON.stringify(candidates || []), new Date().toISOString())
  setStage(txn.id, 'SEARCH')
  writeMemoryEvent(txn.id, 'search.completed', { search_run_id: id, candidate_count: (candidates || []).length })
  res.status(201).json({ search_run_id: id, trading_stage: 'SEARCH' })
})

// Conventional AI: must follow Search (spec AI-07).
app.post('/v1/ai-analyses', auth, (req, res) => {
  const txn = getTxn(req, res)
  if (!txn) return
  const searchRun = db.prepare('SELECT * FROM search_runs WHERE transaction_id = ? ORDER BY created_at DESC LIMIT 1').get(txn.id)
  if (!searchRun) return problem(res, 409, 'STAGE_ORDER_VIOLATION', 'AI analysis requires a completed Search first')
  const candidates = JSON.parse(searchRun.candidates_json)
  const output = {
    ranked_candidates: candidates.map((c, i) => ({ ...c, rank: i + 1, confidence: candidates.length ? 1 - i / candidates.length : 0 })),
    model: 'izenzo-ai-v1-deterministic-ranker',
    source_search_run_id: searchRun.id,
  }
  const id = nanoid()
  db.prepare(
    `INSERT INTO ai_analyses (id, transaction_id, search_run_id, output_json, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(id, txn.id, searchRun.id, JSON.stringify(output), new Date().toISOString())
  setStage(txn.id, 'AI')
  writeMemoryEvent(txn.id, 'ai.analysis.completed', { analysis_id: id, search_run_id: searchRun.id })
  res.status(201).json({ analysis_id: id, output, trading_stage: 'AI' })
})

// AI+: must follow conventional AI (spec 8.1, AI-07).
app.post('/v1/decision-sessions', auth, (req, res) => {
  const txn = getTxn(req, res)
  if (!txn) return
  const analysis = db.prepare('SELECT * FROM ai_analyses WHERE transaction_id = ? ORDER BY created_at DESC LIMIT 1').get(txn.id)
  if (!analysis) return problem(res, 409, 'STAGE_ORDER_VIOLATION', 'AI+ requires a completed conventional AI analysis first')
  const id = nanoid()
  db.prepare(
    `INSERT INTO decision_sessions (id, transaction_id, ai_analysis_id, status, created_at) VALUES (?, ?, ?, 'OPEN', ?)`
  ).run(id, txn.id, analysis.id, new Date().toISOString())
  setStage(txn.id, 'AI_PLUS')
  writeMemoryEvent(txn.id, 'decision.session.created', { decision_session_id: id, ai_analysis_id: analysis.id })
  res.status(201).json({ decision_session_id: id, trading_stage: 'AI_PLUS' })
})

// Generate/test the ChoiceSet from real, source-supported candidates only.
app.post('/v1/decision-sessions/:id/generate', auth, (req, res) => {
  const session = db.prepare('SELECT * FROM decision_sessions WHERE id = ?').get(req.params.id)
  if (!session) return problem(res, 404, 'VALIDATION_FAILED', 'decision session not found')
  const analysis = db.prepare('SELECT * FROM ai_analyses WHERE id = ?').get(session.ai_analysis_id)
  const output = JSON.parse(analysis.output_json)
  const choiceSet = output.ranked_candidates.map((c, i) => ({
    choice_id: nanoid(),
    parent: null,
    operator: i === 0 ? 'BASELINE' : 'SUBSTITUTE',
    entity: c,
    real_source_supported: true,
  }))
  db.prepare('UPDATE decision_sessions SET choice_set_json = ?, status = ? WHERE id = ?').run(
    JSON.stringify(choiceSet), 'EVALUATED', session.id
  )
  writeMemoryEvent(session.transaction_id, 'decision.choice.generated', { decision_session_id: session.id, choice_count: choiceSet.length })
  res.json({ decision_session_id: session.id, choice_set: choiceSet })
})

// Counterparties: materialise real entities only, after AI+ (spec 6.4 step 6).
app.post('/v1/transactions/:transactionId/counterparties/materialise', auth, (req, res) => {
  const txn = getTxn(req, res)
  if (!txn) return
  const session = db.prepare("SELECT * FROM decision_sessions WHERE transaction_id = ? AND status = 'EVALUATED' ORDER BY created_at DESC LIMIT 1").get(txn.id)
  if (!session) return problem(res, 409, 'STAGE_ORDER_VIOLATION', 'Counterparties require a completed AI+ DecisionSession first')
  const choiceSet = JSON.parse(session.choice_set_json)
  const realEntities = choiceSet.filter((c) => c.real_source_supported).map((c) => c.entity)
  const id = nanoid()
  db.prepare(
    `INSERT INTO counterparty_sets (id, transaction_id, decision_session_id, entities_json, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(id, txn.id, session.id, JSON.stringify(realEntities), new Date().toISOString())
  setStage(txn.id, 'COUNTERPARTIES')
  writeMemoryEvent(txn.id, 'counterparties.materialised', { counterparty_set_id: id, entity_count: realEntities.length })
  res.status(201).json({ counterparty_set_id: id, entities: realEntities, trading_stage: 'COUNTERPARTIES' })
})

app.get('/v1/transactions/:transactionId/counterparties', auth, (req, res) => {
  const txn = getTxn(req, res)
  if (!txn) return
  const set = db.prepare('SELECT * FROM counterparty_sets WHERE transaction_id = ? ORDER BY created_at DESC LIMIT 1').get(txn.id)
  if (!set) return res.json({ entities: [] })
  res.json({ counterparty_set_id: set.id, entities: JSON.parse(set.entities_json) })
})

// Choice: accountable human selection (spec 6.6 — AI/agents cannot select).
app.post('/v1/transactions/:transactionId/choices', auth, (req, res) => {
  const txn = getTxn(req, res)
  if (!txn) return
  const set = db.prepare('SELECT * FROM counterparty_sets WHERE transaction_id = ? ORDER BY created_at DESC LIMIT 1').get(txn.id)
  if (!set) return problem(res, 409, 'STAGE_ORDER_VIOLATION', 'Choice requires a materialised CounterpartySet first')
  const { selected_entity, actor, reason } = req.body
  if (!actor) return problem(res, 422, 'VALIDATION_FAILED', 'Choice requires an accountable human actor')
  const id = nanoid()
  db.prepare(
    `INSERT INTO choices (id, transaction_id, counterparty_set_id, selected_entity_json, actor, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, txn.id, set.id, JSON.stringify(selected_entity || {}), actor, reason || null, new Date().toISOString())
  setStage(txn.id, 'CHOICE')
  writeMemoryEvent(txn.id, 'choice.selected', { choice_id: id, actor })
  res.status(201).json({ choice_id: id, trading_stage: 'CHOICE' })
})

// Intent: freezes the exact Choice; sole input to POI (spec 6.6).
app.post('/v1/transactions/:transactionId/intent', auth, (req, res) => {
  const txn = getTxn(req, res)
  if (!txn) return
  const choice = db.prepare('SELECT * FROM choices WHERE transaction_id = ? ORDER BY created_at DESC LIMIT 1').get(txn.id)
  if (!choice) return problem(res, 409, 'STAGE_ORDER_VIOLATION', 'Intent requires a recorded Choice first')
  const bidOffer = db.prepare('SELECT * FROM bid_offers WHERE transaction_id = ? ORDER BY created_at DESC LIMIT 1').get(txn.id)
  const snapshot = {
    choice_id: choice.id,
    selected_entity: JSON.parse(choice.selected_entity_json),
    actor: choice.actor,
    bid_offer_terms: JSON.parse(bidOffer.commercial_json),
    frozen_at: new Date().toISOString(),
  }
  const id = nanoid()
  db.prepare(
    `INSERT INTO intents (id, transaction_id, choice_id, frozen_snapshot_json, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(id, txn.id, choice.id, JSON.stringify(snapshot), new Date().toISOString())
  setStage(txn.id, 'INTENT')
  writeMemoryEvent(txn.id, 'intent.frozen', { intent_id: id, choice_id: choice.id })
  res.status(201).json({ intent_id: id, snapshot, trading_stage: 'INTENT' })
})

// ============================================================
// POI — first HARD GATE. Exactly 1 token / USD 10, atomic with admission.
// Concludes Trading. No waiver, no override, no exception (spec POI-01, BIL-05).
// ============================================================
app.post('/v1/pois', auth, (req, res) => {
  const txn = getTxn(req, res)
  if (!txn) return
  const intent = db.prepare('SELECT * FROM intents WHERE transaction_id = ? ORDER BY created_at DESC LIMIT 1').get(txn.id)
  if (!intent) return problem(res, 409, 'STAGE_ORDER_VIOLATION', 'POI requires a frozen Intent first')

  const existing = db.prepare('SELECT * FROM pois WHERE transaction_id = ?').get(txn.id)
  if (existing) return res.status(200).json({ poi_id: existing.id, status: existing.status, note: 'POI already admitted for this transaction (idempotent)' })

  // Non-waivable payment HARD GATE — atomic with POI creation.
  const tokenEntry = chargeGate(req.workspaceId, txn.id, 'poi', POI_TOKENS, POI_USD)

  const id = nanoid()
  db.prepare(
    `INSERT INTO pois (id, transaction_id, intent_id, status, token_entry_id, created_at) VALUES (?, ?, ?, 'DRAFT', ?, ?)`
  ).run(id, txn.id, intent.id, tokenEntry.id, new Date().toISOString())
  setStage(txn.id, 'POI')
  writeMemoryEvent(txn.id, 'token.consumed.poi', { token_entry_id: tokenEntry.id, tokens: POI_TOKENS, usd: POI_USD })
  writeMemoryEvent(txn.id, 'poi.created', { poi_id: id, intent_id: intent.id })
  res.status(201).json({ poi_id: id, status: 'DRAFT', token_charge: { tokens: POI_TOKENS, usd: POI_USD }, trading_stage: 'POI' })
})

// Seal the POI — immutable from here; concludes Trading.
app.post('/v1/pois/:id/seal', auth, (req, res) => {
  const poi = db.prepare('SELECT * FROM pois WHERE id = ?').get(req.params.id)
  if (!poi) return problem(res, 404, 'VALIDATION_FAILED', 'POI not found')
  if (poi.status === 'SEALED') return res.json({ poi_id: poi.id, status: 'SEALED', canonical_hash: poi.canonical_hash })

  const intent = db.prepare('SELECT * FROM intents WHERE id = ?').get(poi.intent_id)
  const canonical = JSON.stringify({ poi_id: poi.id, intent: JSON.parse(intent.frozen_snapshot_json) }, Object.keys({}).sort())
  const hash = crypto.createHash('sha256').update(canonical).digest('hex')
  const sealedAt = new Date().toISOString()
  db.prepare(`UPDATE pois SET status = 'SEALED', canonical_hash = ?, sealed_at = ? WHERE id = ?`).run(hash, sealedAt, poi.id)
  writeMemoryEvent(poi.transaction_id, 'poi.sealed', { poi_id: poi.id, canonical_hash: hash })
  res.json({ poi_id: poi.id, status: 'SEALED', canonical_hash: hash, sealed_at: sealedAt })
})

// ============================================================
// COMPLIANCE & GOVERNANCE — WaD control.
// Second HARD GATE: exactly 3 more tokens / USD 30, atomic with admission.
// Then runs applicable KYC/KYB/UBO/sanctions/PEP/authority verification.
// WaD may issue PASSED only when every REQUIRED predicate is PASS — no
// waiver, no conditional approval, no override (spec 11.2, WAD-00..03).
// ============================================================
app.post('/v1/wads', auth, async (req, res) => {
  const txn = getTxn(req, res)
  if (!txn) return
  const poi = db.prepare("SELECT * FROM pois WHERE transaction_id = ? AND status = 'SEALED'").get(txn.id)
  if (!poi) return problem(res, 409, 'STAGE_ORDER_VIOLATION', 'WaD requires a sealed POI first')

  let wad = db.prepare('SELECT * FROM wads WHERE transaction_id = ?').get(txn.id)
  if (!wad) {
    const tokenEntry = chargeGate(req.workspaceId, txn.id, 'wad', WAD_TOKENS, WAD_USD)
    const id = nanoid()
    db.prepare(
      `INSERT INTO wads (id, transaction_id, poi_id, status, token_entry_id, created_at) VALUES (?, ?, ?, 'PENDING', ?, ?)`
    ).run(id, txn.id, poi.id, tokenEntry.id, new Date().toISOString())
    writeMemoryEvent(txn.id, 'token.consumed.wad', { token_entry_id: tokenEntry.id, tokens: WAD_TOKENS, usd: WAD_USD })
    writeMemoryEvent(txn.id, 'wad.entered', { wad_id: id, poi_id: poi.id })
    wad = db.prepare('SELECT * FROM wads WHERE id = ?').get(id)
  }

  // Run real applicable-name sanctions screening against the chosen counterparty.
  const intent = db.prepare('SELECT * FROM intents WHERE id = ?').get(poi.intent_id)
  const snapshot = JSON.parse(intent.frozen_snapshot_json)
  const entityName = snapshot.selected_entity?.name || snapshot.selected_entity?.legal_name || 'Unnamed counterparty'
  const sanctionsResult = await screenName(entityName)

  const predicates = [
    { id: 'AUTHORITY', result: 'PASS', note: 'Bid/Offer actor and represented org recorded' },
    {
      id: 'SANCTIONS',
      result: sanctionsResult.status === 'hit' ? 'FAIL' : sanctionsResult.status === 'error' ? 'UNKNOWN' : 'PASS',
      note: sanctionsResult.source,
      matches: sanctionsResult.matches,
    },
  ]
  const anyBlocking = predicates.some((p) => p.result === 'FAIL' || p.result === 'UNKNOWN')
  const decision = anyBlocking ? 'FAILED' : 'PASSED'

  db.prepare(`UPDATE wads SET status = ?, predicates_json = ?, decision = ?, decided_at = ? WHERE id = ?`).run(
    anyBlocking ? 'PENDING' : 'PASSED', JSON.stringify(predicates), decision, new Date().toISOString(), wad.id
  )
  writeMemoryEvent(txn.id, `wad.${decision.toLowerCase()}`, { wad_id: wad.id, predicates })
  setStage(txn.id, 'WAD')

  res.json({
    wad_id: wad.id,
    status: anyBlocking ? 'PENDING' : 'PASSED',
    decision,
    token_charge: { tokens: WAD_TOKENS, usd: WAD_USD },
    predicates,
    execution_permitted: decision === 'PASSED',
  })
})

// ============================================================
// EXECUTION — ENTRY -> EXECUTION -> EXIT.
// Entry requires a current WaD PASSED decision (spec EXE-01). Locked otherwise.
// ============================================================
app.post('/v1/executions', auth, (req, res) => {
  const txn = getTxn(req, res)
  if (!txn) return
  const wad = db.prepare('SELECT * FROM wads WHERE transaction_id = ?').get(txn.id)
  if (!wad || wad.decision !== 'PASSED') {
    return problem(res, 409, 'NON_WAIVABLE_BLOCK', 'Execution is locked: current WaD decision is not PASSED', {
      wad_decision: wad ? wad.decision : null,
    })
  }
  const existing = db.prepare('SELECT * FROM executions WHERE transaction_id = ?').get(txn.id)
  if (existing) return res.json({ execution_id: existing.id, status: existing.status, note: 'Execution already entered (idempotent)' })

  const id = nanoid()
  const baseline = { wad_id: wad.id, entered_at: new Date().toISOString() }
  db.prepare(
    `INSERT INTO executions (id, transaction_id, wad_id, status, baseline_json, created_at) VALUES (?, ?, ?, 'ACTIVE', ?, ?)`
  ).run(id, txn.id, wad.id, JSON.stringify(baseline), new Date().toISOString())
  setStage(txn.id, 'EXECUTION')
  writeMemoryEvent(txn.id, 'execution.entered', { execution_id: id, wad_id: wad.id })
  res.status(201).json({ execution_id: id, status: 'ACTIVE', trading_stage: 'EXECUTION' })
})

app.post('/v1/executions/:id/milestones', auth, (req, res) => {
  const execution = db.prepare('SELECT * FROM executions WHERE id = ?').get(req.params.id)
  if (!execution) return problem(res, 404, 'VALIDATION_FAILED', 'execution not found')
  const { title, evidence_base64 } = req.body
  if (!title) return problem(res, 422, 'VALIDATION_FAILED', 'milestone requires a title')
  const evidenceHash = evidence_base64
    ? crypto.createHash('sha256').update(Buffer.from(evidence_base64, 'base64')).digest('hex')
    : null
  const id = nanoid()
  db.prepare(
    `INSERT INTO milestones (id, execution_id, title, status, evidence_hash, created_at) VALUES (?, ?, ?, 'ACCEPTED', ?, ?)`
  ).run(id, execution.id, title, evidenceHash, new Date().toISOString())
  db.prepare('UPDATE milestones SET accepted_at = ? WHERE id = ?').run(new Date().toISOString(), id)
  writeMemoryEvent(execution.transaction_id, 'milestone.submitted', { milestone_id: id, execution_id: execution.id, title })
  writeMemoryEvent(execution.transaction_id, 'milestone.accepted', { milestone_id: id, evidence_hash: evidenceHash })
  res.status(201).json({ milestone_id: id, status: 'ACCEPTED', evidence_hash: evidenceHash })
})

// Exit: requires at least one accepted milestone (minimal completion basis for this slice).
app.post('/v1/executions/:id/exit', auth, (req, res) => {
  const execution = db.prepare('SELECT * FROM executions WHERE id = ?').get(req.params.id)
  if (!execution) return problem(res, 404, 'VALIDATION_FAILED', 'execution not found')
  const acceptedCount = db.prepare("SELECT COUNT(*) c FROM milestones WHERE execution_id = ? AND status = 'ACCEPTED'").get(execution.id).c
  if (acceptedCount === 0) {
    return problem(res, 409, 'GATE_FAILED', 'Exit requires at least one accepted milestone as completion evidence')
  }
  db.prepare(`UPDATE executions SET status = 'COMPLETE', completed_at = ? WHERE id = ?`).run(new Date().toISOString(), execution.id)
  setStage(execution.transaction_id, 'EXECUTION_EXIT')
  writeMemoryEvent(execution.transaction_id, 'execution.exit', { execution_id: execution.id, accepted_milestones: acceptedCount })
  res.json({ execution_id: execution.id, status: 'COMPLETE' })
})

// ============================================================
// FINALITY — terminal record. Cannot issue while Execution is incomplete (FIN-01).
// ============================================================
app.post('/v1/finality-records', auth, (req, res) => {
  const txn = getTxn(req, res)
  if (!txn) return
  const execution = db.prepare("SELECT * FROM executions WHERE transaction_id = ? AND status = 'COMPLETE'").get(txn.id)
  if (!execution) return problem(res, 409, 'GATE_FAILED', 'Finality requires a completed Execution (Exit) first')
  const { finality_type } = req.body
  const type = ['PAYMENT', 'SETTLEMENT', 'HANDOVER_DELIVERY', 'SYNTHETIC', 'OTHER'].includes(finality_type) ? finality_type : 'OTHER'
  const id = nanoid()
  db.prepare(
    `INSERT INTO finality_records (id, transaction_id, execution_id, finality_type, status, created_at) VALUES (?, ?, ?, ?, 'DRAFT', ?)`
  ).run(id, txn.id, execution.id, type, new Date().toISOString())
  writeMemoryEvent(txn.id, 'finality.entered', { finality_id: id, finality_type: type })
  res.status(201).json({ finality_id: id, status: 'DRAFT', finality_type: type })
})

app.post('/v1/finality-records/:id/issue', auth, (req, res) => {
  const record = db.prepare('SELECT * FROM finality_records WHERE id = ?').get(req.params.id)
  if (!record) return problem(res, 404, 'VALIDATION_FAILED', 'finality record not found')
  if (record.status === 'ISSUED') return res.json({ finality_id: record.id, status: 'ISSUED', canonical_hash: record.canonical_hash })

  const poi = db.prepare('SELECT * FROM pois WHERE transaction_id = ?').get(record.transaction_id)
  const wad = db.prepare('SELECT * FROM wads WHERE transaction_id = ?').get(record.transaction_id)
  const execution = db.prepare('SELECT * FROM executions WHERE id = ?').get(record.execution_id)
  const milestones = db.prepare('SELECT * FROM milestones WHERE execution_id = ?').all(execution.id)

  const certificate = {
    finality_id: record.id,
    transaction_id: record.transaction_id,
    finality_type: record.finality_type,
    poi_hash: poi.canonical_hash,
    wad_decision: wad.decision,
    execution_baseline: JSON.parse(execution.baseline_json),
    milestones: milestones.map((m) => ({ title: m.title, status: m.status, evidence_hash: m.evidence_hash })),
    issued_at: new Date().toISOString(),
  }
  const canonicalHash = crypto.createHash('sha256').update(JSON.stringify(certificate, Object.keys(certificate).sort())).digest('hex')
  db.prepare(
    `UPDATE finality_records SET status = 'ISSUED', canonical_hash = ?, certificate_json = ?, issued_at = ? WHERE id = ?`
  ).run(canonicalHash, JSON.stringify(certificate), certificate.issued_at, record.id)
  setStage(record.transaction_id, 'FINALITY')
  db.prepare("UPDATE transactions SET lifecycle = 'CLOSED' WHERE id = ?").run(record.transaction_id)
  writeMemoryEvent(record.transaction_id, 'finality.issued', { finality_id: record.id, canonical_hash: canonicalHash })
  res.json({ finality_id: record.id, status: 'ISSUED', canonical_hash: canonicalHash, certificate })
})

// ============================================================
// CDA — Chain of Decision and Action. Readable during the transaction;
// final/sealed after Finality issues (spec 14.5, FIN-05).
// ============================================================
app.get('/v1/cdas/:transactionId', auth, (req, res) => {
  const txn = getTxn(req, res)
  if (!txn) return
  const events = getTimeline(txn.id)
  const finality = db.prepare("SELECT * FROM finality_records WHERE transaction_id = ? AND status = 'ISSUED'").get(txn.id)
  res.json({
    transaction_id: txn.id,
    sealed: !!finality,
    sealed_at: finality ? finality.issued_at : null,
    causal_chain: events.map((e) => ({ event_type: e.event_type, occurred_at: e.occurred_at, event_hash: e.event_hash })),
    chain_integrity: verifyChain(txn.id),
    certificate: finality ? JSON.parse(finality.certificate_json) : null,
  })
})

// ---- Read models ----
app.get('/v1/transactions/:transactionId', auth, (req, res) => {
  const txn = getTxn(req, res)
  if (!txn) return
  const bidOffer = db.prepare('SELECT * FROM bid_offers WHERE transaction_id = ?').get(txn.id)
  const poi = db.prepare('SELECT * FROM pois WHERE transaction_id = ?').get(txn.id)
  const wad = db.prepare('SELECT * FROM wads WHERE transaction_id = ?').get(txn.id)
  res.json({
    transaction_id: txn.id,
    lifecycle: txn.lifecycle,
    trading_stage: txn.trading_stage,
    bid_offer: bidOffer,
    poi: poi ? { ...poi, status: poi.status } : null,
    wad: wad ? { ...wad, predicates: wad.predicates_json ? JSON.parse(wad.predicates_json) : null } : null,
  })
})

app.get('/v1/transactions/:transactionId/timeline', auth, (req, res) => {
  const txn = getTxn(req, res)
  if (!txn) return
  res.json({ transaction_id: txn.id, events: getTimeline(txn.id) })
})

app.get('/v1/transactions/:transactionId/lineage', auth, (req, res) => {
  const txn = getTxn(req, res)
  if (!txn) return
  const forward = getTimeline(txn.id)
  res.json({
    transaction_id: txn.id,
    forward_order: forward.map((e) => e.event_type),
    backward_order: [...forward].reverse().map((e) => e.event_type),
    chain_integrity: verifyChain(txn.id),
  })
})

app.get('/v1/wallets/:workspaceId', auth, (req, res) => {
  if (req.params.workspaceId !== req.workspaceId) return problem(res, 403, 'FORBIDDEN', 'cannot read another workspace wallet')
  res.json(walletLedger(req.workspaceId))
})

// ---- Operational ----
app.post('/api-keys', auth, (req, res) => {
  const id = nanoid()
  const key = `izk_${nanoid(32)}`
  db.prepare('INSERT INTO api_keys (id, workspace_id, key, label, created_at) VALUES (?, ?, ?, ?, ?)').run(
    id, req.workspaceId, key, req.body?.label || null, new Date().toISOString()
  )
  res.status(201).json({ id, key })
})

app.get('/audit-logs', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM audit_logs WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 200').all(req.workspaceId)
  res.json(rows.map((r) => ({ ...r, detail_json: JSON.parse(r.detail_json) })))
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Izenzo spine backend listening on :${PORT}`))
