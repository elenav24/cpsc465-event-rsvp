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

  return (
    <Link
      to={`/events/${event.uuid}`}
      className="bg-white rounded-[var(--radius-lg)] border border-border overflow-hidden cursor-pointer transition-all duration-[220ms] shadow-[var(--shadow-sm)] no-underline block text-inherit hover:-translate-y-[3px] hover:shadow-[var(--shadow)] hover:border-pink-light hover:no-underline"
    >
      {/* Image area */}
      <div className="w-full h-[160px] bg-gradient-to-br from-pink-pale to-pink-pale flex items-center justify-center relative overflow-hidden">
        {event.flyer_url ? (
          <img src={event.flyer_url} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center p-4">
            <div className="font-display text-[1.1rem] leading-[1.2] text-text-dark">
              Events are <span className="text-pink">better</span><br />when everyone plays a part
            </div>
          </div>
        )}
        <span className={`absolute top-3 left-3 text-white text-[0.72rem] font-bold px-3 py-1 rounded-full uppercase tracking-[0.05em] ${isHost ? 'bg-pink' : 'bg-[#7F77DD]'}`}>
          {badge}
        </span>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="text-[0.82rem] text-text-muted mb-1 flex items-center gap-[5px]">📅 {formatDate(event.start_dt)}</div>
        <div className="text-[1.15rem] font-bold mb-1 text-text-dark">{event.title}</div>
        {event.location && (
          <div className="text-[0.85rem] text-text-muted mb-4 flex items-center gap-1">
            <span>📍</span> {event.location}
          </div>
        )}
        <div className="flex items-center justify-end mt-3">
          <span className="text-[0.82rem] font-semibold text-pink underline cursor-pointer">View Details →</span>
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
    <div className="pt-[calc(var(--nav-height)+2.5rem)] px-12 pb-12 flex-1 w-full max-[640px]:pt-6 max-[640px]:px-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-10 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-[2.8rem] leading-[1.1] text-text-dark">My Celebrations</h1>
          <p className="text-[0.95rem] text-text-muted mt-1">Here are all the events you're hosting or joining.</p>
        </div>
        <Link
          to="/events/new"
          className="flex items-center gap-2 bg-pink text-white border-none rounded-full px-6 py-3 font-sans text-[0.9rem] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap no-underline hover:bg-[#b04068] hover:-translate-y-px hover:shadow-[var(--shadow-sm)] hover:no-underline hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v12M2 8h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Create New Event
        </Link>
      </div>

      {loading && (
        <div className="text-center py-16 text-text-muted">
          Loading your events…
        </div>
      )}

      {error && (
        <div className="bg-[#fff0f0] border border-[#fcc] rounded-lg p-4 mb-6 text-[#c00]">
          ⚠ {error}
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          <div className="text-[3rem] mb-4">🎉</div>
          <div className="text-[1.1rem] font-semibold mb-2">No events yet</div>
          <div className="mb-6">Create your first event or join one via an invite link.</div>
          <Link
            to="/events/new"
            className="inline-flex items-center gap-2 bg-pink text-white border-none rounded-full px-6 py-3 font-sans text-[0.9rem] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap no-underline hover:bg-[#b04068] hover:-translate-y-px hover:shadow-[var(--shadow-sm)] hover:no-underline hover:text-white"
          >
            Create New Event
          </Link>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div className="grid gap-6 max-[640px]:grid-cols-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
          {events.map((ev) => (
            <EventCard key={ev.id} event={ev} myId={myId} myDbId={myDbId} />
          ))}

          {/* Inspiration card */}
          <div className="bg-gradient-to-br from-pink-pale to-pink-pale rounded-[var(--radius-lg)] p-8 px-6 flex flex-col items-start gap-4">
            <h2 className="font-display text-[1.8rem] text-text-dark">Need Inspiration?</h2>
            <p className="text-[0.9rem] text-[#555]">Browse our templates to host effortless dinner parties, game nights, or casual hangouts.</p>
            <button className="flex items-center gap-2 bg-white border-[1.5px] border-border rounded-full px-5 py-[10px] font-sans text-[0.88rem] font-semibold text-text-dark cursor-pointer transition-all duration-200 hover:border-pink hover:text-pink">
              ✨ Browse Templates
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
