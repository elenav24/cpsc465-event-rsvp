import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CognitoUser, CognitoUserAttribute } from 'amazon-cognito-identity-js'
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

type Step = 'register' | 'confirm'

export default function SignupPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await new Promise<void>((resolve, reject) => {
        userPool.signUp(
          email,
          password,
          [new CognitoUserAttribute({ Name: 'email', Value: email })],
          [],
          (err) => (err ? reject(err) : resolve()),
        )
      })
      setStep('confirm')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool })
      await new Promise<void>((resolve, reject) => {
        cognitoUser.confirmRegistration(code, true, (err) => (err ? reject(err) : resolve()))
      })
      await login(email, password)
      navigate('/events')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Confirmation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-body">
        <div className="auth-card">
          {step === 'register' ? (
            <>
              <h1 className="auth-title">Create an account</h1>

              <button type="button" className="btn-google" onClick={redirectToGoogle}>
                <GoogleIcon /> Continue with Google
              </button>

              <div className="auth-or">OR</div>

              <form onSubmit={handleRegister}>
                <label className="auth-label">Email address</label>
                <input
                  className="auth-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  autoFocus
                />

                <label className="auth-label">
                  Your password
                  <span className="forgot-link" onClick={() => setShowPw((p) => !p)}>
                    {showPw ? 'Hide' : 'Show'}
                  </span>
                </label>
                <input
                  className="auth-input"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />

                {error && <p className="auth-error" role="alert">⚠ {error}</p>}

                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Creating account…' : 'Sign up'}
                </button>
              </form>

              <div className="auth-switch">
                <div className="auth-switch-bar">Already have an account?</div>
                <Link to="/login" className="btn-switch">Log in</Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="auth-title">Check your email</h1>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                We sent a 6-digit code to <strong>{email}</strong>
              </p>

              <form onSubmit={handleConfirm}>
                <label className="auth-label">Confirmation code</label>
                <input
                  className="auth-input"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  required
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  autoFocus
                  style={{ letterSpacing: '4px', fontSize: '1.2rem', textAlign: 'center' }}
                />

                {error && <p className="auth-error" role="alert">⚠ {error}</p>}

                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Confirming…' : 'Confirm & sign in'}
                </button>
              </form>

              <div className="auth-switch">
                <div className="auth-switch-bar" />
                <button
                  className="btn-switch"
                  onClick={() => { setStep('register'); setError(null) }}
                >
                  ← Back
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .auth-page {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding-top: var(--nav-height);
          width: 100%;
        }
        .auth-body {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 1rem;
        }
        .auth-card {
          background: white;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border);
          padding: 3rem 2.5rem;
          width: 100%;
          max-width: 480px;
          box-shadow: var(--shadow);
        }
        .auth-title {
          font-family: 'Cantora One', cursive;
          font-size: 1.9rem;
          text-align: center;
          margin-bottom: 2rem;
          color: var(--text-dark);
        }
        .btn-google {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: white;
          border: 1.5px solid var(--border);
          border-radius: 100px;
          padding: 12px;
          font-family: 'Albert Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-google:hover {
          border-color: #aaa;
          box-shadow: var(--shadow-sm);
        }
        .auth-or {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 1.5rem 0;
          color: var(--text-muted);
          font-size: 0.85rem;
        }
        .auth-or::before, .auth-or::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }
        .auth-label {
          font-size: 0.88rem;
          color: var(--text-mid);
          margin-bottom: 6px;
          display: flex;
          justify-content: space-between;
        }
        .auth-input {
          width: 100%;
          border: 1.5px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 11px 14px;
          font-family: 'Albert Sans', sans-serif;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s;
          margin-bottom: 1rem;
          background: white;
          color: var(--text-dark);
        }
        .auth-input:focus { border-color: var(--pink); }
        .auth-error {
          color: var(--danger);
          font-size: 0.85rem;
          margin-bottom: 1rem;
        }
        .btn-submit {
          width: 100%;
          background: var(--pink);
          color: white;
          border: none;
          border-radius: 100px;
          padding: 14px;
          font-family: 'Albert Sans', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-submit:hover:not(:disabled) { background: #b04068; }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .forgot-link {
          font-size: 0.82rem;
          color: var(--text-muted);
          text-decoration: underline;
          cursor: pointer;
        }
        .auth-switch {
          text-align: center;
          margin-top: 2rem;
        }
        .auth-switch-bar {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
          color: var(--text-muted);
          font-size: 0.85rem;
        }
        .auth-switch-bar::before, .auth-switch-bar::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }
        .btn-switch {
          display: block;
          width: 100%;
          background: none;
          border: 1.5px solid var(--border);
          border-radius: 100px;
          padding: 12px;
          font-family: 'Albert Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--pink);
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          text-decoration: none;
        }
        .btn-switch:hover {
          border-color: var(--pink);
          background: var(--pink-bg);
          text-decoration: none;
          color: var(--pink);
        }
        @media (max-width: 480px) {
          .auth-card { padding: 2rem 1.25rem; }
        }
      `}</style>
    </div>
  )
}
