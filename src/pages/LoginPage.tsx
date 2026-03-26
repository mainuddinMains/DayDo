import { useState, useEffect, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { supabase }     from '../lib/supabase'
import Toaster          from '../components/Toaster'

/* ── Google brand icon (inline SVG) ─────────────────────────────────────────── */

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

/* ── Mode types ─────────────────────────────────────────────────────────────── */

type Mode = 'signin' | 'signup' | 'forgot'

/* ── Component ──────────────────────────────────────────────────────────────── */

export default function LoginPage() {
  const [mode,       setMode]       = useState<Mode>('signin')
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [fullName,   setFullName]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notice,     setNotice]     = useState('')

  const signIn           = useAuthStore((s) => s.signIn)
  const signUp           = useAuthStore((s) => s.signUp)
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle)
  const error            = useAuthStore((s) => s.error)
  const clearError       = useAuthStore((s) => s.clearError)

  /* Clear errors when switching modes */
  useEffect(() => {
    clearError()
  }, [mode, clearError])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setNotice('')

    if (mode === 'signin') {
      await signIn(email, password)

    } else if (mode === 'signup') {
      await signUp(email, password, fullName)
      if (!useAuthStore.getState().error) {
        setNotice('Almost there — check your inbox to confirm your account.')
      }

    } else {
      /* forgot */
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (resetErr) {
        setNotice('')
        useAuthStore.setState({ error: resetErr.message })
      } else {
        setNotice('Password reset email sent. Check your inbox.')
      }
    }

    setSubmitting(false)
  }

  return (
    <div className="auth-page">
      {/* Toaster lives outside AppShell so we render it here too */}
      <Toaster />

      <div className="auth-card">
        {/* ── Logo ── */}
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo__mark">✦</span>
            <span className="auth-logo__text">DayDo</span>
          </div>
          <p className="auth-tagline">Your tasks, unified.</p>
        </div>

        {/* ── Mode tabs ── */}
        {mode !== 'forgot' && (
          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              className={`auth-tab ${mode === 'signin' ? 'auth-tab--active' : ''}`}
              onClick={() => { setMode('signin'); setNotice('') }}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={`auth-tab ${mode === 'signup' ? 'auth-tab--active' : ''}`}
              onClick={() => { setMode('signup'); setNotice('') }}
            >
              Create account
            </button>
          </div>
        )}

        {/* ── Form ── */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>

          {mode === 'forgot' && (
            <button
              type="button"
              className="auth-back-link"
              onClick={() => { setMode('signin'); setNotice('') }}
            >
              ← Back to sign in
            </button>
          )}

          {mode === 'signup' && (
            <div className="form-field">
              <label className="form-label" htmlFor="auth-name">Full name</label>
              <input
                id="auth-name"
                className="form-input"
                type="text"
                autoComplete="name"
                placeholder="Jane Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

          <div className="form-field">
            <label className="form-label" htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              className="form-input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {mode !== 'forgot' && (
            <div className="form-field">
              <div className="auth-password-header">
                <label className="form-label" htmlFor="auth-password">Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    className="auth-text-btn"
                    onClick={() => { setMode('forgot'); setNotice('') }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                id="auth-password"
                className="form-input"
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          {error  && <p className="auth-message auth-message--error"  role="alert">{error}</p>}
          {notice && <p className="auth-message auth-message--success" role="status">{notice}</p>}

          <button
            type="submit"
            className="btn btn--primary auth-submit"
            disabled={submitting}
          >
            {submitting && <Loader2 size={14} className="spin" aria-hidden="true" />}
            {mode === 'signin'  ? 'Sign in'
              : mode === 'signup' ? 'Create account'
              : 'Send reset email'}
          </button>
        </form>

        {/* ── OAuth ── */}
        {mode !== 'forgot' && (
          <>
            <div className="auth-divider"><span>or</span></div>
            <div className="auth-oauth">
              <button
                type="button"
                className="auth-google-btn"
                onClick={signInWithGoogle}
              >
                <GoogleIcon />
                Continue with Google
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
