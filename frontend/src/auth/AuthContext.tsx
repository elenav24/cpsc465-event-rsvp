import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { CognitoUser, AuthenticationDetails, CognitoUserSession } from 'amazon-cognito-identity-js'
import userPool from './cognitoConfig'
import { setTokenGetter } from '../api/client'
import { getMe } from '../api/users'
import type { UserOut } from '../api/types'

const DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID

interface AuthState {
  user: CognitoUser | null
  session: CognitoUserSession | null
  profile: UserOut | null
  loading: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  getToken: () => string | null
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function exchangeCodeForTokens(code: string): Promise<void> {
  const redirectUri = window.location.origin
  const res = await fetch(`${DOMAIN}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      code,
      redirect_uri: redirectUri,
    }),
  })
  if (!res.ok) throw new Error('Token exchange failed')
  const tokens = await res.json()

  // Store tokens so Cognito SDK can pick them up
  const key = `CognitoIdentityServiceProvider.${CLIENT_ID}`
  const idPayload = JSON.parse(atob(tokens.id_token.split('.')[1]))
  const username = idPayload['cognito:username']

  localStorage.setItem(`${key}.LastAuthUser`, username)
  localStorage.setItem(`${key}.${username}.idToken`, tokens.id_token)
  localStorage.setItem(`${key}.${username}.accessToken`, tokens.access_token)
  localStorage.setItem(`${key}.${username}.refreshToken`, tokens.refresh_token)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  })

  // Keep the API client's token getter in sync
  useEffect(() => {
    setTokenGetter(() => state.session?.getIdToken().getJwtToken() ?? null)
  }, [state.session])

  const fetchProfile = async (): Promise<UserOut | null> => {
    try {
      return await getMe()
    } catch {
      return null
    }
  }

  const restore = async () => {
    const currentUser = userPool.getCurrentUser()
    if (!currentUser) {
      setState({ user: null, session: null, profile: null, loading: false })
      return
    }
    currentUser.getSession(async (err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) {
        setState({ user: null, session: null, profile: null, loading: false })
        return
      }
      // Inject token before fetching profile
      setTokenGetter(() => session.getIdToken().getJwtToken())
      const profile = await fetchProfile()
      setState({ user: currentUser, session, profile, loading: false })
    })
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (code) {
      window.history.replaceState({}, '', window.location.pathname)
      exchangeCodeForTokens(code)
        .then(restore)
        .catch(() => setState({ user: null, session: null, profile: null, loading: false }))
    } else {
      restore()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = (email: string, password: string) =>
    new Promise<void>((resolve, reject) => {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool })
      const authDetails = new AuthenticationDetails({ Username: email, Password: password })
      cognitoUser.authenticateUser(authDetails, {
        onSuccess: async (session) => {
          setTokenGetter(() => session.getIdToken().getJwtToken())
          const profile = await fetchProfile()
          setState({ user: cognitoUser, session, profile, loading: false })
          resolve()
        },
        onFailure: reject,
      })
    })

  const logout = () => {
    state.user?.signOut()
    setTokenGetter(() => null)
    setState({ user: null, session: null, profile: null, loading: false })
  }

  const getToken = () => state.session?.getIdToken().getJwtToken() ?? null

  const refreshProfile = async () => {
    const profile = await fetchProfile()
    setState((s) => ({ ...s, profile }))
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, getToken, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
