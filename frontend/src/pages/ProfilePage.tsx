import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { updateMe } from '../api/users'
import { getMyEvents } from '../api/events'
import { getReminders, createReminder, deleteReminder } from '../api/events'
import type { EventOut } from '../api/types'
import type { ReminderOut } from '../api/events'

const REMINDER_OPTIONS = [
  { label: '1 hour before', minutes: 60 },
  { label: '6 hours before', minutes: 360 },
  { label: '24 hours before', minutes: 1440 },
  { label: '1 week before', minutes: 10080 },
]

function EventReminderRow({ event }: { event: EventOut }) {
  const [reminders, setReminders] = useState<ReminderOut[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getReminders(event.uuid).then(setReminders).catch(() => {}).finally(() => setLoading(false))
  }, [event.uuid])

  const activeOffsets = new Set(reminders.map(r => r.offset_minutes))

  const toggle = async (minutes: number) => {
    setBusy(true)
    try {
      const existing = reminders.find(r => r.offset_minutes === minutes)
      if (existing) {
        await deleteReminder(event.uuid, existing.id)
        setReminders(prev => prev.filter(r => r.id !== existing.id))
      } else {
        const r = await createReminder(event.uuid, minutes)
        setReminders(prev => [...prev, r])
      }
    } catch { /* ignore */ } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '0.75rem' }}>
      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-dark)', marginBottom: '0.25rem' }}>{event.title}</div>
      {event.start_dt && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          {new Date(event.start_dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </div>
      )}
      {!event.start_dt && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>No date set</div>
      )}
      {loading ? (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {REMINDER_OPTIONS.map(opt => {
            const active = activeOffsets.has(opt.minutes)
            return (
              <button
                key={opt.minutes}
                onClick={() => !busy && event.start_dt && toggle(opt.minutes)}
                disabled={busy || !event.start_dt}
                style={{
                  padding: '4px 12px',
                  borderRadius: 100,
                  border: `1.5px solid ${active ? 'var(--pink)' : 'var(--border)'}`,
                  background: active ? 'var(--pink-bg)' : 'white',
                  color: active ? 'var(--pink)' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: active ? 600 : 400,
                  cursor: event.start_dt ? 'pointer' : 'not-allowed',
                  fontFamily: 'Albert Sans',
                  opacity: busy ? 0.6 : 1,
                  transition: 'all 0.15s',
                }}
              >
                {active ? '✓ ' : ''}{opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'reminders' ? 'reminders' : 'profile'
  const [tab, setTab] = useState(initialTab)

  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [events, setEvents] = useState<EventOut[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)

  useEffect(() => {
    if (profile) setDisplayName(profile.display_name ?? '')
  }, [profile])

  useEffect(() => {
    if (tab === 'reminders' && events.length === 0) {
      setEventsLoading(true)
      getMyEvents().then(setEvents).catch(() => {}).finally(() => setEventsLoading(false))
    }
  }, [tab])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      await updateMe({ display_name: displayName || undefined })
      await refreshProfile()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const tabStyle = (t: string) => ({
    padding: '8px 20px',
    borderRadius: 100,
    border: 'none',
    background: tab === t ? 'var(--pink)' : 'none',
    color: tab === t ? 'white' : 'var(--text-muted)',
    fontFamily: 'Albert Sans',
    fontSize: '0.88rem',
    fontWeight: tab === t ? 600 : 400,
    cursor: 'pointer',
    transition: 'all 0.15s',
  })

  return (
    <div style={{ padding: 'calc(var(--nav-height) + 2.5rem) 2rem 3rem', maxWidth: 560, margin: '0 auto', minHeight: '100vh' }}>
      <h1 style={{ fontFamily: "'Cantora One', cursive", fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>
        Your Account
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Manage your profile and notification preferences.
      </p>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--pink-bg)', borderRadius: 100, padding: 4, marginBottom: '2rem', width: 'fit-content' }}>
        <button style={tabStyle('profile')} onClick={() => setTab('profile')}>Profile</button>
        <button style={tabStyle('reminders')} onClick={() => setTab('reminders')}>Reminders</button>
      </div>

      {tab === 'profile' && (
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
          <form onSubmit={handleSave}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>
              Email
            </label>
            <input
              readOnly
              value={profile?.email ?? ''}
              style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.92rem', marginBottom: '1.25rem', background: '#fafafa', color: 'var(--text-muted)', fontFamily: 'Albert Sans', boxSizing: 'border-box' }}
            />

            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>
              Display Name
            </label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="How should we call you?"
              style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.92rem', marginBottom: '1.5rem', fontFamily: 'Albert Sans', outline: 'none', boxSizing: 'border-box' }}
            />

            {error && (
              <div style={{ background: '#fff0f0', border: '1px solid #fcc', borderRadius: 6, padding: '0.75rem', marginBottom: '1rem', color: '#c00', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ background: '#e6f9ee', border: '1px solid #b7ebc8', borderRadius: 6, padding: '0.75rem', marginBottom: '1rem', color: '#1a7a3c', fontSize: '0.85rem' }}>
                Profile saved!
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{ background: 'var(--pink)', color: 'white', border: 'none', borderRadius: 100, padding: '12px 32px', fontFamily: 'Albert Sans', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {tab === 'reminders' && (
        <div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Get an email reminder before your events start. Toggle the times you want for each event.
          </p>
          {eventsLoading && <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Loading your events...</div>}
          {!eventsLoading && events.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>You're not in any events yet.</div>
          )}
          {events.map(ev => <EventReminderRow key={ev.uuid} event={ev} />)}
        </div>
      )}
    </div>
  )
}
