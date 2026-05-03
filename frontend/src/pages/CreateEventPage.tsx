import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function CreateEventPage() {
  const navigate = useNavigate()
  const [features, setFeatures] = useState({ potluck: false, polls: false, chat: true })
  const [vibeSelected, setVibeSelected] = useState(0)
  const [loading, setLoading] = useState(false)

  const toggleFeature = (k: keyof typeof features) =>
    setFeatures((f) => ({ ...f, [k]: !f[k] }))

  const handleCreate = async () => {
    setLoading(true)
    // Simulate API call — replace with real fetch to /events
    await new Promise((res) => setTimeout(res, 600))
    setLoading(false)
    navigate('/events')
  }

  return (
    <div className="create-page">
      <h1 className="create-title">Let's get this party started.</h1>
      <p className="create-sub">
        Fill in the details below to create your event space. Don't stress, you can always change things later.
      </p>

      <div className="create-grid">
        {/* Section 1: Basics */}
        <div className="create-section">
          <div className="section-title">
            <span className="section-num">1</span> The Basics
          </div>
          <label className="field-label">Event Title</label>
          <input className="field-input" placeholder="e.g., Sarah's Birthday Bash" />
          <div className="date-time-row">
            <div>
              <label className="field-label">Date</label>
              <input className="field-input" type="date" style={{ marginBottom: 0 }} />
            </div>
            <div>
              <label className="field-label">Time</label>
              <input className="field-input" type="time" style={{ marginBottom: 0 }} />
            </div>
          </div>
          <div style={{ height: '1rem' }} />
          <label className="field-label">Location</label>
          <input className="field-input" placeholder="🔍 Search address or venue..." />
          <label className="field-label">Description</label>
          <textarea className="field-input" placeholder="Tell your guests what to expect..." />
        </div>

        {/* Section 2: Vibe Check */}
        <div className="create-section">
          <div className="section-title">
            <span className="section-num">2</span> Vibe Check
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Choose a cover image that sets the mood for your gathering.
          </p>
          <div className="vibe-images">
            {['🎉 Party Vibes', '🌿 Casual Hangout', '🎂 Birthday Bash'].map((label, i) => (
              <div
                key={i}
                className={`vibe-img${vibeSelected === i ? ' selected' : ''}`}
                onClick={() => setVibeSelected(i)}
              >
                <div
                  className="vibe-img-inner"
                  style={{
                    background:
                      i === 0
                        ? 'linear-gradient(135deg,#EEEDFE,#F5D0DF)'
                        : i === 1
                        ? 'linear-gradient(135deg,#EAF3DE,#E1F5EE)'
                        : 'linear-gradient(135deg,#FAEEDA,#F5D0DF)',
                  }}
                >
                  <span>{label}</span>
                </div>
                <div className="vibe-check">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Supercharge */}
        <div className="create-section supercharge-section">
          <div className="section-title">
            <span className="section-num">3</span> Supercharge Your Event
          </div>
          <div className="feature-grid">
            {[
              { key: 'potluck' as const, icon: '🥘', name: 'Potluck List', desc: "Let guests claim items to bring so you don't end up with 5 bags of ice." },
              { key: 'polls' as const, icon: '📊', name: 'Group Polls', desc: "Can't decide on a date or theme? Let your guests vote on the details." },
              { key: 'chat' as const, icon: '💬', name: 'Event Chat', desc: 'A dedicated space for hype, questions, and sharing photos after the party.' },
            ].map((f) => (
              <div
                key={f.key}
                className={`feature-toggle${features[f.key] ? ' active' : ''}`}
                onClick={() => toggleFeature(f.key)}
              >
                <div className="feature-check" />
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-name">{f.name}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="create-actions">
        <button className="btn-cancel" onClick={() => navigate('/events')}>Cancel</button>
        <button className="btn-create-event" onClick={handleCreate} disabled={loading}>
          {loading ? 'Creating…' : 'Create Event'}
        </button>
      </div>

      <style>{`
        .create-page {
          padding: calc(var(--nav-height) + 2rem) 2rem 3rem;
          max-width: 960px;
          margin: 0 auto;
          min-height: 100vh;
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
        }
        .field-input:focus { border-color: var(--pink); }
        textarea.field-input { resize: vertical; min-height: 100px; }
        .date-time-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .vibe-images {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .vibe-img {
          border-radius: var(--radius-sm);
          overflow: hidden;
          position: relative;
          cursor: pointer;
          border: 2px solid transparent;
          transition: border-color 0.2s;
        }
        .vibe-img.selected { border-color: var(--pink); }
        .vibe-img-inner {
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .vibe-check {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 22px;
          height: 22px;
          background: var(--pink);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .vibe-img.selected .vibe-check { opacity: 1; }
        .supercharge-section { grid-column: 1 / -1; }
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        .feature-toggle {
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }
        .feature-toggle:hover { border-color: var(--pink-light); }
        .feature-toggle.active { border-color: var(--pink); background: var(--pink-bg); }
        .feature-check {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1.5px solid var(--border);
          transition: all 0.2s;
        }
        .feature-toggle.active .feature-check { background: var(--pink); border-color: var(--pink); }
        .feature-icon { font-size: 1.2rem; margin-bottom: 8px; }
        .feature-name { font-size: 0.88rem; font-weight: 700; margin-bottom: 4px; }
        .feature-desc { font-size: 0.78rem; color: var(--text-muted); line-height: 1.5; }
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
          .feature-grid { grid-template-columns: 1fr; }
          .supercharge-section { grid-column: 1; }
        }
      `}</style>
    </div>
  )
}
