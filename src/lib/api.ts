const API_BASE = 'http://localhost:4000'

let token: string | null = localStorage.getItem('izenzo_demo_token')

function authHeaders() {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function req(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`)
  return data
}

export async function ensureSession() {
  if (token) return token
  const email = `demo-${Date.now()}@izenzo-diligence.local`
  const data = await req('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name: 'Live Demo', email, password: 'demo-pass-12345' }),
  })
  token = data.token
  localStorage.setItem('izenzo_demo_token', token!)
  return token
}

export async function healthCheck() {
  return req('/healthz')
}

export async function createEntity(payload: {
  legal_name: string
  jurisdiction?: string
  registration_number?: string
  ubos?: { name: string; ownership_pct: number }[]
}) {
  await ensureSession()
  return req('/entities', { method: 'POST', body: JSON.stringify(payload) })
}

export async function screenEntity(entityId: string) {
  await ensureSession()
  return req(`/entities/${entityId}/screen`, { method: 'POST' })
}

export async function getEntities() {
  await ensureSession()
  return req('/entities')
}

export async function createMatch(payload: {
  commodity: string
  volume_mt: number
  price_usd: number
  incoterms: string
}) {
  await ensureSession()
  return req('/match', { method: 'POST', body: JSON.stringify(payload) })
}

export async function advanceGate(matchId: string, gateIndex: number) {
  await ensureSession()
  return req(`/match/${matchId}/gate/${gateIndex}`, { method: 'POST', body: JSON.stringify({}) })
}

export async function getMatch(matchId: string) {
  await ensureSession()
  return req(`/match/${matchId}`)
}

export async function settleMatch(matchId: string) {
  await ensureSession()
  return req(`/match/${matchId}/settle`, { method: 'POST' })
}

export async function getEvidencePack(matchId: string) {
  await ensureSession()
  return req(`/evidence-pack/${matchId}`)
}

export async function issueCertificate(matchId: string) {
  await ensureSession()
  return req('/p3-wad', { method: 'POST', body: JSON.stringify({ match_id: matchId }) })
}

export async function getAuditLogs() {
  await ensureSession()
  return req('/audit-logs')
}
