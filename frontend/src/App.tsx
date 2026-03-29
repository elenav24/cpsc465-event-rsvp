import { useState } from 'react'
import { useAuth } from './auth/AuthContext'
import LoginForm from './auth/LoginForm'
import SignupForm from './auth/SignupForm'
import './App.css'

export default function App() {
  const { user, loading, logout } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  if (loading) return <div className="center">Loading…</div>

  if (!user) return (
    <div className="center">
      {mode === 'login'
        ? <LoginForm onSwitch={() => setMode('signup')} />
        : <SignupForm onSwitch={() => setMode('login')} />}
    </div>
  )

  return (
    <div className="center">
      <h1>Welcome</h1>
      <p>{user.getUsername()}</p>
      <button onClick={logout}>Sign out</button>
    </div>
  )
}
