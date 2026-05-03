import { Link } from 'react-router-dom'

const sampleEvents = [
  {
    id: 1,
    title: 'Summer Ending Potluck',
    date: 'Oct 24, 2024 • 6:00 PM',
    status: 'Hosting',
    location: '123 Maple St',
    attendees: ['JD', 'MT', 'SJ'],
    count: 12,
    potluck: true,
    items: 'Paper plates, Ice',
  },
  {
    id: 2,
    title: "Sarah's Birthday Bash",
    date: 'Tomorrow • 8:00 PM',
    status: 'Attending',
    host: 'Sarah M.',
    location: '456 Oak Ave',
    attendees: ['SJ', 'MT', 'JD'],
    count: 8,
  },
]

export default function EventsPage() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Celebrations</h1>
          <p className="page-sub">Here are all the events you're hosting or joining.</p>
        </div>
        <Link to="/events/new" className="btn-create">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v12M2 8h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Create New Event
        </Link>
      </div>

      <div className="events-grid">
        {/* Hosting card */}
        <Link to={`/events/${sampleEvents[0].id}`} className="event-card">
          <div className="event-card-img">
            <span className="event-card-badge">Hosting</span>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontFamily: 'Anton', fontSize: '1.1rem', lineHeight: 1.2, color: 'var(--text-dark)' }}>
                Events are <span style={{ color: 'var(--pink)' }}>better</span><br />when everyone plays a part
              </div>
            </div>
          </div>
          <div className="event-card-body">
            <div className="event-card-date">📅 Oct 24, 2024 • 6:00 PM</div>
            <div className="event-card-name">Summer Ending Potluck</div>
            <div className="event-card-footer">
              <div className="avatar-row">
                {['JD', 'MT', 'SJ'].map((i) => (
                  <div key={i} className="avatar">{i}</div>
                ))}
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>You & 12 others attending</span>
            </div>
            <div className="potluck-banner">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="var(--pink)" strokeWidth="1.5" />
                <path d="M5 9l2 2 4-4" stroke="var(--pink)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>
                <strong>3 items needed for potluck</strong><br />
                <span style={{ fontSize: '0.75rem' }}>Including: Paper plates, Ice</span>
              </span>
              <svg className="potluck-arrow" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 7h4M7 5l2 2-2 2" stroke="var(--pink)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Attending card */}
        <Link to={`/events/${sampleEvents[1].id}`} className="event-card">
          <div className="event-card-img" style={{ background: 'linear-gradient(135deg,#7F77DD22,#C9567A22)' }}>
            <span className="event-card-badge attending">Attending</span>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg,var(--purple-pale),var(--pink-pale))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🎂</div>
          </div>
          <div className="event-card-body">
            <div className="event-card-date">🕐 Tomorrow • 8:00 PM</div>
            <div className="event-card-name">Sarah's Birthday Bash</div>
            <div className="event-card-host">Hosted by Sarah M.</div>
            <div className="event-card-footer">
              <div className="avatar-row">
                {['SJ', 'MT', 'JD'].map((i) => (
                  <div key={i} className="avatar">{i}</div>
                ))}
                <div className="avatar-count">+8</div>
              </div>
              <span className="event-card-action">View Details</span>
            </div>
          </div>
        </Link>

        {/* Draft card */}
        <div className="draft-card">
          <div className="draft-icon">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="4" y="3" width="14" height="16" rx="2" stroke="#888" strokeWidth="1.5" />
              <path d="M7 7h8M7 11h8M7 15h5" stroke="#888" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="draft-title">Winter Ski Trip</div>
          <div className="draft-meta">Draft • Updated 2 days ago</div>
          <span className="draft-link">Resume Planning</span>
        </div>

        {/* Inspiration card */}
        <div className="inspiration-card">
          <h2 className="inspiration-title">Need Inspiration?</h2>
          <p className="inspiration-sub">Browse our templates to host effortless dinner parties, game nights, or casual hangouts.</p>
          <button className="btn-templates">✨ Browse Templates</button>
        </div>
      </div>

      <style>{`
        .page {
          padding: calc(var(--nav-height) + 2.5rem) 3rem 3rem;
          min-height: 100vh;
          width: 100%;
        }
        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .page-title {
          font-family: 'Anton', sans-serif;
          font-size: 2.8rem;
          line-height: 1.1;
          color: var(--text-dark);
        }
        .page-sub {
          font-size: 0.95rem;
          color: var(--text-muted);
          margin-top: 4px;
        }
        .btn-create {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--pink);
          color: white;
          border: none;
          border-radius: 100px;
          padding: 12px 24px;
          font-family: 'Albert Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          text-decoration: none;
        }
        .btn-create:hover {
          background: #b04068;
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
          text-decoration: none;
          color: white;
        }
        .events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 1.5rem;
        }
        .event-card {
          background: white;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.22s;
          box-shadow: var(--shadow-sm);
          text-decoration: none;
          display: block;
          color: inherit;
        }
        .event-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow);
          border-color: var(--pink-light);
          text-decoration: none;
        }
        .event-card-img {
          width: 100%;
          height: 160px;
          object-fit: cover;
          background: linear-gradient(135deg, var(--purple-pale), var(--pink-pale));
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .event-card-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: var(--pink);
          color: white;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 100px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .event-card-badge.attending { background: #7F77DD; }
        .event-card-body { padding: 1.25rem; }
        .event-card-date {
          font-size: 0.82rem;
          color: var(--text-muted);
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .event-card-name {
          font-size: 1.15rem;
          font-weight: 700;
          margin-bottom: 4px;
          color: var(--text-dark);
        }
        .event-card-host {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 1rem;
        }
        .event-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .avatar-row { display: flex; }
        .avatar {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--purple-pale);
          border: 2px solid white;
          margin-left: -6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          font-weight: 700;
          color: #7F77DD;
        }
        .avatar:first-child { margin-left: 0; }
        .avatar-count {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--pink-pale);
          border: 2px solid white;
          margin-left: -6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.62rem;
          font-weight: 700;
          color: var(--pink);
        }
        .event-card-action {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--pink);
          text-decoration: underline;
          cursor: pointer;
        }
        .potluck-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--pink-bg);
          border: 1px solid var(--pink-pale);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          margin-top: 0.75rem;
          font-size: 0.8rem;
          color: var(--pink);
          cursor: pointer;
        }
        .potluck-arrow { margin-left: auto; }
        .inspiration-card {
          background: linear-gradient(135deg, var(--purple-pale), var(--pink-pale));
          border-radius: var(--radius-lg);
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
        }
        .inspiration-title {
          font-family: 'Anton', sans-serif;
          font-size: 1.8rem;
          color: var(--text-dark);
        }
        .inspiration-sub {
          font-size: 0.9rem;
          color: var(--text-mid);
        }
        .btn-templates {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1.5px solid var(--border);
          border-radius: 100px;
          padding: 10px 20px;
          font-family: 'Albert Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-dark);
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-templates:hover { border-color: var(--pink); color: var(--pink); }
        .draft-card {
          border: 1.5px dashed var(--border);
          background: #fafafa;
          border-radius: var(--radius-lg);
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .draft-card:hover { border-color: var(--pink-light); }
        .draft-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .draft-title { font-weight: 700; font-size: 1rem; }
        .draft-meta { font-size: 0.82rem; color: var(--text-muted); }
        .draft-link { font-size: 0.85rem; color: var(--pink); font-weight: 600; text-decoration: underline; }
        @media (max-width: 640px) {
          .page { padding: 1.5rem 1rem; }
          .events-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
