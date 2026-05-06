import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
  CognitoIdToken,
  CognitoAccessToken,
  CognitoRefreshToken,
} from 'amazon-cognito-identity-js'
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

interface OAuthTokens {
  id_token: string
  access_token: string
  refresh_token: string
}

async function exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
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
  return res.json() as Promise<OAuthTokens>
}

/**
 * Build a CognitoUserSession directly from raw JWT strings, bypassing the
 * SDK's at_hash validation which fails when tokens are stored manually.
 */
function buildSessionFromTokens(tokens: OAuthTokens): { user: CognitoUser; session: CognitoUserSession } {
  const idPayload = JSON.parse(atob(tokens.id_token.split('.')[1]))
  const username = idPayload['cognito:username'] as string

  const session = new CognitoUserSession({
    IdToken: new CognitoIdToken({ IdToken: tokens.id_token }),
    AccessToken: new CognitoAccessToken({ AccessToken: tokens.access_token }),
    RefreshToken: new CognitoRefreshToken({ RefreshToken: tokens.refresh_token }),
  })

  const cognitoUser = new CognitoUser({ Username: username, Pool: userPool })
  // Cache the session so the SDK can refresh it later
  cognitoUser.setSignInUserSession(session)

  return { user: cognitoUser, session }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  })

  // Keep the API client's token getter in sync.
  // The getter is async-aware: if the session is expired it refreshes first.
  useEffect(() => {
    const user = state.user
    const session = state.session

    if (!user || !session) {
      setTokenGetter(() => null)
      return
    }

    setTokenGetter(() => {
      // If the token is still valid (Cognito gives ~1h, we check with 60s buffer)
      const exp = session.getIdToken().getExpiration()
      const nowSec = Math.floor(Date.now() / 1000)
      if (exp - nowSec > 60) {
        return session.getIdToken().getJwtToken()
      }

      // Token is expired or about to expire — trigger a background refresh.
      // Return the current (expired) token for this call; the next call will
      // have the fresh token once refreshSession completes.
      user.refreshSession(session.getRefreshToken(), (err, newSession: CognitoUserSession) => {
        if (err) {
          // Refresh failed (e.g. refresh token expired after 30 days) — log out
          user.signOut()
          setTokenGetter(() => null)
          setState({ user: null, session: null, profile: null, loading: false })
          return
        }
        setTokenGetter(() => newSession.getIdToken().getJwtToken())
        setState(s => ({ ...s, session: newSession }))
      })

      // Return current token for this request — it may still work if only
      // slightly expired; the retry on 401 below will use the fresh one.
      return session.getIdToken().getJwtToken()
    })
  }, [state.session, state.user])

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
      // Don't strip the code yet — keep loading:true so OAuthGate renders nothing.
      // Redirect before setting state so the landing page never flashes.
      exchangeCodeForTokens(code)
        .then(async (tokens) => {
          const { user, session } = buildSessionFromTokens(tokens)
          setTokenGetter(() => session.getIdToken().getJwtToken())
          const profile = await fetchProfile()
          // Set state first so the session is available after the redirect
          setState({ user, session, profile, loading: false })
          // Hard redirect — replaces history so back button doesn't return to ?code=
          window.location.replace('/events')
        })
        .catch(() => {
          window.history.replaceState({}, '', window.location.pathname)
          setState({ user: null, session: null, profile: null, loading: false })
        })
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
