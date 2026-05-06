import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  FiCalendar, FiMapPin, FiClock, FiTrash2, FiPlus,
  FiCheck, FiX, FiHelpCircle, FiChevronRight, FiStar, FiUsers,
} from 'react-icons/fi'
import { getMyEvents, deleteEvent, getMyRsvp, upsertRsvp } from '../api/events'
import { useAuth } from '../auth/AuthContext'
import type { EventOut, RSVPStatus } from '../api/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateFull(dt: string | null): string {
  if (!dt) return 'Date TBD'
  const d = new Date(dt)
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' \u2022 ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  )
}

function formatDateShort(dt: string | null): string {
  if (!dt) return 'TBD'
  const d = new Date(dt)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(dt: string | null): string {
  if (!dt) return ''
  return new Date(dt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function isUpcoming(dt: string | null): boolean {
  if (!dt) return true
  return new Date(dt) >= new Date()
}

// ── RSVP Modal ────────────────────────────────────────────────────────────────

function RsvpModal({
  event,
  onClose,
  onDone,
}: {
  event: EventOut
  onClose: () => void
  onDone: () => void
}) {
  const [status, setStatus] = useState<RSVPStatus | null>(null)
  const [guestCount, setGuestCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMyRsvp(event.uuid)
      .then((r) => { setStatus(r.status); setGuestCount(r.guest_count) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [event.uuid])

  const handleSubmit = async () => {
    if (!status) return
    setSaving(true); setError(null)
    try {
      await upsertRsvp(event.uuid, status, guestCount)
      onDone()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save RSVP')
    } finally { setSaving(false) }
  }

  const options: { value: RSVPStatus; label: string; icon: React.ReactNode; activeStyle: React.CSSProperties; hoverClass: string }[] = [
    {
      value: 'yes', label: "I'm going!",
      icon: <FiCheck size={15} />,
      activeStyle: { background: '#16a34a', color: 'white', borderColor: '#16a34a' },
      hoverClass: 'hover:border-green-500 hover:text-green-600 hover:bg-green-50',
    },
    {
      value: 'maybe', label: 'Maybe',
      icon: <FiHelpCircle size={15} />,
      activeStyle: { background: '#d97706', color: 'white', borderColor: '#d97706' },
      hoverClass: 'hover:border-amber-500 hover:text-amber-600 hover:bg-amber-50',
    },
    {
      value: 'no', label: "Can't make it",
      icon: <FiX size={15} />,
      activeStyle: { background: '#dc2626', color: 'white', borderColor: '#dc2626' },
      hoverClass: 'hover:border-red-500 hover:text-red-600 hover:bg-red-50',
    },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white w-full max-w-[400px] overflow-hidden"
        style={{
          borderRadius: 16,
          border: '1.5px solid #f9a8d4',
          borderRightColor: '#be185d',
          borderBottomColor: '#be185d',
          boxShadow: '4px 4px 0px #be185d',
          animation: 'modal-in 0.18s ease',
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-start justify-between gap-3"
          style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)', borderBottom: '1.5px solid #fce7f3' }}
        >
          <div>
            <div className="text-[0.65rem] font-bold uppercase tracking-widest text-[#be185d] mb-1">RSVP</div>
            <h2 className="font-display text-[1.25rem] text-text-dark leading-tight">{event.title}</h2>
            {event.start_dt && (
              <div className="text-[0.78rem] text-text-muted mt-1 flex items-center gap-1.5">
                <FiCalendar size={11} /> {formatDateFull(event.start_dt)}
              </div>
            )}
            {event.location && (
              <div className="text-[0.78rem] text-text-muted mt-0.5 flex items-center gap-1.5">
                <FiMapPin size={11} /> {event.location}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-text-muted hover:bg-white hover:text-pink transition-colors flex-shrink-0 mt-0.5"
          >
            <FiX size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {loading ? (
            <div className="text-center py-6 text-text-muted text-sm">Loading…</div>
          ) : (
            <>
              <div className="text-[0.8rem] font-semibold text-text-dark mb-3">Will you be there?</div>
              <div className="flex flex-col gap-2 mb-4">
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatus(opt.value)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all duration-150 text-left font-semibold text-[0.85rem] ${opt.hoverClass}`}
                    style={
                      status === opt.value
                        ? opt.activeStyle
                        : { borderColor: 'var(--border)', background: 'white', color: 'var(--text-dark)' }
                    }
                  >
                    {opt.icon}
                    {opt.label}
                    {status === opt.value && <FiCheck size={13} className="ml-auto" />}
                  </button>
                ))}
              </div>

              {status === 'yes' && (
                <div className="mb-4 p-3 rounded-xl bg-[#f0fdf4] border border-[#86efac]">
                  <div className="text-[0.78rem] font-semibold text-[#15803d] mb-2 flex items-center gap-1.5">
                    <FiUsers size={12} /> Bringing extra guests?
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setGuestCount((n) => Math.max(0, n - 1))}
                      className="w-7 h-7 rounded-full border border-[#86efac] flex items-center justify-center text-[#15803d] hover:bg-[#dcfce7] transition-colors font-bold text-sm"
                    >−</button>
                    <span className="text-[1rem] font-bold text-[#15803d] w-5 text-center">{guestCount}</span>
                    <button
                      onClick={() => setGuestCount((n) => n + 1)}
                      className="w-7 h-7 rounded-full border border-[#86efac] flex items-center justify-center text-[#15803d] hover:bg-[#dcfce7] transition-colors font-bold text-sm"
                    >+</button>
                    <span className="text-[0.75rem] text-[#15803d]">additional guests</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-[0.78rem] text-red-600 mb-3 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!status || saving}
                className="w-full py-2.5 rounded-full font-semibold text-[0.88rem] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-white"
                style={{ background: '#C8375A' }}
              >
                {saving ? 'Saving…' : 'Save RSVP'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteModal({
  event,
  onClose,
  onDeleted,
}: {
  event: EventOut
  onClose: () => void
  onDeleted: () => void
}) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setDeleting(true); setError(null)
    try {
      await deleteEvent(event.uuid)
      onDeleted()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete event')
      setDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white w-full max-w-[360px] p-6 text-center"
        style={{
          borderRadius: 16,
          border: '1.5px solid #f9a8d4',
          borderRightColor: '#be185d',
          borderBottomColor: '#be185d',
          boxShadow: '4px 4px 0px #be185d',
          animation: 'modal-in 0.18s ease',
        }}
      >
        <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
          <FiTrash2 size={20} className="text-red-500" />
        </div>
        <h2 className="font-display text-[1.2rem] text-text-dark mb-2">Delete Event?</h2>
        <p className="text-[0.85rem] text-text-muted mb-5 leading-relaxed">
          <strong className="text-text-dark">"{event.title}"</strong> and all its data will be permanently removed. This can't be undone.
        </p>
        {error && (
          <div className="text-[0.78rem] text-red-600 mb-3 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
            {error}
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full border border-border text-[0.85rem] font-semibold text-text-dark hover:border-[#be185d] hover:text-[#be185d] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-full bg-red-500 text-white text-[0.85rem] font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Event Card ────────────────────────────────────────────────────────────────

function EventCard({
  event,
  myId,
  myDbId,
  onRsvp,
  onDelete,
}: {
  event: EventOut
  myId: string
  myDbId: number | null
  onRsvp: (event: EventOut) => void
  onDelete: (event: EventOut) => void
}) {
  const isHost = event.host_id === myId || event.host_id === myDbId

  return (
    <div
      className="bg-white flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-[2px] group"
      style={{
        borderRadius: 12,
        border: '1.5px solid #f9a8d4',
        borderRightColor: '#be185d',
        borderBottomColor: '#be185d',
        boxShadow: '3px 3px 0px #be185d',
      }}
    >
      {/* Flyer / image */}
      <Link to={`/events/${event.uuid}`} className="block no-underline flex-shrink-0">
        <div
          className="relative w-full overflow-hidden"
          style={{ height: 140, background: 'linear-gradient(135deg, #fce7f3 0%, #ede9ff 100%)' }}
        >
          {event.flyer_url ? (
            <img
              src={event.flyer_url}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center px-4 select-none">
                <div className="font-display text-[0.95rem] leading-snug text-text-dark">
                  Events are <span className="text-pink">better</span><br />when everyone plays a part
                </div>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />

          {/* Role badge */}
          <span
            className="absolute top-2.5 left-2.5 text-white text-[0.65rem] font-bold px-2.5 py-[3px] rounded-full uppercase tracking-[0.06em] flex items-center gap-1"
            style={{ background: isHost ? '#C8375A' : '#7F77DD' }}
          >
            {isHost ? <FiStar size={9} /> : <FiCheck size={9} />}
            {isHost ? 'Hosting' : 'Attending'}
          </span>
        </div>
      </Link>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Date + time */}
        {event.start_dt && (
          <div className="flex items-center gap-3 mb-2.5">
            <div className="flex items-center gap-1.5 text-[0.72rem] font-semibold text-[#be185d]">
              <FiCalendar size={11} />
              {formatDateShort(event.start_dt)}
            </div>
            {formatTime(event.start_dt) && (
              <div className="flex items-center gap-1 text-[0.72rem] text-text-muted">
                <FiClock size={10} />
                {formatTime(event.start_dt)}
              </div>
            )}
          </div>
        )}

        <Link to={`/events/${event.uuid}`} className="no-underline">
          <h3 className="text-[1rem] font-bold text-text-dark leading-snug mb-1 hover:text-[#be185d] transition-colors">
            {event.title}
          </h3>
        </Link>

        {event.location && (
          <div className="flex items-center gap-1.5 text-[0.78rem] text-text-muted mb-2 truncate">
            <FiMapPin size={11} className="flex-shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        )}

        {event.description && (
          <p className="text-[0.78rem] text-text-muted line-clamp-2 leading-relaxed mb-2">
            {event.description}
          </p>
        )}

        <div className="flex-1" />

        {/* Action row */}
        <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #fce7f3' }}>
          <Link
            to={`/events/${event.uuid}`}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-full text-[0.78rem] font-semibold text-[#be185d] no-underline transition-colors"
            style={{ background: '#fdf2f8', border: '1px solid #f9a8d4' }}
          >
            View Details <FiChevronRight size={12} />
          </Link>

          {!isHost && (
            <button
              onClick={() => onRsvp(event)}
              className="flex-1 py-2 rounded-full text-white text-[0.78rem] font-semibold transition-colors"
              style={{ background: '#C8375A' }}
            >
              RSVP
            </button>
          )}

          {isHost && (
            <button
              onClick={() => onDelete(event)}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors flex-shrink-0"
              style={{ border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626' }}
              title="Delete event"
              aria-label="Delete event"
            >
              <FiTrash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="font-display text-[1.1rem] text-text-dark">{title}</h2>
      <span
        className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full"
        style={{ background: '#fce7f3', color: '#be185d' }}
      >
        {count}
      </span>
      <div className="flex-1 h-px" style={{ background: '#fce7f3' }} />
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const { profile } = useAuth()
  const [events, setEvents] = useState<EventOut[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rsvpTarget, setRsvpTarget] = useState<EventOut | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EventOut | null>(null)

  const myId = profile?.cognito_sub ?? ''
  const myDbId = profile?.id ?? null

  const load = useCallback(() => {
    setLoading(true)
    getMyEvents()
      .then(setEvents)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  // Split into upcoming vs past, each sorted by start_dt
  const upcoming = events
    .filter((ev) => isUpcoming(ev.start_dt))
    .sort((a, b) => {
      if (!a.start_dt) return 1
      if (!b.start_dt) return -1
      return new Date(a.start_dt).getTime() - new Date(b.start_dt).getTime()
    })

  const past = events
    .filter((ev) => !isUpcoming(ev.start_dt))
    .sort((a, b) => {
      if (!a.start_dt) return 1
      if (!b.start_dt) return -1
      return new Date(b.start_dt).getTime() - new Date(a.start_dt).getTime()
    })

  const hostingCount = events.filter((ev) => ev.host_id === myId || ev.host_id === myDbId).length
  const attendingCount = events.length - hostingCount

  const cardProps = { myId, myDbId, onRsvp: setRsvpTarget, onDelete: setDeleteTarget }

  return (
    <>
      {rsvpTarget && (
        <RsvpModal event={rsvpTarget} onClose={() => setRsvpTarget(null)} onDone={() => setRsvpTarget(null)} />
      )}
      {deleteTarget && (
        <DeleteModal
          event={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setEvents((prev) => prev.filter((e) => e.uuid !== deleteTarget.uuid))
            setDeleteTarget(null)
          }}
        />
      )}

      <div className="pt-[calc(var(--nav-height)+2.5rem)] px-12 pb-16 flex-1 w-full max-[640px]:pt-6 max-[640px]:px-4">

        {/* ── Header row ── */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-5 flex-wrap">
            <h1 className="font-display text-[2.6rem] leading-[1.1] text-text-dark">My Celebrations</h1>

            {/* Stat pills — only when loaded */}
            {!loading && events.length > 0 && (
              <div className="flex items-center gap-2">
                <span
                  className="flex items-center gap-1.5 text-[0.72rem] font-bold px-3 py-1.5 rounded-full"
                  style={{ background: '#fce7f3', color: '#be185d', border: '1px solid #f9a8d4' }}
                >
                  <FiStar size={11} /> {hostingCount} hosting
                </span>
                <span
                  className="flex items-center gap-1.5 text-[0.72rem] font-bold px-3 py-1.5 rounded-full"
                  style={{ background: '#ede9ff', color: '#7F77DD', border: '1px solid #c4b5fd' }}
                >
                  <FiCheck size={11} /> {attendingCount} attending
                </span>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <Link
              to="/templates"
              className="flex items-center gap-1.5 rounded-full px-4 py-2.5 font-sans text-[0.82rem] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap no-underline"
              style={{ border: '1.5px solid var(--border)', background: 'white', color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#be185d'; e.currentTarget.style.color = '#be185d' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              <FiStar size={13} /> Browse Templates
            </Link>
            <Link
              to="/events/new"
              className="flex items-center gap-1.5 text-white border-none rounded-full px-5 py-2.5 font-sans text-[0.88rem] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap no-underline hover:opacity-90 hover:-translate-y-px"
              style={{ background: '#C8375A' }}
            >
              <FiPlus size={15} /> Create Event
            </Link>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-text-muted gap-3">
            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="#C8375A" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span className="text-[0.9rem]">Loading your events…</span>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="rounded-xl p-4 mb-6 text-[0.85rem] flex items-center gap-2"
            style={{ background: '#fff0f0', border: '1px solid #fca5a5', color: '#dc2626' }}>
            <FiX size={15} /> {error}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
              style={{ background: '#fce7f3', border: '1.5px solid #f9a8d4' }}
            >
              <FiCalendar size={26} color="#be185d" />
            </div>
            <h2 className="font-display text-[1.5rem] text-text-dark mb-2">No events yet</h2>
            <p className="text-text-muted text-[0.9rem] mb-6 max-w-[300px]">
              Create your first event or join one via an invite link.
            </p>
            <Link
              to="/events/new"
              className="inline-flex items-center gap-2 text-white border-none rounded-full px-6 py-3 font-sans text-[0.88rem] font-semibold no-underline hover:opacity-90 hover:-translate-y-px transition-all"
              style={{ background: '#C8375A' }}
            >
              <FiPlus size={15} /> Create New Event
            </Link>
          </div>
        )}

        {/* ── Upcoming section ── */}
        {!loading && !error && upcoming.length > 0 && (
          <div className="mb-10">
            <SectionHeading title="Upcoming" count={upcoming.length} />
            <div
              className="grid gap-5 max-[640px]:grid-cols-1"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}
            >
              {upcoming.map((ev) => (
                <EventCard key={ev.id} event={ev} {...cardProps} />
              ))}
            </div>
          </div>
        )}

        {/* ── Past section ── */}
        {!loading && !error && past.length > 0 && (
          <div>
            <SectionHeading title="Past Events" count={past.length} />
            <div
              className="grid gap-5 max-[640px]:grid-cols-1"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                opacity: 0.75,
              }}
            >
              {past.map((ev) => (
                <EventCard key={ev.id} event={ev} {...cardProps} />
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.96) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  )
}
