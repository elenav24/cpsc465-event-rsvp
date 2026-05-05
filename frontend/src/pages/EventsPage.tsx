import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyEvents } from '../api/events'
import { useAuth } from '../auth/AuthContext'
import type { EventOut } from '../api/types'

function formatDate(dt: string | null): string {
  if (!dt) return 'Date TBD'
  const d = new Date(dt)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) + ' • ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function EventCard({ event, myId, myDbId }: { event: EventOut; myId: string; myDbId: number | null }) {
  const isHost = event.host_id === myId || event.host_id === myDbId
  const badge = isHost ? 'Hosting' : 'Attending'
  const badgeClass = isHost ? '' : ' attending'

  return (
    <Link to={`/events/${event.id}`} className="event-card">
      <div className="event-card-img">
        {event.flyer_url ? (
          <img src={event.flyer_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontFamily: 'Anton', fontSize: '1.1rem', lineHeight: 1.2, color: 'var(--text-dark)' }}>
              Events are <span style={{ color: 'var(--pink)' }}>better</span><br />when everyone plays a part
            </div>
          </div>
        )}
        <span className={`event-card-badge${badgeClass}`}>{badge}</span>
      </div>
      <div className="event-card-body">
        <div className="event-card-date">📅 {formatDate(event.start_dt)}</div>
        <div className="event-card-name">{event.title}</div>
        {event.location && (
          <div className="event-card-host" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>📍</span> {event.location}
          </div>
        )}
        <div className="event-card-footer">
          <span className="event-card-action">View Details →</span>
        </div>
      </div>
    </Link>
  )
}

export default function EventsPage() {
  const { profile } = useAuth()
  const [events, setEvents] = useState<EventOut[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMyEvents()
      .then(setEvents)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const myId = profile?.cognito_sub ?? ''
  const myDbId = profile?.id ?? null

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

      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading your events…
        </div>
      )}

      {error && (
        <div style={{ background: '#fff0f0', border: '1px solid #fcc', borderRadius: 8, padding: '1rem', marginBottom: '1.5rem', color: '#c00' }}>
          ⚠ {error}
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>No events yet</div>
          <div style={{ marginBottom: '1.5rem' }}>Create your first event or join one via an invite link.</div>
          <Link to="/events/new" className="btn-create" style={{ display: 'inline-flex' }}>
            Create New Event
          </Link>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div className="events-grid">
          {events.map((ev) => (
            <EventCard key={ev.id} event={ev} myId={myId} myDbId={myDbId} />
          ))}

          {/* Inspiration card */}
          <div className="inspiration-card">
            <h2 className="inspiration-title">Need Inspiration?</h2>
            <p className="inspiration-sub">Browse our templates to host effortless dinner parties, game nights, or casual hangouts.</p>
            <button className="btn-templates">✨ Browse Templates</button>
          </div>
        </div>
      )}

      <style>{`
        .page {
          padding: calc(var(--nav-height) + 2.5rem) 3rem 3rem;
          flex: 1;
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
          overflow: hidden;
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
          justify-content: flex-end;
          margin-top: 0.75rem;
        }
        .event-card-action {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--pink);
          text-decoration: underline;
          cursor: pointer;
        }
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
        @media (max-width: 640px) {
          .page { padding: 1.5rem 1rem; }
          .events-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
