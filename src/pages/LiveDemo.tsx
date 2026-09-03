import { useState } from 'react'
import { Layout } from '../components/Layout'
import { Badge, Card } from '../components/ui'
import * as api from '../lib/api'

type LogLine = { label: string; ok: boolean; detail: string }

export default function LiveDemo() {
  const [busy, setBusy] = useState(false)
  const [logs, setLogs] = useState<LogLine[]>([])
  const [entity, setEntity] = useState<any>(null)
  const [screenResult, setScreenResult] = useState<any>(null)
  const [match, setMatch] = useState<any>(null)
  const [settled, setSettled] = useState<any>(null)
  const [uboName, setUboName] = useState('Vladimir Putin')
  const [companyName, setCompanyName] = useState('Test Trading Co (Diligence Demo)')

  function pushLog(label: string, ok: boolean, detail: string) {
    setLogs((l) => [...l, { label, ok, detail }])
  }

  async function runFullFlow() {
    setBusy(true)
    setLogs([])
    setEntity(null)
    setScreenResult(null)
    setMatch(null)
    setSettled(null)
    try {
      const health = await api.healthCheck()
      pushLog('Backend health check', true, `status=${health.status}`)

      const e = await api.createEntity({
        legal_name: companyName,
        jurisdiction: 'ZA',
        ubos: [{ name: uboName, ownership_pct: 100 }],
      })
      setEntity(e)
      pushLog('Entity registered', true, `id=${e.id}`)

      const screened = await api.screenEntity(e.id)
      setScreenResult(screened)
      const uboHit = screened.entity_result?.status === 'hit'
      pushLog(
        'Live OFAC sanctions screening',
        true,
        uboHit ? 'HIT — entity name matched sanctions list' : 'entity clear (see UBO result below)'
      )

      const m = await api.createMatch({
        commodity: 'Copper Cathode',
        volume_mt: 500,
        price_usd: 9420,
        incoterms: 'CIF Rotterdam',
      })
      setMatch(m)
      pushLog('Match created', true, `match_id=${m.match_id}, gates 0/9`)

      for (let i = 0; i < 9; i++) {
        await api.advanceGate(m.match_id, i)
      }
      pushLog('All 9 gates advanced', true, 'server-verified sequentially, not simulated')

      const s = await api.settleMatch(m.match_id)
      setSettled(s)
      pushLog('Match settled + hash-sealed', true, `SHA-256: ${s.payload_hash}`)
    } catch (err: any) {
      pushLog('Error', false, err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-16">
        <Badge>Live Backend Demo</Badge>
        <h1 className="mt-6 text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-4">
          This runs against a real server.
        </h1>
        <p className="text-muted-foreground mb-2 max-w-xl">
          Every step below calls a genuine backend at <code className="text-xs bg-muted px-1.5 py-0.5 rounded">localhost:4000</code> —
          real database writes, real SHA-256 hashing, and real sanctions screening against the current US Treasury
          OFAC SDN list. Nothing here is a static mockup.
        </p>
        <p className="text-xs text-muted-foreground/60 mb-8">
          Tip: try "Vladimir Putin" as the UBO name (a real OFAC-listed individual) to see a genuine sanctions hit,
          or change it to a random name to see a clear result.
        </p>

        <Card className="p-6 mb-8">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Company / entity name</label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full h-10 rounded-md border border-border px-3 text-sm outline-none focus:border-emerald-brand"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">UBO / beneficial owner name</label>
              <input
                value={uboName}
                onChange={(e) => setUboName(e.target.value)}
                className="w-full h-10 rounded-md border border-border px-3 text-sm outline-none focus:border-emerald-brand"
              />
            </div>
          </div>
          <button
            onClick={runFullFlow}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-md text-sm font-semibold bg-emerald-brand text-white shadow-md hover:-translate-y-0.5 hover:bg-emerald-bright transition-all disabled:opacity-60 disabled:pointer-events-none"
          >
            {busy ? 'Running…' : 'Run full workflow live'}
          </button>
        </Card>

        {logs.length > 0 && (
          <div className="rounded-md border border-border bg-card p-6 mb-8 font-mono text-xs space-y-2">
            {logs.map((l, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={l.ok ? 'text-emerald-brand' : 'text-red-600'}>{l.ok ? '✓' : '✗'}</span>
                <span className="text-foreground font-medium w-56 shrink-0">{l.label}</span>
                <span className="text-muted-foreground">{l.detail}</span>
              </div>
            ))}
          </div>
        )}

        {screenResult && (
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <Card className="p-5">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60 mb-2">
                Entity screening result
              </p>
              <pre className="text-[10px] font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(screenResult.entity_result, null, 2)}
              </pre>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60 mb-2">
                KYB status (derived from real result)
              </p>
              <p className={`text-lg font-semibold ${screenResult.kyb_status === 'flagged' ? 'text-red-600' : 'text-emerald-brand'}`}>
                {screenResult.kyb_status}
              </p>
            </Card>
          </div>
        )}

        {settled && (
          <Card dark className="p-6 font-mono text-xs">
            <p className="text-sm font-sans font-semibold mb-4">Settled &amp; hash-sealed match</p>
            <div className="space-y-1.5 text-white/70">
              <div className="flex justify-between"><span>match_id</span><span>{settled.match_id}</span></div>
              <div className="flex justify-between"><span>status</span><span className="text-emerald-brand">{settled.status}</span></div>
              <div className="flex justify-between"><span>settled_at</span><span>{settled.settled_at}</span></div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 break-all text-white/50">
              SHA-256: {settled.payload_hash}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}
