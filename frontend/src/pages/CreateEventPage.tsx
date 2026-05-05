import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { createEvent } from '../api/events'
import { useAuth } from '../auth/AuthContext'

interface TemplatePrefill {
  title: string
  description: string
  hasPotluck: boolean
  polls: string[]
  tasks: string[]
}

export default function CreateEventPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useAuth()

  // Read template prefill from router state if coming from Browse Templates
  const tpl = (location.state as { template?: TemplatePrefill } | null)?.template

  // Form state — seeded from template if present
  const [title, setTitle] = useState(tpl?.title ?? '')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location_, setLocation] = useState('')
  const [description, setDescription] = useState(tpl?.description ?? '')
  const [recurrenceRule, setRecurrenceRule] = useState('')
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')
  const [flyerFile, setFlyerFile] = useState<File | null>(null)
  const [flyerPreview, setFlyerPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFlyerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFlyerFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setFlyerPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Event title is required.')
      return
    }
    setError(null)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      if (description) formData.append('description', description)
      if (location_) formData.append('location', location_)

      // Combine date + time into ISO string
      if (date) {
        const startIso = time ? `${date}T${time}:00` : `${date}T00:00:00`
        formData.append('start_dt', startIso)
      }
      if (endDate) {
        const endIso = endTime ? `${endDate}T${endTime}:00` : `${endDate}T23:59:00`
        formData.append('end_dt', endIso)
      }

      if (recurrenceRule) {
        formData.append('recurrence_rule', recurrenceRule)
      }
      if (recurrenceEndDate) {
        formData.append('recurrence_end_dt', `${recurrenceEndDate}T23:59:00`)
      }

      if (flyerFile) {
        formData.append('flyer', flyerFile)
      }

      // Pass display name so the host member record shows a real name
      const displayName = profile?.display_name ?? profile?.email
      if (displayName) formData.append('display_name', displayName)

      const event = await createEvent(formData)
      navigate(`/events/${event.uuid}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create event. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-page">
      <h1 className="create-title">Let's get this party started.</h1>
      <p className="create-sub">
        Fill in the details below to create your event space. Don't stress, you can always change things later.
      </p>

      {tpl && (
        <div style={{ background: 'var(--pink-bg)', border: '1px solid var(--pink-pale)', borderRadius: 12, padding: '0.75rem 1.25rem', maxWidth: 960, margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', color: 'var(--text-mid)' }}>
          <span>✨</span>
          <span>Using the <strong style={{ color: 'var(--pink)' }}>{tpl.title}</strong> template — title and description are pre-filled. Customize anything you like.</span>
        </div>
      )}

      {error && (
        <div style={{ background: '#fff0f0', border: '1px solid #fcc', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#c00', maxWidth: 960, margin: '0 auto 1.5rem' }}>
          ⚠ {error}
        </div>
      )}

      <form onSubmit={handleCreate}>
        <div className="create-grid">
          {/* Section 1: Basics */}
          <div className="create-section">
            <div className="section-title">
              <span className="section-num">1</span> The Basics
            </div>
            <label className="field-label">Event Title *</label>
            <input
              className="field-input"
              placeholder="e.g., Sarah's Birthday Bash"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <div className="date-time-row">
              <div>
                <label className="field-label">Start Date</label>
                <input
                  className="field-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{ marginBottom: 0 }}
                />
              </div>
              <div>
                <label className="field-label">Start Time</label>
                <input
                  className="field-input"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  style={{ marginBottom: 0 }}
                />
              </div>
            </div>
            <div style={{ height: '1rem' }} />
            <div className="date-time-row">
              <div>
                <label className="field-label">End Date</label>
                <input
                  className="field-input"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ marginBottom: 0 }}
                />
              </div>
              <div>
                <label className="field-label">End Time</label>
                <input
                  className="field-input"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={{ marginBottom: 0 }}
                />
              </div>
            </div>
            <div style={{ height: '1rem' }} />

            {/* Recurrence */}
            <label className="field-label">Repeat</label>
            <select
              className="field-input"
              value={recurrenceRule}
              onChange={(e) => setRecurrenceRule(e.target.value)}
              style={{ marginBottom: '0.5rem' }}
            >
              <option value="">Does not repeat</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
            {recurrenceRule && (
              <>
                <label className="field-label">Repeat until</label>
                <input
                  className="field-input"
                  type="date"
                  value={recurrenceEndDate}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                  style={{ marginBottom: '0.5rem' }}
                />
              </>
            )}

            <div style={{ height: '0.5rem' }} />
            <label className="field-label">Location</label>
            <input
              className="field-input"
              placeholder="🔍 Search address or venue..."
              value={location_}
              onChange={(e) => setLocation(e.target.value)}
            />
            <label className="field-label">Description</label>
            <textarea
              className="field-input"
              placeholder="Tell your guests what to expect..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Section 2: Flyer */}
          <div className="create-section">
            <div className="section-title">
              <span className="section-num">2</span> Event Flyer
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Upload a flyer or cover image for your event (optional).
            </p>

            {/* Flyer upload */}
            <div
              className="flyer-drop"
              onClick={() => fileInputRef.current?.click()}
              style={flyerPreview ? { padding: 0, border: 'none' } : {}}
            >
              {flyerPreview ? (
                <img src={flyerPreview} alt="Flyer preview" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 8 }} />
              ) : (
                <>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🖼️</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Upload a flyer</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>PNG, JPG, GIF up to 5 MB</div>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFlyerChange}
            />
            {flyerPreview && (
              <button
                type="button"
                style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => { setFlyerFile(null); setFlyerPreview(null) }}
              >
                Remove flyer
              </button>
            )}
          </div>
        </div>

        <div className="create-actions">
          <button type="button" className="btn-cancel" onClick={() => navigate('/events')}>Cancel</button>
          <button type="submit" className="btn-create-event" disabled={loading}>
            {loading ? 'Creating…' : 'Create Event'}
          </button>
        </div>
      </form>

      <style>{`
        .create-page {
          padding: calc(var(--nav-height) + 2rem) 2rem 3rem;
          max-width: 960px;
          margin: 0 auto;
          flex: 1;
          width: 100%;
        }
        .create-title {
          font-family: 'Cantora One', cursive;
          font-size: 2.5rem;
          text-align: center;
          color: var(--text-dark);
          margin-bottom: 0.75rem;
        }
        .create-sub {
          text-align: center;
          color: var(--text-muted);
          font-size: 0.95rem;
          margin-bottom: 2.5rem;
        }
        .create-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .create-section {
          background: white;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          padding: 1.75rem;
        }
        .section-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: var(--pink);
          color: white;
          border-radius: 50%;
          font-size: 0.8rem;
          font-weight: 700;
          margin-right: 10px;
        }
        .section-title {
          font-family: 'Cantora One', cursive;
          font-size: 1.25rem;
          color: var(--text-dark);
          display: flex;
          align-items: center;
          margin-bottom: 1.25rem;
        }
        .field-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-mid);
          margin-bottom: 6px;
          display: block;
        }
        .field-input {
          width: 100%;
          border: 1.5px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 10px 14px;
          font-family: 'Albert Sans', sans-serif;
          font-size: 0.92rem;
          outline: none;
          transition: border-color 0.2s;
          margin-bottom: 1rem;
          background: white;
          color: var(--text-dark);
          box-sizing: border-box;
        }
        .field-input:focus { border-color: var(--pink); }
        textarea.field-input { resize: vertical; min-height: 100px; }
        .date-time-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .flyer-drop {
          border: 2px dashed var(--border);
          border-radius: var(--radius-sm);
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.2s;
          overflow: hidden;
        }
        .flyer-drop:hover { border-color: var(--pink); }
        .create-actions {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-top: 2rem;
        }
        .btn-cancel {
          background: none;
          border: 1.5px solid var(--border);
          border-radius: 100px;
          padding: 12px 32px;
          font-family: 'Albert Sans', sans-serif;
          font-size: 0.92rem;
          font-weight: 500;
          color: var(--text-mid);
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-cancel:hover { border-color: #aaa; }
        .btn-create-event {
          background: var(--text-dark);
          color: white;
          border: none;
          border-radius: 100px;
          padding: 12px 36px;
          font-family: 'Albert Sans', sans-serif;
          font-size: 0.92rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 3px 3px 0 var(--pink);
        }
        .btn-create-event:hover:not(:disabled) {
          transform: translate(-1px, -1px);
          box-shadow: 5px 5px 0 var(--pink);
        }
        .btn-create-event:disabled { opacity: 0.6; cursor: not-allowed; }
        @media (max-width: 700px) {
          .create-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
