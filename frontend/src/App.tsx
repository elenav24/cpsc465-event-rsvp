import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from './auth/AuthContext'
import Nav from './components/Nav'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import EventsPage from './pages/EventsPage'
import CreateEventPage from './pages/CreateEventPage'
import EventPage from './pages/EventPage'
import ProfilePage from './pages/ProfilePage'
import { joinViaInvite } from './api/events'
import HowItWorks from './pages/HowItWorks'
import Footer from './components/Footer.tsx'

// Block all rendering until auth state is resolved — covers OAuth callbacks,
// returning users with an existing session token, and fresh page loads.
function OAuthGate({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth()
  if (loading) return null
  return <>{children}</>
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>Loading…</div>
  if (user) return <Navigate to="/events" replace />
  return <>{children}</>
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

/** Handles /join/:token — joins the event then redirects to it */
function JoinPage() {
  const { token } = useParams<{ token: string }>()
  const { user, loading, profile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    if (!user) {
      // Store token in sessionStorage so we can join after login
      if (token) sessionStorage.setItem('pendingInviteToken', token)
      navigate('/login', { replace: true })
      return
    }
    if (!token) { navigate('/events', { replace: true }); return }
    const displayName = profile?.display_name ?? profile?.email ?? undefined
    joinViaInvite(token, displayName)
      .then((result) => navigate(`/events/${result.event_uuid}`, { replace: true }))
      .catch(() => navigate('/events', { replace: true }))
  }, [token, user, loading, navigate, profile])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
      Joining event…
    </div>
  )
}

/** After login, resolve any pending invite token stored in sessionStorage */
function PendingInviteResolver() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    const token = sessionStorage.getItem('pendingInviteToken')
    if (!token) return
    sessionStorage.removeItem('pendingInviteToken')
    const displayName = profile?.display_name ?? profile?.email ?? undefined
    joinViaInvite(token, displayName)
      .then((result) => navigate(`/events/${result.event_uuid}`, { replace: true }))
      .catch(() => { })
  }, [user, navigate, profile])

  return null
}

function AppFooter() {
  const { pathname } = useLocation()
  // Hide footer entirely on the event detail page — it uses a fixed-height layout
  // and the footer would push it out of the viewport and break internal scrolling.
  if (/^\/events\/[^/]+$/.test(pathname)) return null
  return <Footer />
}

export default function App() {
  return (
    <BrowserRouter>
      <OAuthGate>
        <Nav />
        <PendingInviteResolver />
        <Routes>
          <Route path="/" element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/join/:token" element={<JoinPage />} />
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <EventsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/new"
            element={
              <ProtectedRoute>
                <CreateEventPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id"
            element={
              <ProtectedRoute>
                <EventPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <AppFooter />
      </OAuthGate>
    </BrowserRouter>
  )
}
