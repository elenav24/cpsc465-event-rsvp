import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { CognitoUser, AuthenticationDetails, CognitoUserSession } from 'amazon-cognito-identity-js'
import userPool from './cognitoConfig'

interface AuthState {
  user: CognitoUser | null
  session: CognitoUserSession | null
  loading: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  getToken: () => string | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, session: null, loading: true })

  // Restore session on mount
  useEffect(() => {
    const currentUser = userPool.getCurrentUser()
    if (!currentUser) {
      setState({ user: null, session: null, loading: false })
      return
    }
    currentUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) {
        setState({ user: null, session: null, loading: false })
      } else {
        setState({ user: currentUser, session, loading: false })
      }
    })
  }, [])

  const login = (email: string, password: string) =>
    new Promise<void>((resolve, reject) => {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool })
      const authDetails = new AuthenticationDetails({ Username: email, Password: password })

      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (session) => {
          setState({ user: cognitoUser, session, loading: false })
          resolve()
        },
        onFailure: reject,
      })
    })

  const logout = () => {
    state.user?.signOut()
    setState({ user: null, session: null, loading: false })
  }

  const getToken = () => state.session?.getIdToken().getJwtToken() ?? null

  return (
    <AuthContext.Provider value={{ ...state, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
