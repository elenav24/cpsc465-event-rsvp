import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import LogoIcon from './LogoIcon'

export default function Nav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const loggedIn = !!user

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="nav">
      {/* Logo — left */}
      <Link to={loggedIn ? '/events' : '/'} className="nav-logo">
        <LogoIcon size={40} />
        <span className="nav-logo-text">cohosted</span>
      </Link>

      {/* Center links — absolutely centered in the nav */}
      <div className="nav-center">
        <a className="nav-link">How It Works</a>
        <a className="nav-link">Browse Templates</a>
      </div>

      {/* Right actions */}
      <div className="nav-actions">
        {loggedIn ? (
          <>
            <Link to="/events" className="nav-link">My Events</Link>
            <Link to="/events/new" className="nav-pill">+ Create Event</Link>
            <button className="nav-text-btn" onClick={handleLogout}>Sign Out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-pill">Log In</Link>
            <Link to="/signup" className="nav-text-btn">Sign Up</Link>
          </>
        )}
      </div>

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
          padding: 0 clamp(1rem, 2.5vw, 2.5rem);
        }

        /* Logo */
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          flex-shrink: 0;
          z-index: 1;
        }
        .nav-logo:hover { text-decoration: none; }
        .nav-logo-text {
          font-family: 'Cantora One', cursive;
          font-size: 30px;
          color: #000;
          line-height: 1;
        }

        /* Center links — absolutely centered */
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
          font-weight: 400;
          color: #000;
          text-decoration: none;
          cursor: pointer;
          white-space: nowrap;
          transition: opacity 0.2s;
        }
        .nav-link:hover { opacity: 0.65; text-decoration: none; }

        /* Right side */
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;
          z-index: 1;
        }

        /* Pink pill button — exact figma: #d06395, 100px × 38px, rounded-50px */
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

        /* Ghost text button */
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
        .nav-text-btn:hover { opacity: 0.65; text-decoration: none; }

        @media (max-width: 640px) {
          .nav-center { display: none; }
        }
      `}</style>
    </nav>
  )
}
