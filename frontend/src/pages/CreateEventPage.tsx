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

  // Shared input class
  const fieldInput = 'w-full border-[1.5px] border-border rounded-[var(--radius-sm)] px-[14px] py-[10px] font-sans text-[0.92rem] outline-none transition-[border-color] duration-200 mb-4 bg-white text-text-dark box-border focus:border-pink'

  return (
    <div className="pt-[calc(var(--nav-height)+2rem)] px-8 pb-12 max-w-[960px] mx-auto flex-1 w-full">
      <h1 className="font-heading text-[2.5rem] text-center text-text-dark mb-3">Let's get this party started.</h1>
      <p className="text-center text-text-muted text-[0.95rem] mb-10">
        Fill in the details below to create your event space. Don't stress, you can always change things later.
      </p>

      {tpl && (
        <div className="bg-pink-bg border border-pink-pale rounded-xl px-5 py-3 max-w-[960px] mx-auto mb-6 flex items-center gap-[10px] text-[0.9rem] text-[#555]">
          <span>✨</span>
          <span>Using the <strong className="text-pink">{tpl.title}</strong> template — title and description are pre-filled. Customize anything you like.</span>
        </div>
      )}

      {error && (
        <div className="bg-[#fff0f0] border border-[#fcc] rounded-lg px-4 py-3 mb-6 text-[#c00] max-w-[960px] mx-auto">
          ⚠ {error}
        </div>
      )}

      <form onSubmit={handleCreate}>
        <div className="grid grid-cols-2 gap-6 mb-6 max-[700px]:grid-cols-1">
          {/* Section 1: Basics */}
          <div className="bg-white rounded-[var(--radius-lg)] border border-border p-7">
            <div className="font-heading text-[1.25rem] text-text-dark flex items-center mb-5">
              <span className="inline-flex items-center justify-center w-7 h-7 bg-pink text-white rounded-full text-[0.8rem] font-bold mr-[10px]">1</span>
              The Basics
            </div>

            <label className="text-[0.85rem] font-semibold text-[#555] mb-[6px] block">Event Title *</label>
            <input
              className={fieldInput}
              placeholder="e.g., Sarah's Birthday Bash"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[0.85rem] font-semibold text-[#555] mb-[6px] block">Start Date</label>
                <input
                  className="w-full border-[1.5px] border-border rounded-[var(--radius-sm)] px-[14px] py-[10px] font-sans text-[0.92rem] outline-none transition-[border-color] duration-200 bg-white text-text-dark box-border focus:border-pink"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[0.85rem] font-semibold text-[#555] mb-[6px] block">Start Time</label>
                <input
                  className="w-full border-[1.5px] border-border rounded-[var(--radius-sm)] px-[14px] py-[10px] font-sans text-[0.92rem] outline-none transition-[border-color] duration-200 bg-white text-text-dark box-border focus:border-pink"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <div className="h-4" />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[0.85rem] font-semibold text-[#555] mb-[6px] block">End Date</label>
                <input
                  className="w-full border-[1.5px] border-border rounded-[var(--radius-sm)] px-[14px] py-[10px] font-sans text-[0.92rem] outline-none transition-[border-color] duration-200 bg-white text-text-dark box-border focus:border-pink"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[0.85rem] font-semibold text-[#555] mb-[6px] block">End Time</label>
                <input
                  className="w-full border-[1.5px] border-border rounded-[var(--radius-sm)] px-[14px] py-[10px] font-sans text-[0.92rem] outline-none transition-[border-color] duration-200 bg-white text-text-dark box-border focus:border-pink"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="h-4" />

            {/* Recurrence */}
            <label className="text-[0.85rem] font-semibold text-[#555] mb-[6px] block">Repeat</label>
            <select
              className="w-full border-[1.5px] border-border rounded-[var(--radius-sm)] px-[14px] py-[10px] font-sans text-[0.92rem] outline-none transition-[border-color] duration-200 mb-2 bg-white text-text-dark box-border focus:border-pink"
              value={recurrenceRule}
              onChange={(e) => setRecurrenceRule(e.target.value)}
            >
              <option value="">Does not repeat</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
            {recurrenceRule && (
              <>
                <label className="text-[0.85rem] font-semibold text-[#555] mb-[6px] block">Repeat until</label>
                <input
                  className="w-full border-[1.5px] border-border rounded-[var(--radius-sm)] px-[14px] py-[10px] font-sans text-[0.92rem] outline-none transition-[border-color] duration-200 mb-2 bg-white text-text-dark box-border focus:border-pink"
                  type="date"
                  value={recurrenceEndDate}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                />
              </>
            )}

            <div className="h-2" />
            <label className="text-[0.85rem] font-semibold text-[#555] mb-[6px] block">Location</label>
            <input
              className={fieldInput}
              placeholder="🔍 Search address or venue..."
              value={location_}
              onChange={(e) => setLocation(e.target.value)}
            />
            <label className="text-[0.85rem] font-semibold text-[#555] mb-[6px] block">Description</label>
            <textarea
              className="w-full border-[1.5px] border-border rounded-[var(--radius-sm)] px-[14px] py-[10px] font-sans text-[0.92rem] outline-none transition-[border-color] duration-200 mb-4 bg-white text-text-dark box-border resize-y min-h-[100px] focus:border-pink"
              placeholder="Tell your guests what to expect..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Section 2: Flyer */}
          <div className="bg-white rounded-[var(--radius-lg)] border border-border p-7">
            <div className="font-heading text-[1.25rem] text-text-dark flex items-center mb-5">
              <span className="inline-flex items-center justify-center w-7 h-7 bg-pink text-white rounded-full text-[0.8rem] font-bold mr-[10px]">2</span>
              Event Flyer
            </div>
            <p className="text-[0.88rem] text-text-muted mb-4">
              Upload a flyer or cover image for your event (optional).
            </p>

            {/* Flyer upload */}
            <div
              className={`border-2 border-dashed border-border rounded-[var(--radius-sm)] text-center cursor-pointer transition-[border-color] duration-200 overflow-hidden hover:border-pink ${flyerPreview ? 'p-0 border-none' : 'p-8'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {flyerPreview ? (
                <img src={flyerPreview} alt="Flyer preview" className="w-full object-cover rounded-lg" style={{ height: 180 }} />
              ) : (
                <>
                  <div className="text-[2rem] mb-2">🖼️</div>
                  <div className="font-semibold text-[0.9rem]">Upload a flyer</div>
                  <div className="text-[0.78rem] text-text-muted mt-1">PNG, JPG, GIF up to 5 MB</div>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFlyerChange}
            />
            {flyerPreview && (
              <button
                type="button"
                className="mt-2 text-[0.8rem] text-text-muted bg-transparent border-none cursor-pointer underline"
                onClick={() => { setFlyerFile(null); setFlyerPreview(null) }}
              >
                Remove flyer
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-8">
          <button
            type="button"
            className="bg-transparent border-[1.5px] border-border rounded-full px-8 py-3 font-sans text-[0.92rem] font-medium text-[#555] cursor-pointer transition-all duration-200 hover:border-[#aaa]"
            onClick={() => navigate('/events')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-text-dark text-white border-none rounded-full px-9 py-3 font-sans text-[0.92rem] font-bold cursor-pointer transition-all duration-200 shadow-[3px_3px_0_var(--pink)] disabled:opacity-60 disabled:cursor-not-allowed hover:enabled:-translate-x-px hover:enabled:-translate-y-px hover:enabled:shadow-[5px_5px_0_var(--pink)]"
            disabled={loading}
          >
            {loading ? 'Creating…' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  )
}
