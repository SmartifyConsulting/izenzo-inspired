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
  if (!res.ok) {
    const err = new Error(data.title || data.error || `Request failed: ${res.status}`) as Error & { data?: unknown }
    err.data = data
    throw err
  }
  return data
}

export async function newSession() {
  const email = `demo-${Date.now()}@izenzo-diligence.local`
  const data = await req('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name: 'Live Demo', email, password: 'demo-pass-12345' }),
  })
  token = data.token
  localStorage.setItem('izenzo_demo_token', token!)
  return { workspace_id: data.workspace_id }
}

export async function ensureSession() {
  if (!token) await newSession()
  return token
}

export function isLoggedIn() {
  return !!token
}

export function currentWorkspaceId(): string | null {
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.workspace_id
  } catch {
    return null
  }
}

export function logout() {
  token = null
  localStorage.removeItem('izenzo_demo_token')
}

export async function signUp(name: string, email: string, password: string) {
  const data = await req('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) })
  token = data.token
  localStorage.setItem('izenzo_demo_token', token!)
  return { workspace_id: data.workspace_id }
}

export async function signIn(email: string, password: string) {
  const data = await req('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  token = data.token
  localStorage.setItem('izenzo_demo_token', token!)
  return { workspace_id: data.workspace_id }
}

export const createTokenPurchase = (tokens: number) => req('/v1/token-purchases', { method: 'POST', body: JSON.stringify({ tokens }) })
export const getTokenPurchase = (id: string) => req(`/v1/token-purchases/${id}`)
export const settlePayment = (id: string) => req(`/v1/token-purchases/${id}/webhook`, { method: 'POST' })

export const healthCheck = () => req('/healthz')

export const createBidOffer = (payload: object) => req('/v1/bid-offers', { method: 'POST', body: JSON.stringify(payload) })
export const createOtherDocument = (payload: object) => req('/v1/other-documents', { method: 'POST', body: JSON.stringify(payload) })
export const createSocialNewsItem = (payload: object) => req('/v1/social-news-items', { method: 'POST', body: JSON.stringify(payload) })
export const createSearchRun = (payload: object) => req('/v1/search-runs', { method: 'POST', body: JSON.stringify(payload) })
export const createAiAnalysis = (payload: object) => req('/v1/ai-analyses', { method: 'POST', body: JSON.stringify(payload) })
export const createDecisionSession = (payload: object) => req('/v1/decision-sessions', { method: 'POST', body: JSON.stringify(payload) })
export const generateChoiceSet = (id: string) => req(`/v1/decision-sessions/${id}/generate`, { method: 'POST' })
export const materialiseCounterparties = (transactionId: string) =>
  req(`/v1/transactions/${transactionId}/counterparties/materialise`, { method: 'POST' })
export const createChoice = (transactionId: string, payload: object) =>
  req(`/v1/transactions/${transactionId}/choices`, { method: 'POST', body: JSON.stringify(payload) })
export const createIntent = (transactionId: string) =>
  req(`/v1/transactions/${transactionId}/intent`, { method: 'POST' })
export const createPoi = (payload: object) => req('/v1/pois', { method: 'POST', body: JSON.stringify(payload) })
export const sealPoi = (id: string) => req(`/v1/pois/${id}/seal`, { method: 'POST' })
export const createWad = (payload: object) => req('/v1/wads', { method: 'POST', body: JSON.stringify(payload) })
export const createExecution = (payload: object) => req('/v1/executions', { method: 'POST', body: JSON.stringify(payload) })
export const createMilestone = (executionId: string, payload: object) =>
  req(`/v1/executions/${executionId}/milestones`, { method: 'POST', body: JSON.stringify(payload) })
export const exitExecution = (executionId: string) => req(`/v1/executions/${executionId}/exit`, { method: 'POST' })
export const createFinality = (payload: object) => req('/v1/finality-records', { method: 'POST', body: JSON.stringify(payload) })
export const issueFinality = (id: string) => req(`/v1/finality-records/${id}/issue`, { method: 'POST' })
export const getCda = (transactionId: string) => req(`/v1/cdas/${transactionId}`)
export const getLineage = (transactionId: string) => req(`/v1/transactions/${transactionId}/lineage`)
export const getWallet = (workspaceId: string) => req(`/v1/wallets/${workspaceId}`)
export const listTransactions = () => req('/v1/transactions')
export const getAuditLogs = () => req('/audit-logs')
