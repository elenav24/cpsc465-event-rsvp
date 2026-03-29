import { FormEvent, useState } from 'react'
import { CognitoUser, CognitoUserAttribute } from 'amazon-cognito-identity-js'
import userPool from './cognitoConfig'
import { useAuth } from './AuthContext'

export default function SignupForm({ onSwitch }: { onSwitch: () => void }) {
  const { login } = useAuth()
  const [step, setStep] = useState<'register' | 'confirm'>('register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    await new Promise<void>((resolve, reject) => {
      userPool.signUp(
        email,
        password,
        [new CognitoUserAttribute({ Name: 'email', Value: email })],
        [],
        (err) => (err ? reject(err) : resolve()),
      )
    }).then(() => setStep('confirm')).catch((err) => setError(err.message)).finally(() => setLoading(false))
  }

  const handleConfirm = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const cognitoUser = new CognitoUser({ Username: email, Pool: userPool })
    await new Promise<void>((resolve, reject) => {
      cognitoUser.confirmRegistration(code, true, (err) => (err ? reject(err) : resolve()))
    })
      .then(() => login(email, password))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  if (step === 'confirm') return (
    <form onSubmit={handleConfirm} className="login-form">
      <h2>Check your email</h2>
      <p style={{ margin: 0, fontSize: 14, color: '#666' }}>We sent a code to {email}</p>
      <input
        type="text"
        placeholder="Confirmation code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        required
        autoComplete="one-time-code"
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>{loading ? 'Confirming…' : 'Confirm'}</button>
    </form>
  )

  return (
    <form onSubmit={handleRegister} className="login-form">
      <h2>Create account</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="new-password"
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>{loading ? 'Creating account…' : 'Sign up'}</button>
      <button type="button" className="link" onClick={onSwitch}>Already have an account? Sign in</button>
    </form>
  )
}
