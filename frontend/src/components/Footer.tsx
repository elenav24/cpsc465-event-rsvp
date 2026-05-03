export default function Footer() {
  return (
    <footer className="footer">
      <span className="footer-logo">Cohosted</span>
      <div className="footer-links">
        <a>About</a>
        <a>Privacy</a>
        <a>Terms</a>
        <a>Support</a>
        <a>Contact</a>
      </div>
      <span className="footer-copy">© {new Date().getFullYear()} Cohosted. Party on.</span>

      <style>{`
        .footer {
          background: transparent;
          border-top: 1px solid rgba(200,160,180,0.2);
          padding: 2rem 3rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .footer-logo {
          font-family: 'Cantora One', cursive;
          font-size: 1.2rem;
          color: var(--pink);
        }
        .footer-links {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .footer-links a {
          font-size: 0.85rem;
          color: var(--text-muted);
          text-decoration: none;
          cursor: pointer;
          transition: color 0.2s;
        }
        .footer-links a:hover { color: var(--pink); }
        .footer-copy {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        @media (max-width: 640px) {
          .footer { padding: 1.5rem 1rem; flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </footer>
  )
}
