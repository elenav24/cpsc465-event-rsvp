import { Link } from 'react-router-dom'
import Footer from '../components/Footer'

// Sparkle SVG paths from the Figma design
const SPARKLE_LARGE = "M29.5884 40.5885L26.694 50.7186L23.7996 40.5885C22.2795 35.2677 18.1203 31.1085 12.7996 29.5884L2.6694 26.694L12.7996 23.7996C18.1204 22.2795 22.2795 18.1203 23.7996 12.7996L26.694 2.6694L29.5884 12.7996C31.1085 18.1204 35.2677 22.2795 40.5885 23.7996L50.7186 26.694L40.5885 29.5884C35.2677 31.1085 31.1085 35.2677 29.5884 40.5885Z"
const SPARKLE_SMALL = "M7.94196 11.9481L7.51964 13.6373L7.09732 11.9481C6.60413 9.97538 5.0639 8.43515 3.09126 7.94196L1.40197 7.51964L3.09126 7.09732C5.0639 6.60413 6.60413 5.0639 7.09732 3.0912L7.51964 1.40197L7.94196 3.0912C8.43515 5.0639 9.97538 6.60413 11.948 7.09732L13.6373 7.51964L11.948 7.94196C9.97538 8.43515 8.43515 9.97538 7.94196 11.9481Z"
const SPARKLE_LARGE_PURPLE = "M30.7523 42.185L27.744 52.7137L24.7358 42.185C23.1559 36.655 18.8331 32.3322 13.303 30.7523L2.7744 27.744L13.303 24.7358C18.8332 23.1559 23.1559 18.8331 24.7358 13.303L27.744 2.7744L30.7523 13.303C32.3322 18.8332 36.655 23.1559 42.185 24.7358L52.7137 27.744L42.185 30.7523C36.655 32.3322 32.3322 36.655 30.7523 42.185Z"
const SPARKLE_SMALL_PURPLE = "M8.25437 12.4181L7.81543 14.1737L7.37649 12.4181C6.86391 10.3678 5.2631 8.76695 3.21286 8.25437L1.45711 7.81543L3.21286 7.37649C5.2631 6.86391 6.86391 5.2631 7.37649 3.21279L7.81543 1.45711L8.25437 3.21279C8.76695 5.2631 10.3678 6.86391 12.418 7.37649L14.1737 7.81543L12.418 8.25437C10.3678 8.76695 8.76695 10.3678 8.25437 12.4181Z"

// Pink sparkle cluster (bottom-center-right area)
function SparkleClusterPink() {
  return (
    <svg width="66" height="66" viewBox="0 0 66 66" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d={SPARKLE_LARGE} stroke="#FCCEE8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5.3388" />
      <path d={SPARKLE_SMALL} stroke="#FCCEE8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8" transform="translate(0, -10)" />
      <path d={SPARKLE_SMALL} stroke="#FCCEE8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8" transform="translate(48, 40)" />
    </svg>
  )
}

// Purple sparkle cluster (top-right area)
function SparkleClusterPurple() {
  return (
    <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d={SPARKLE_LARGE_PURPLE} stroke="#EAD4FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5.55" />
      <path d={SPARKLE_SMALL_PURPLE} stroke="#EAD4FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.9" transform="translate(0, -10)" />
      <path d={SPARKLE_SMALL_PURPLE} stroke="#EAD4FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.9" transform="translate(50, 42)" />
    </svg>
  )
}

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Animated background blobs */}
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />
      <div className="bg-blob bg-blob-4" />

      {/* Sparkle decorations */}
      <div className="sparkle-el sparkle-pink">
        <SparkleClusterPink />
      </div>
      <div className="sparkle-el sparkle-purple">
        <SparkleClusterPurple />
      </div>

      {/* Hero content */}
      <div className="hero-content">
        {/* Title block */}
        <div className="hero-title-block">
          <span className="hero-line1">Events are </span>
          <span className="hero-better">better </span>
          <span className="hero-line2">when everyone plays a part</span>
        </div>

        {/* Subtitle */}
        <p className="hero-subtitle">
          The RSVP tool built for potlucks, watch parties, and group hangs.{' '}
          <strong>Start hosting <em>with</em> your friends,</strong>{' '}
          not just <em>for</em> them.
        </p>

        {/* CTA Button */}
        <Link to="/signup" className="hero-btn">
          Create Your First Event
        </Link>
      </div>

      <Footer />

      <style>{`
        .landing-page {
          position: relative;
          width: 100%;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          /* Exact figma gradient */
          background: linear-gradient(134.032deg, #FFECE0 6.214%, #FFFFFF 49.723%, #EFECFF 93.233%);
          overflow: hidden;
        }

        /* Animated background blobs */
        .bg-blob {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .bg-blob-1 {
          width: 525px;
          height: 525px;
          left: 89px;
          top: 62px;
          background: linear-gradient(135deg, rgba(252,206,232,0.4) 0%, rgba(233,212,255,0.4) 100%);
          filter: blur(67px);
          animation: pulse-glow 8s ease-in-out infinite, drift 12s ease-in-out infinite;
        }
        .bg-blob-2 {
          width: 400px;
          height: 400px;
          right: -50px;
          bottom: 200px;
          background: linear-gradient(135deg, rgba(233,212,255,0.3) 0%, rgba(252,206,232,0.3) 100%);
          filter: blur(64px);
          animation: pulse-glow 7s ease-in-out infinite 0.5s;
        }
        .bg-blob-3 {
          width: 300px;
          height: 300px;
          left: 583px;
          top: 397px;
          background: linear-gradient(135deg, rgba(253,165,213,0.2) 0%, rgba(218,178,255,0.2) 100%);
          filter: blur(40px);
          animation: drift 10s ease-in-out infinite 2s;
        }
        .bg-blob-4 {
          width: 204px;
          height: 204px;
          left: 943px;
          top: 206px;
          opacity: 0.34;
          background: linear-gradient(135deg, rgba(255,240,133,0.2) 0%, rgba(252,206,232,0.2) 100%);
          filter: blur(41px);
          animation: pulse-glow 6s ease-in-out infinite 1s, drift 14s ease-in-out infinite 3s;
        }

        /* Sparkle decorations */
        .sparkle-el {
          position: absolute;
          pointer-events: none;
        }
        /* Pink sparkle — bottom center-right, matches figma ~901px left, 660px top */
        .sparkle-pink {
          left: clamp(55%, 62vw, 920px);
          top: clamp(55%, 62vh, 660px);
          animation: sparkle-rotate 6s ease-in-out infinite, float-gentle 4s ease-in-out infinite;
        }
        /* Purple sparkle — top right, matches figma ~1126px left, 150px top */
        .sparkle-purple {
          left: clamp(70%, 78vw, 1126px);
          top: clamp(100px, 14vh, 200px);
          animation: sparkle-rotate 5s ease-in-out infinite reverse, float-gentle 3.5s ease-in-out infinite 0.5s;
        }

        /* Hero content — left-aligned, matches figma left: 171px */
        .hero-content {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding-top: calc(var(--nav-height) + 50px);
          padding-left: clamp(1.5rem, 11.9vw, 171px);
          padding-right: 2rem;
          padding-bottom: 3rem;
        }

        /* Title block — all on same baseline flow, no forced breaks */
        .hero-title-block {
          font-family: 'Anton', sans-serif;
          font-size: clamp(2.8rem, 5.56vw, 80px);
          line-height: 1.03;
          color: #000;
          margin-bottom: clamp(1rem, 2.5vh, 40px);
          max-width: 728px;
        }
        .hero-line1 { display: inline; }
        .hero-better {
          display: inline;
          background: linear-gradient(90deg,
            rgb(208,99,149) 0%,
            rgb(212,119,164) 20%,
            rgb(216,138,180) 40%,
            rgb(208,141,185) 54%,
            rgb(190,135,185) 68%,
            rgb(173,129,185) 81%,
            rgb(155,122,184) 95%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-line2 { display: inline; }

        /* Subtitle */
        .hero-subtitle {
          font-family: 'Albert Sans', sans-serif;
          font-size: clamp(1rem, 1.39vw, 20px);
          line-height: 1.6;
          color: #000;
          max-width: 608px;
          margin-bottom: clamp(1.5rem, 4vh, 44px);
        }
        .hero-subtitle strong { font-weight: 700; }
        .hero-subtitle em { font-style: italic; }

        /* CTA Button — exact figma: #e1bede bg, drop-shadow 4px 4px 2px #462749, 340×71, rounded-10 */
        .hero-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: clamp(260px, 23.6vw, 340px);
          height: 71px;
          background: #e1bede;
          border-radius: 10px;
          filter: drop-shadow(4px 4px 2px #462749);
          font-family: 'Cantora One', cursive;
          font-size: clamp(1.2rem, 2.22vw, 32px);
          color: #000;
          text-decoration: none;
          transition: filter 0.2s, transform 0.2s;
          border: none;
          cursor: pointer;
        }
        .hero-btn:hover {
          filter: drop-shadow(6px 6px 4px #462749);
          transform: translate(-1px, -1px);
          text-decoration: none;
          color: #000;
        }

        /* Animations */
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes drift {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(10px, -15px); }
          66% { transform: translate(-15px, 10px); }
        }
        @keyframes sparkle-rotate {
          0%, 100% { transform: rotate(-15deg) scale(1); }
          50% { transform: rotate(15deg) scale(1.05); }
        }
        @keyframes float-gentle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @media (max-width: 768px) {
          .hero-title-block { font-size: clamp(2.4rem, 9vw, 3.5rem); }
          .sparkle-pink { left: 60%; top: 60%; }
          .sparkle-purple { left: 75%; top: 10%; }
          .bg-blob-3, .bg-blob-4 { display: none; }
        }
      `}</style>
    </div>
  )
}
