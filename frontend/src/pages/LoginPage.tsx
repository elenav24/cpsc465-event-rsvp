import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CognitoUser } from 'amazon-cognito-identity-js'
import userPool from '../auth/cognitoConfig'
import { useAuth } from '../auth/AuthContext'
import { redirectToGoogle } from '../auth/googleLogin'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

type Step = 'login' | 'forgot-request' | 'forgot-confirm'

const inputClass = 'w-full border-[1.5px] border-border rounded-[var(--radius-sm)] px-[14px] py-[11px] font-sans text-[0.95rem] outline-none transition-[border-color] duration-200 mb-4 bg-white text-text-dark focus:border-pink'
const btnPrimary = 'w-full bg-pink text-white border-none rounded-full py-[14px] font-sans text-[1rem] font-semibold cursor-pointer transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:enabled:bg-accent-dark'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const reset = () => { setError(null); setInfo(null) }

  // ── Step 1: Sign in ──────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    reset()
    setLoading(true)
    try {
      await login(email, password)
      navigate('/events')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Request reset code ───────────────────────────────
  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    reset()
    setLoading(true)
    try {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool })
      await new Promise<void>((resolve, reject) => {
        cognitoUser.forgotPassword({
          onSuccess: () => resolve(),
          onFailure: reject,
        })
      })
      setInfo(`A reset code was sent to ${email}`)
      setStep('forgot-confirm')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not send reset code. Check your email and try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 3: Confirm new password ─────────────────────────────
  const handleForgotConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    reset()
    setLoading(true)
    try {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool })
      await new Promise<void>((resolve, reject) => {
        cognitoUser.confirmPassword(resetCode, newPassword, {
          onSuccess: () => resolve(),
          onFailure: reject,
        })
      })
      // Auto sign-in with new password
      await login(email, newPassword)
      navigate('/events')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not reset password. Check the code and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col pt-[var(--nav-height)] w-full">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-[var(--radius-xl)] border-r border-b border-[#973B69] border-l border-t border-l-[#e8e4ed] border-t-[#e8e4ed] w-full max-w-[480px] px-10 py-12 shadow-[4px_4px_0px_#973B69] max-[480px]:px-5 max-[480px]:py-8">

          {/* ── Login ── */}
          {step === 'login' && (
            <>
              <h1 className="font-heading text-[1.9rem] text-center mb-8 text-text-dark">Sign in</h1>

              <button
                type="button"
                className="w-full flex items-center justify-center gap-[10px] bg-white border-[1.5px] border-border rounded-full py-3 font-sans text-[0.95rem] font-medium cursor-pointer transition-all duration-200 hover:border-[#aaa] hover:shadow-[var(--shadow-sm)]"
                onClick={redirectToGoogle}
              >
                <GoogleIcon /> Continue with Google
              </button>

              <div className="flex items-center gap-4 my-6 text-text-muted text-[0.85rem] before:content-[''] before:flex-1 before:h-px before:bg-border after:content-[''] after:flex-1 after:h-px after:bg-border">
                OR
              </div>

              <form onSubmit={handleLogin}>
                <label className="text-[0.88rem] text-[#555] mb-[6px] block">Email address</label>
                <input
                  className={inputClass}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  autoFocus
                />

                <div className="flex justify-between items-center mb-[6px]">
                  <label className="text-[0.88rem] text-[#555]">Your password</label>
                  <button
                    type="button"
                    className="text-[0.82rem] text-text-muted underline cursor-pointer bg-none border-none p-0 hover:text-pink transition-colors"
                    onClick={() => { reset(); setStep('forgot-request') }}
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  className={inputClass}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />

                {error && <p className="text-danger text-[0.85rem] mb-4" role="alert">⚠ {error}</p>}

                <button type="submit" className={btnPrimary} disabled={loading}>
                  {loading ? 'Signing in…' : 'Log in'}
                </button>
              </form>

              <div className="text-center mt-8">
                <div className="flex items-center gap-4 mb-4 text-text-muted text-[0.85rem] before:content-[''] before:flex-1 before:h-px before:bg-border after:content-[''] after:flex-1 after:h-px after:bg-border">
                  New to Cohosted?
                </div>
                <Link
                  to="/signup"
                  className="block w-full bg-transparent border-[1.5px] border-border rounded-full py-3 font-sans text-[0.95rem] font-semibold text-pink cursor-pointer transition-all duration-200 text-center no-underline hover:border-pink hover:bg-pink-bg hover:no-underline hover:text-pink"
                >
                  Create an account
                </Link>
              </div>
            </>
          )}

          {/* ── Forgot — enter email ── */}
          {step === 'forgot-request' && (
            <>
              <h1 className="font-heading text-[1.9rem] text-center mb-3 text-text-dark">Reset password</h1>
              <p className="text-center text-text-muted text-[0.9rem] mb-8">
                Enter your email and we'll send you a reset code.
              </p>

              <form onSubmit={handleForgotRequest}>
                <label className="text-[0.88rem] text-[#555] mb-[6px] block">Email address</label>
                <input
                  className={inputClass}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  autoFocus
                />

                {error && <p className="text-danger text-[0.85rem] mb-4" role="alert">⚠ {error}</p>}

                <button type="submit" className={btnPrimary} disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset code'}
                </button>
              </form>

              <button
                className="mt-4 w-full text-[0.88rem] text-text-muted bg-none border-none cursor-pointer underline hover:text-pink transition-colors"
                onClick={() => { reset(); setStep('login') }}
              >
                ← Back to sign in
              </button>
            </>
          )}

          {/* ── Forgot — enter code + new password ── */}
          {step === 'forgot-confirm' && (
            <>
              <h1 className="font-heading text-[1.9rem] text-center mb-3 text-text-dark">New password</h1>
              {info && (
                <p className="text-center text-[0.88rem] text-success mb-6 bg-[#e6f9ee] border border-[#b7ebc8] rounded-lg px-4 py-3">
                  {info}
                </p>
              )}

              <form onSubmit={handleForgotConfirm}>
                <label className="text-[0.88rem] text-[#555] mb-[6px] block">Reset code</label>
                <input
                  className={inputClass}
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="123456"
                  required
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  autoFocus
                  style={{ letterSpacing: '4px', fontSize: '1.2rem' }}
                />

                <label className="text-[0.88rem] text-[#555] mb-[6px] block">New password</label>
                <input
                  className={inputClass}
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />

                {error && <p className="text-danger text-[0.85rem] mb-4" role="alert">⚠ {error}</p>}

                <button type="submit" className={btnPrimary} disabled={loading}>
                  {loading ? 'Resetting…' : 'Reset & sign in'}
                </button>
              </form>

              <button
                className="mt-4 w-full text-[0.88rem] text-text-muted bg-none border-none cursor-pointer underline hover:text-pink transition-colors"
                onClick={() => { reset(); setStep('forgot-request') }}
              >
                ← Resend code
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
