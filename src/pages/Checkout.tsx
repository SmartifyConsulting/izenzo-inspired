import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { Card, Badge } from '../components/ui'
import * as api from '../lib/api'

export default function Checkout() {
  const { sessionId } = useParams()
  const [session, setSession] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sessionId) return
    api.getTokenPurchase(sessionId).then(setSession).catch((e) => setError(e.message))
  }, [sessionId])

  async function pay() {
    if (!sessionId) return
    setBusy(true)
    setError('')
    try {
      const result = await api.settlePayment(sessionId)
      setSession((s: any) => ({ ...s, status: result.status, settled_at: result.settled_at }))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Layout shortFooter>
      <div className="max-w-[480px] mx-auto px-4 sm:px-6 py-24">
        <Badge>Sandbox Checkout</Badge>
        <h1 className="mt-6 text-2xl font-semibold text-foreground mb-2">Simulated payment</h1>
        <p className="text-sm text-muted-foreground mb-8">
          No real money moves here. This stands in for a hosted payment page (e.g. PayFast); clicking
          "Pay" fires the same signed-callback settlement flow a real provider would use.
        </p>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {!session ? (
          <p className="text-sm text-muted-foreground">Loading session…</p>
        ) : (
          <Card className="p-6">
            <div className="space-y-2 text-sm mb-6">
              <div className="flex justify-between"><span className="text-muted-foreground">Tokens</span><span className="text-foreground font-medium">{session.tokens}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="text-foreground font-medium">${session.usd.toFixed(2)} USD</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={session.status === 'SETTLED' ? 'text-emerald-brand font-medium' : 'text-foreground'}>{session.status}</span></div>
            </div>
            {session.status === 'SETTLED' ? (
              <p className="text-sm text-emerald-brand font-medium">Payment settled — tokens credited to your wallet.</p>
            ) : (
              <button
                onClick={pay}
                disabled={busy}
                className="w-full h-11 rounded-md bg-emerald-brand text-white text-sm font-semibold hover:bg-emerald-bright transition-colors disabled:opacity-60"
              >
                {busy ? 'Processing…' : `Pay $${session.usd.toFixed(2)} (sandbox)`}
              </button>
            )}
          </Card>
        )}
      </div>
    </Layout>
  )
}
