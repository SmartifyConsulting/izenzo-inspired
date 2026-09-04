import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { MeshBackground } from '../components/ui'
import * as api from '../lib/api'

export default function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setBusy(true)
    try {
      if (mode === 'signup') {
        await api.signUp(name || email.split('@')[0], email, password)
      } else {
        await api.signIn(email, password)
      }
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-card">
      <MeshBackground />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
      <header className="relative z-10 max-w-[1280px] mx-auto w-full px-4 sm:px-6 h-20 flex items-center gap-2 text-sm text-muted-foreground">
        <Logo />
        <Link to="/" className="hover:text-foreground">
          Back to Izenzo home
        </Link>
      </header>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-md border border-border bg-card shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            {mode === 'signin' ? 'Sign in' : 'Create your account'}
          </h2>

          <div className="space-y-3 mb-6">
            <button
              type="button"
              disabled
              title="OAuth is not implemented in this build"
              className="w-full h-11 rounded-md border border-border text-sm font-medium text-muted-foreground/50 flex items-center justify-center gap-2 cursor-not-allowed"
            >
              Continue with Microsoft
            </button>
            <button
              type="button"
              disabled
              title="OAuth is not implemented in this build"
              className="w-full h-11 rounded-md border border-border text-sm font-medium text-muted-foreground/50 flex items-center justify-center gap-2 cursor-not-allowed"
            >
              Continue with Google
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground/60 font-mono uppercase">Or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Trader"
                  className="w-full h-11 rounded-md border border-border px-3 text-sm outline-none focus:border-emerald-brand"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@institution.com"
                className="w-full h-11 rounded-md border border-border px-3 text-sm outline-none focus:border-emerald-brand"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-muted-foreground">Password</label>
                {mode === 'signin' && (
                  <span className="text-xs text-muted-foreground/40" title="Password reset is not implemented in this build">
                    Forgot password?
                  </span>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signin' ? '••••••••' : 'Minimum 8 characters'}
                className="w-full h-11 rounded-md border border-border px-3 text-sm outline-none focus:border-emerald-brand"
              />
            </div>
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Confirm password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full h-11 rounded-md border border-border px-3 text-sm outline-none focus:border-emerald-brand"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full h-11 rounded-md bg-emerald-brand text-white text-sm font-semibold hover:bg-emerald-bright transition-colors disabled:opacity-60"
            >
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === 'signin' ? (
              <>
                New to Izenzo?{' '}
                <button onClick={() => { setMode('signup'); setError('') }} className="text-emerald-brand font-medium">
                  Create account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={() => { setMode('signin'); setError('') }} className="text-emerald-brand font-medium">
                  Sign in
                </button>
              </>
            )}
          </p>

          <p className="text-center text-[11px] text-muted-foreground/50 mt-6 leading-relaxed">
            Data is processed within our single approved production region policy. By continuing you agree to our{' '}
            <Link to="/trust" className="underline">
              Trust, Security &amp; Privacy
            </Link>{' '}
            terms.
          </p>
        </div>
      </div>
    </div>
  )
}
