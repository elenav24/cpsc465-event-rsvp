import { useState } from 'react'
import { useAuth } from './AuthContext'
import { redirectToGoogle } from './googleLogin'

export default function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2>Sign in</h2>
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
        autoComplete="current-password"
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
      <div className="divider">or</div>
      <button type="button" className="google-btn" onClick={redirectToGoogle}>Continue with Google</button>
      <button type="button" className="link" onClick={onSwitch}>Don't have an account? Sign up</button>
    </form>
  )
}
