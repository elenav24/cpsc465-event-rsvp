import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import LogoIcon from './LogoIcon'

export default function Nav() {
    const { user, profile, logout } = useAuth()
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const loggedIn = !!user
    const [mobileOpen, setMobileOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const profileRef = useRef<HTMLDivElement>(null)

    const isEventPage = /^\/events\/[^/]+$/.test(pathname)
    // Center links fade out on scroll; on the event page they're always hidden
    const hideCenter = isEventPage || scrolled

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    // Close profile dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleLogout = () => {
        logout()
        navigate('/')
        setMobileOpen(false)
        setProfileOpen(false)
    }

    const initials = profile?.display_name
        ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : (profile?.email?.[0] ?? 'U').toUpperCase()

    const displayName = profile?.display_name ?? profile?.email?.split('@')[0] ?? 'Account'

    return (
        <nav className="nav">
            {/* Logo */}
            <Link to={loggedIn ? '/events' : '/'} className="nav-logo">
                <LogoIcon size={40} />
                <span className="nav-logo-text">cohosted</span>
            </Link>

            {/* Center links — fade out on scroll, hidden on event page */}
            <div className="nav-center" style={{
                opacity: hideCenter ? 0 : 1,
                pointerEvents: hideCenter ? 'none' : 'auto',
                transition: 'opacity 0.3s ease',
            }}>
                <Link to="/how-it-works" className="nav-link">How It Works</Link>
                <Link to="/templates" className="nav-link">Browse Templates</Link>
            </div>

            {/* Right actions */}
            <div className="nav-actions">
                {loggedIn ? (
                    <>
                        <Link to="/events" className="nav-link">My Events</Link>

                        {/* Profile avatar + dropdown */}
                        <div className="nav-profile-wrap" ref={profileRef}>
                            <button
                                className="nav-avatar"
                                onClick={() => setProfileOpen(o => !o)}
                                aria-label="Account menu"
                                aria-expanded={profileOpen}
                            >
                                {initials}
                            </button>
                            {profileOpen && (
                                <div className="nav-profile-menu">
                                    <div className="nav-profile-name">{displayName}</div>
                                    <div className="nav-profile-email">{profile?.email}</div>
                                    <div className="nav-profile-divider" />
                                    <Link
                                        to="/profile"
                                        className="nav-profile-item"
                                        onClick={() => setProfileOpen(false)}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        Edit Profile
                                    </Link>
                                    <button className="nav-profile-item nav-profile-signout" onClick={handleLogout}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                                            <polyline points="16 17 21 12 16 7" />
                                            <line x1="21" y1="12" x2="9" y2="12" />
                                        </svg>
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="nav-pill">Log In</Link>
                        <Link to="/signup" className="nav-text-btn">Sign Up</Link>
                    </>
                )}
            </div>

            {/* Hamburger — mobile only */}
            <button
                className="nav-hamburger"
                onClick={() => setMobileOpen(o => !o)}
                aria-label="Toggle menu"
                aria-expanded={mobileOpen}
            >
                <span className={`ham-line ${mobileOpen ? 'open-1' : ''}`} />
                <span className={`ham-line ${mobileOpen ? 'open-2' : ''}`} />
                <span className={`ham-line ${mobileOpen ? 'open-3' : ''}`} />
            </button>

            {/* Mobile dropdown */}
            {mobileOpen && (
                <div className="nav-mobile-menu">
                    {loggedIn ? (
                        <>
                            <Link to="/events" className="mobile-link" onClick={() => setMobileOpen(false)}>My Events</Link>
                            <Link to="/profile" className="mobile-link" onClick={() => setMobileOpen(false)}>Edit Profile</Link>
                            <button className="mobile-link mobile-signout" onClick={handleLogout}>Sign Out</button>
                        </>
                    ) : (
                        <>
                            <Link to="/how-it-works" className="mobile-link" onClick={() => setMobileOpen(false)}>How It Works</Link>
                            <Link to="/templates" className="mobile-link" onClick={() => setMobileOpen(false)}>Browse Templates</Link>
                            <Link to="/login" className="mobile-link" onClick={() => setMobileOpen(false)}>Log In</Link>
                            <Link to="/signup" className="mobile-link mobile-signup" onClick={() => setMobileOpen(false)}>Sign Up</Link>
                        </>
                    )}
                </div>
            )}

            <style>{`
        .nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          height: var(--nav-height);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2.5rem;
          transition: background 0.3s ease, border-color 0.3s ease;
        }

        .nav-logo {
          font-family: 'Cantora One', cursive;
          color: #1a1a1a;
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          flex-shrink: 0;
          z-index: 1;
        }
        .nav-logo:hover { text-decoration: none; color: #1a1a1a; }
        .nav-logo-text { font-family: 'Cantora One', cursive; font-size: 30px; color: #000; line-height: 1; }

        .nav-center {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 2.5rem;
        }
        .nav-link {
          font-family: 'Albert Sans', sans-serif;
          font-size: 18px;
          font-weight: 500;
          color: #444;
          text-decoration: none;
          cursor: pointer;
          transition: color 0.2s;
          white-space: nowrap;
        }
        .nav-link:hover { color: var(--pink); text-decoration: none; }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;
          z-index: 1;
        }

        /* Profile avatar button */
        .nav-profile-wrap { position: relative; }
        .nav-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--pink);
          color: white;
          font-family: 'Albert Sans', sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s, transform 0.15s;
          flex-shrink: 0;
        }
        .nav-avatar:hover { opacity: 0.85; transform: scale(1.05); }

        /* Profile dropdown */
        .nav-profile-menu {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          min-width: 200px;
          padding: 0.5rem 0;
          z-index: 200;
        }
        .nav-profile-name {
          padding: 0.5rem 1rem 0.1rem;
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-dark);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .nav-profile-email {
          padding: 0 1rem 0.5rem;
          font-size: 0.75rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .nav-profile-divider {
          height: 1px;
          background: var(--border);
          margin: 0.25rem 0;
        }
        .nav-profile-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 0.5rem 1rem;
          font-family: 'Albert Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-mid);
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
          text-align: left;
        }
        .nav-profile-item:hover { background: var(--pink-bg); color: var(--pink); text-decoration: none; }
        .nav-profile-signout { color: #c00; }
        .nav-profile-signout:hover { background: #fff0f0; color: #c00; }

        .nav-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #d06395;
          color: #fff;
          font-family: 'Albert Sans', sans-serif;
          font-size: 16px;
          font-weight: 700;
          border: none;
          border-radius: 50px;
          padding: 0 22px;
          height: 36px;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.2s, transform 0.15s;
        }
        .nav-pill:hover { background: #b8527f; transform: translateY(-1px); text-decoration: none; color: #fff; }

        .nav-text-btn {
          font-family: 'Albert Sans', sans-serif;
          font-size: 16px;
          font-weight: 400;
          color: #000;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          transition: opacity 0.2s;
        }
        .nav-text-btn:hover { opacity: 0.65; color: var(--pink); text-decoration: none; }

        .nav-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--pink);
          color: white;
          font-family: 'Albert Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          border: none;
          border-radius: 50px;
          padding: 0 16px;
          height: 34px;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.2s, transform 0.15s;
        }
        .nav-btn-primary:hover { background: #b04068; transform: translateY(-1px); text-decoration: none; color: white; }

        /* Hamburger */
        .nav-hamburger {
          display: none;
          flex-direction: column;
          justify-content: center;
          gap: 5px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          z-index: 101;
        }
        .ham-line {
          display: block;
          width: 24px;
          height: 2px;
          background: #1a1a1a;
          border-radius: 2px;
          transition: transform 0.25s ease, opacity 0.25s ease;
          transform-origin: center;
        }
        .open-1 { transform: translateY(7px) rotate(45deg); }
        .open-2 { opacity: 0; }
        .open-3 { transform: translateY(-7px) rotate(-45deg); }

        /* Mobile dropdown */
        .nav-mobile-menu {
          position: fixed;
          top: var(--nav-height);
          left: 0; right: 0;
          background: rgba(255,255,255,0.97);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 1rem 2rem 1.5rem;
          gap: 0.25rem;
          z-index: 99;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }
        .mobile-link {
          font-family: 'Albert Sans', sans-serif;
          font-size: 16px;
          font-weight: 500;
          color: #333;
          text-decoration: none;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-light);
          cursor: pointer;
          background: none;
          border-left: none;
          border-right: none;
          border-top: none;
          text-align: left;
          transition: color 0.2s;
        }
        .mobile-link:last-child { border-bottom: none; }
        .mobile-link:hover { color: var(--pink); text-decoration: none; }
        .mobile-signup { margin-top: 0.5rem; color: var(--pink); font-weight: 700; }
        .mobile-signout { color: var(--danger); }

        @media (max-width: 850px) {
          .nav-center { display: none; }
          .nav-actions { display: none; }
          .nav-hamburger { display: flex; }
          .nav { padding: 0 1.25rem; }
        }
      `}</style>
        </nav>
    )
}
