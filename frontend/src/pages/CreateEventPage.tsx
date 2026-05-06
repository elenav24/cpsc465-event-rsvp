import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  FiCalendar, FiClock, FiMapPin, FiAlignLeft, FiRepeat,
  FiImage, FiUpload, FiX, FiCheck, FiPlus,
} from 'react-icons/fi'
import { createEvent } from '../api/events'
import { useAuth } from '../auth/AuthContext'

// ── Template image library (sourced from BrowseTemplatesPage) ─────────────────

interface TemplateImage {
  id: string
  label: string
  url: string
}

const TEMPLATE_IMAGES: TemplateImage[] = [
  { id: 'backyard-bbq',    label: 'Backyard BBQ',    url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80' },
  { id: 'movie-night',     label: 'Movie Night',     url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80' },
  { id: 'potluck-dinner',  label: 'Potluck Dinner',  url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80' },
  { id: 'birthday-bash',   label: 'Birthday Bash',   url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=80' },
  { id: 'study-session',   label: 'Study Session',   url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80' },
  { id: 'game-night',      label: 'Game Night',      url: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&q=80' },
  { id: 'picnic',          label: 'Park Picnic',     url: 'https://images.unsplash.com/photo-1526401485004-46910ecc8e51?w=600&q=80' },
  { id: 'brunch',          label: 'Sunday Brunch',   url: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=600&q=80' },
  { id: 'watch-party',     label: 'Watch Party',     url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=600&q=80' },
  { id: 'hike',            label: 'Group Hike',      url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80' },
  { id: 'dinner-party',    label: 'Dinner Party',    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80' },
]

// Map template id → image url for auto-selection when coming from BrowseTemplates
const TEMPLATE_IMAGE_MAP: Record<string, string> = Object.fromEntries(
  TEMPLATE_IMAGES.map((t) => [t.id, t.url])
)

interface TemplatePrefill {
  id?: string
  title: string
  description: string
  hasPotluck: boolean
  polls: string[]
  tasks: string[]
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const FIELD =
  'w-full border-[1.5px] border-[#d8b4fe] rounded-xl px-4 py-2.5 font-sans text-[0.9rem] outline-none transition-colors duration-200 bg-white text-text-dark box-border focus:border-[#6C3483] placeholder:text-[#c4b5fd]'

const CARD_STYLE: React.CSSProperties = {
  background: 'white',
  borderRadius: 14,
  border: '1.5px solid #d8b4fe',
  borderRightColor: '#6C3483',
  borderBottomColor: '#6C3483',
  boxShadow: '4px 4px 0px #6C3483',
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ step, label, icon }: { step: number; label: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span
        className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-[0.75rem] font-bold flex-shrink-0"
        style={{ background: '#6C3483' }}
      >
        {step}
      </span>
      <span className="flex items-center gap-2 font-bold text-[1.05rem] text-text-dark">
        {icon} {label}
      </span>
    </div>
  )
}

// ── Field label ───────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[0.78rem] font-bold uppercase tracking-wider text-[#6C3483] mb-1.5">
      {children}
    </label>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CreateEventPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useAuth()

  const tpl = (location.state as { template?: TemplatePrefill } | null)?.template

  // Auto-select the template image if we came from BrowseTemplates
  const autoImageUrl = tpl?.id ? (TEMPLATE_IMAGE_MAP[tpl.id] ?? null) : null

  const [title, setTitle] = useState(tpl?.title ?? '')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location_, setLocation] = useState('')
  const [description, setDescription] = useState(tpl?.description ?? '')
  const [recurrenceRule, setRecurrenceRule] = useState('')
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')

  // Flyer: either a File upload or a template image URL
  const [flyerFile, setFlyerFile] = useState<File | null>(null)
  const [flyerPreview, setFlyerPreview] = useState<string | null>(null)
  const [selectedTemplateImage, setSelectedTemplateImage] = useState<string | null>(autoImageUrl)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // The active preview is either the uploaded file preview or the selected template image
  const activePreview = flyerPreview ?? selectedTemplateImage

  const handleFlyerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFlyerFile(file)
    setSelectedTemplateImage(null) // clear template selection when uploading
    const reader = new FileReader()
    reader.onload = (ev) => setFlyerPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSelectTemplateImage = (url: string) => {
    if (selectedTemplateImage === url) {
      // deselect
      setSelectedTemplateImage(null)
    } else {
      setSelectedTemplateImage(url)
      setFlyerFile(null)
      setFlyerPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const clearFlyer = () => {
    setFlyerFile(null)
    setFlyerPreview(null)
    setSelectedTemplateImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Event title is required.'); return }
    setError(null)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      if (description) formData.append('description', description)
      if (location_) formData.append('location', location_)

      if (date) {
        formData.append('start_dt', time ? `${date}T${time}:00` : `${date}T00:00:00`)
      }
      if (endDate) {
        formData.append('end_dt', endTime ? `${endDate}T${endTime}:00` : `${endDate}T23:59:00`)
      }
      if (recurrenceRule) formData.append('recurrence_rule', recurrenceRule)
      if (recurrenceEndDate) formData.append('recurrence_end_dt', `${recurrenceEndDate}T23:59:00`)

      if (flyerFile) {
        // Uploaded file takes priority
        formData.append('flyer', flyerFile)
      } else if (selectedTemplateImage) {
        // Fetch the template image and attach it as a file
        const res = await fetch(selectedTemplateImage)
        const blob = await res.blob()
        const ext = blob.type.includes('png') ? 'png' : 'jpg'
        formData.append('flyer', new File([blob], `flyer.${ext}`, { type: blob.type }))
      }

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
    <div
      className="pt-[calc(var(--nav-height)+2.5rem)] px-8 pb-16 max-w-[1000px] mx-auto flex-1 w-full max-[640px]:px-4"
    >
      {/* ── Page heading ── */}
      <div className="text-center mb-10">
        <div
          className="inline-block text-[0.65rem] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3"
          style={{ background: '#f3e8ff', color: '#6C3483', border: '1px solid #d8b4fe' }}
        >
          New Event
        </div>
        <h1 className="font-display text-[2.6rem] leading-[1.1] text-text-dark mb-2">
          Let's get this party started.
        </h1>
        <p className="text-text-muted text-[0.95rem]">
          Fill in the details below. You can always change things later.
        </p>
      </div>

      {/* ── Template banner ── */}
      {tpl && (
        <div
          className="flex items-center gap-3 px-5 py-3 rounded-xl mb-6 text-[0.88rem]"
          style={{ background: '#f3e8ff', border: '1.5px solid #d8b4fe', color: '#4a2070' }}
        >
          <FiCheck size={15} color="#6C3483" className="flex-shrink-0" />
          <span>
            Using the <strong>{tpl.title}</strong> template — title and description are pre-filled.
            {autoImageUrl && ' A matching cover image has been selected for you.'}
          </span>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl mb-6 text-[0.88rem]"
          style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' }}
        >
          <FiX size={14} /> {error}
        </div>
      )}

      <form onSubmit={handleCreate}>
        <div className="grid grid-cols-2 gap-6 mb-6 max-[700px]:grid-cols-1">

          {/* ── Card 1: Basics ── */}
          <div style={CARD_STYLE} className="p-6">
            <SectionHeader step={1} label="The Basics" icon={<FiAlignLeft size={15} color="#6C3483" />} />

            <Label>Event Title *</Label>
            <input
              className={`${FIELD} mb-4`}
              placeholder="e.g., Sarah's Birthday Bash"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <Label>Start</Label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="relative">
                <FiCalendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a78bfa] pointer-events-none" />
                <input
                  className={`${FIELD} pl-8`}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="relative">
                <FiClock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a78bfa] pointer-events-none" />
                <input
                  className={`${FIELD} pl-8`}
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <Label>End</Label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="relative">
                <FiCalendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a78bfa] pointer-events-none" />
                <input
                  className={`${FIELD} pl-8`}
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="relative">
                <FiClock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a78bfa] pointer-events-none" />
                <input
                  className={`${FIELD} pl-8`}
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <Label>
              <span className="flex items-center gap-1.5"><FiRepeat size={11} /> Repeat</span>
            </Label>
            <select
              className={`${FIELD} mb-4`}
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
                <Label>Repeat Until</Label>
                <input
                  className={`${FIELD} mb-4`}
                  type="date"
                  value={recurrenceEndDate}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                />
              </>
            )}

            <Label>
              <span className="flex items-center gap-1.5"><FiMapPin size={11} /> Location</span>
            </Label>
            <input
              className={`${FIELD} mb-4`}
              placeholder="Address or venue name"
              value={location_}
              onChange={(e) => setLocation(e.target.value)}
            />

            <Label>Description</Label>
            <textarea
              className={`${FIELD} resize-y min-h-[90px]`}
              placeholder="Tell your guests what to expect…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* ── Card 2: Flyer ── */}
          <div style={CARD_STYLE} className="p-6 flex flex-col">
            <SectionHeader step={2} label="Cover Image" icon={<FiImage size={15} color="#6C3483" />} />

            {/* Preview */}
            <div
              className="relative w-full rounded-xl overflow-hidden mb-4 flex-shrink-0"
              style={{
                height: 160,
                background: 'linear-gradient(135deg, #f3e8ff 0%, #ede9ff 100%)',
                border: '1.5px dashed #d8b4fe',
              }}
            >
              {activePreview ? (
                <>
                  <img
                    src={activePreview}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearFlyer}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white transition-colors"
                    style={{ background: 'rgba(0,0,0,0.5)' }}
                    title="Remove image"
                  >
                    <FiX size={13} />
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-[#a78bfa] select-none">
                  <FiImage size={28} />
                  <span className="text-[0.78rem] font-medium">No image selected</span>
                </div>
              )}
            </div>

            {/* Upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[0.82rem] font-semibold mb-5 transition-all duration-150"
              style={{
                border: '1.5px solid #d8b4fe',
                background: '#f3e8ff',
                color: '#6C3483',
              }}
            >
              <FiUpload size={13} /> Upload your own image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFlyerChange}
            />

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: '#e9d5ff' }} />
              <span className="text-[0.72rem] font-bold uppercase tracking-wider text-[#a78bfa]">or pick a template image</span>
              <div className="flex-1 h-px" style={{ background: '#e9d5ff' }} />
            </div>

            {/* Template image grid */}
            <div className="grid grid-cols-3 gap-2 overflow-y-auto flex-1" style={{ maxHeight: 260 }}>
              {TEMPLATE_IMAGES.map((img) => {
                const selected = selectedTemplateImage === img.url
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => handleSelectTemplateImage(img.url)}
                    className="relative rounded-lg overflow-hidden transition-all duration-150 group"
                    style={{
                      aspectRatio: '4/3',
                      border: selected ? '2.5px solid #6C3483' : '2px solid transparent',
                      boxShadow: selected ? '0 0 0 2px #d8b4fe' : 'none',
                      outline: 'none',
                    }}
                    title={img.label}
                  >
                    <img
                      src={img.url}
                      alt={img.label}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    {/* Hover label */}
                    <div
                      className="absolute inset-0 flex items-end p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)' }}
                    >
                      <span className="text-white text-[0.6rem] font-semibold leading-tight">{img.label}</span>
                    </div>
                    {/* Selected checkmark */}
                    {selected && (
                      <div
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: '#6C3483' }}
                      >
                        <FiCheck size={10} color="white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex justify-center gap-3 mt-8">
          <button
            type="button"
            className="px-7 py-3 rounded-full font-sans text-[0.9rem] font-semibold transition-all duration-200"
            style={{ border: '1.5px solid #d8b4fe', background: 'white', color: '#6C3483' }}
            onClick={() => navigate('/events')}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 rounded-full font-sans text-[0.9rem] font-bold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:enabled:-translate-y-px"
            style={{
              background: '#6C3483',
              border: '1.5px solid #6C3483',
              borderRightColor: '#3b1a4a',
              borderBottomColor: '#3b1a4a',
              boxShadow: '3px 3px 0px #3b1a4a',
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Creating…
              </>
            ) : (
              <><FiPlus size={15} /> Create Event</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
