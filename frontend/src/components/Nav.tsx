import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import LogoIcon from './LogoIcon'

export default function Nav() {
    const { user, profile, logout } = useAuth()
    const navigate = useNavigate()
    const loggedIn = !!user
    const [menuOpen, setMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    const handleLogout = () => {
        logout()
        navigate('/')
        setMenuOpen(false)
    }

    const displayName = profile?.display_name ?? profile?.email?.split('@')[0] ?? 'Account'

    return (
        <nav className="nav">
            {/* Logo — left */}
            <Link to={loggedIn ? '/events' : '/'} className="nav-logo">
                <LogoIcon size={40} />
                <span className="nav-logo-text">cohosted</span>
            </Link>

            {/* Center links — desktop only, fade out on scroll */}
            <div className="nav-center" style={{
                opacity: scrolled ? 0 : 1,
                pointerEvents: scrolled ? 'none' : 'auto',
                transition: 'opacity 0.3s ease',
            }}>

                <Link to="/how-it-works" className="nav-link">How It Works</Link>
                <a className="nav-link">Browse Templates</a>
            </div>

            {/* Auth — desktop right */}
            <div className="nav-actions">
                {loggedIn ? (
                    <>
                        <Link to="/events" className="nav-link">My Events</Link>
                        <Link to="/events/new" className="nav-btn-primary">+ Create Event</Link>
                        <Link to="/profile" className="nav-link" style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={displayName}>
                            {displayName}
                        </Link>
                        <button className="nav-btn-ghost" onClick={handleLogout}>Sign Out</button>
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
                onClick={() => setMenuOpen(o => !o)}
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
            >
                <span className={`ham-line ${menuOpen ? 'open-1' : ''}`} />
                <span className={`ham-line ${menuOpen ? 'open-2' : ''}`} />
                <span className={`ham-line ${menuOpen ? 'open-3' : ''}`} />
            </button>

            {/* Mobile dropdown */}
            {menuOpen && (
                <div className="nav-mobile-menu">
                    <Link to="/how-it-works" className="mobile-link" onClick={() => setMenuOpen(false)}>How It Works</Link>
                    <a className="mobile-link" onClick={() => setMenuOpen(false)}>Browse Templates</a>
                    {loggedIn ? (
                        <>
                            <Link to="/events" className="mobile-link" onClick={() => setMenuOpen(false)}>My Events</Link>
                            <Link to="/events/new" className="mobile-link" onClick={() => setMenuOpen(false)}>+ Create Event</Link>
                            <Link to="/profile" className="mobile-link" onClick={() => setMenuOpen(false)}>{displayName}</Link>
                            <button className="mobile-link mobile-signout" onClick={handleLogout}>Sign Out</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="mobile-link" onClick={() => setMenuOpen(false)}>Log In</Link>
                            <Link to="/signup" className="mobile-link mobile-signup" onClick={() => setMenuOpen(false)}>Sign Up</Link>
                        </>
                    )}
                </div>
            )}

            <style>{`
        .nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          height: var(--nav-height);
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2.5rem;
        }

        .nav-logo {
          font-family: 'Cantora One', cursive;
          font-size: 1.2rem;
          color: #1a1a1a;
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          flex-shrink: 0;
          z-index: 1;
        }
        .nav-logo:hover { text-decoration: none; color: #1a1a1a; }
        .nav-logo-text {
          font-family: 'Cantora One', cursive;
          font-size: 30px;
          color: #000;
          line-height: 1;
        }

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
          gap: 0.6rem;
          flex-shrink: 0;
          z-index: 1;
        }

        .nav-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #d06395;
          color: #fff;
          font-family: 'Albert Sans', sans-serif;
          font-size: 18px;
          font-weight: 700;
          border: none;
          border-radius: 50px;
          padding: 0 24px;
          height: 38px;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.2s, transform 0.15s;
        }
        .nav-pill:hover {
          background: #b8527f;
          transform: translateY(-1px);
          text-decoration: none;
          color: #fff;
        }

        .nav-text-btn {
          font-family: 'Albert Sans', sans-serif;
          font-size: 18px;
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
          font-size: 15px;
          font-weight: 600;
          border: none;
          border-radius: 50px;
          padding: 0 18px;
          height: 36px;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.2s, transform 0.15s;
        }
        .nav-btn-primary:hover { background: #b04068; transform: translateY(-1px); text-decoration: none; color: white; }

        .nav-btn-ghost {
          font-family: 'Albert Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          color: #666;
          background: none;
          border: 1.5px solid var(--border);
          border-radius: 50px;
          cursor: pointer;
          padding: 0 14px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          transition: all 0.2s;
        }
        .nav-btn-ghost:hover { border-color: #aaa; color: #333; }

        /* ── Hamburger ── */
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

        /* ── Mobile dropdown ── */
        .nav-mobile-menu {
          position: fixed;
          top: var(--nav-height);
          left: 0;
          right: 0;
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
          font-size: 18px;
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
        .mobile-signup {
          margin-top: 0.5rem;
          color: var(--pink);
          font-weight: 700;
        }
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
