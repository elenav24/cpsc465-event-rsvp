import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'

const sampleMessages = [
  { id: 1, user: 'Sarah J.', text: 'So excited for this!! 🎉', mine: false, initials: 'SJ' },
  { id: 2, user: 'Mike T.', text: "I'll bring the potato salad!", mine: false, initials: 'MT' },
  { id: 3, user: 'You', text: "Can't wait to see everyone 🔥", mine: true, initials: 'ME' },
  { id: 4, user: 'Jess D.', text: 'What time should we actually arrive?', mine: false, initials: 'JD' },
]

const sampleEvents: Record<string, { title: string; location: string }> = {
  '1': { title: 'Summer Ending Potluck', location: '123 Maple St, Austin, TX' },
  '2': { title: "Sarah's Birthday Bash", location: '456 Oak Ave, Austin, TX' },
}

export default function EventPage() {
  const { id } = useParams<{ id: string }>()
  const ev = (id && sampleEvents[id]) || { title: 'Summer Ending Potluck', location: '123 Sunshine Ave, Austin, TX' }

  const [activeTab, setActiveTab] = useState('chat')
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState(sampleMessages)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!chatInput.trim()) return
    setMessages((m) => [...m, { id: Date.now(), user: 'You', text: chatInput, mine: true, initials: 'ME' }])
    setChatInput('')
  }

  const sidebarItems = [
    {
      key: 'chat',
      label: 'Event Chat',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      key: 'polls',
      label: 'Polls',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="10" width="4" height="11" rx="1" />
          <rect x="10" y="6" width="4" height="15" rx="1" />
          <rect x="17" y="2" width="4" height="19" rx="1" />
        </svg>
      ),
    },
    {
      key: 'guests',
      label: 'Guest List',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="9" cy="7" r="4" />
          <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
          <path d="M16 3.13a4 4 0 010 7.75" />
          <path d="M21 21v-2a4 4 0 00-3-3.87" />
        </svg>
      ),
    },
    {
      key: 'files',
      label: 'Files',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="event-page">
      <div className="event-main">
        {/* Hero */}
        <div className="event-hero">
          <div className="event-hero-badge">📅 Aug 15 • 2:00 PM</div>
          <div className="event-hero-text">
            Events are <span>better</span> when everyone plays a part
          </div>
        </div>

        {/* Content */}
        <div className="event-content">
          <div className="event-cat-badge">🎉 Social Gathering</div>
          <h1 className="event-title">{ev.title}</h1>
          <div className="event-location">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5A4.5 4.5 0 0113.5 6c0 3-4.5 8.5-4.5 8.5S4.5 9 4.5 6A4.5 4.5 0 018 1.5z" stroke="var(--text-muted)" strokeWidth="1.5" />
              <circle cx="8" cy="6" r="1.5" stroke="var(--text-muted)" strokeWidth="1.5" />
            </svg>
            {ev.location}
          </div>

          <div className="event-rsvp-row">
            <button className="btn-cantmake">Can't Make It</button>
            <button className="btn-going">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="white" strokeWidth="1.5" />
                <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              I'm Going!
            </button>
          </div>

          <div className="event-info-grid">
            <div className="info-card">
              <div className="info-card-title">About the Event</div>
              <div className="info-card-content">
                Get ready for the ultimate summer send-off! We're firing up the grill, chilling the drinks, and setting up the yard games. Bring your favorite side dish if you'd like, but mostly just bring yourselves.
              </div>
              <div style={{ marginTop: '1rem' }}>
                <div className="detail-row">
                  <span className="detail-icon">🍴</span>
                  <div>
                    <div className="detail-label">Food & Drink</div>
                    <div className="detail-val">Burgers, hotdogs, and veggie options provided. BYOB!</div>
                  </div>
                </div>
                <div className="detail-row">
                  <span className="detail-icon">🎮</span>
                  <div>
                    <div className="detail-label">Activities</div>
                    <div className="detail-val">Cornhole, giant Jenga, and a firepit for s'mores later.</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="info-card">
              <div className="info-card-title">Hosted by</div>
              <div className="info-card-host">
                <div className="host-avatar">SJ</div>
                <div>
                  <div className="host-name">Sarah Jenkins</div>
                  <div className="host-contact">Contact Host</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="event-sidebar">
        <div className="sidebar-top">
          <div className="sidebar-lounge">
            <div className="lounge-avatar">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="6" r="3" stroke="var(--pink)" strokeWidth="1.5" />
                <path d="M3 15c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="var(--pink)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="lounge-name">Event Lounge</div>
              <div className="lounge-sub">Collaborate with guests</div>
            </div>
          </div>
        </div>

        <div className="sidebar-nav">
          {sidebarItems.map((item) => (
            <div
              key={item.key}
              className={`sidebar-item${activeTab === item.key ? ' active' : ''}`}
              onClick={() => setActiveTab(item.key)}
            >
              {item.icon} {item.label}
            </div>
          ))}
        </div>

        {activeTab === 'chat' && (
          <div className="chat-panel">
            <div className="chat-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`chat-msg${msg.mine ? ' mine' : ''}`}>
                  <div className="chat-bubble-avatar">{msg.initials}</div>
                  <div className="chat-bubble">
                    <div className="chat-bubble-name">{msg.user}</div>
                    <div className="chat-bubble-text">{msg.text}</div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="chat-input-row">
              <input
                className="chat-input"
                placeholder="Say something..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button className="btn-send" onClick={sendMessage} aria-label="Send message">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M14 8L2 2l3 6-3 6 12-6z" fill="white" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'guests' && (
          <div style={{ padding: '1rem', fontSize: '0.85rem' }}>
            {['Sarah Jenkins (Host)', 'Jake D.', 'Mike T.', 'Jess D.', 'You'].map((g, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="host-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                  {g.slice(0, 2).toUpperCase()}
                </div>
                <span style={{ color: 'var(--text-dark)' }}>{g}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'polls' && (
          <div style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div style={{ background: 'var(--pink-bg)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.5rem' }}>What should we watch after?</div>
              {['Interstellar 🚀', 'The Grand Budapest Hotel 🏨', 'Mamma Mia 🎵'].map((opt, i) => (
                <div key={i} style={{ padding: '6px 10px', marginBottom: 4, borderRadius: 6, background: 'white', border: '1px solid var(--border)', fontSize: '0.8rem', cursor: 'pointer' }}>
                  {opt}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
            <div>No files shared yet.</div>
            <button style={{ marginTop: '1rem', background: 'var(--pink-bg)', border: '1px solid var(--pink-pale)', borderRadius: 100, padding: '8px 16px', color: 'var(--pink)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'Albert Sans' }}>
              Upload File
            </button>
          </div>
        )}

        <div className="sidebar-bottom">
          <button className="btn-cohost">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="6" cy="6" r="3" stroke="var(--pink)" strokeWidth="1.5" />
              <path d="M2 14c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="var(--pink)" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M13 6v4M11 8h4" stroke="var(--pink)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Invite Co-host
          </button>
        </div>
      </div>

      <style>{`
        .event-page {
          display: flex;
          min-height: 100vh;
          padding-top: var(--nav-height);
          width: 100%;
        }
        .event-main {
          flex: 1;
          overflow-y: auto;
        }
        .event-hero {
          width: 100%;
          height: 280px;
          background: linear-gradient(135deg, var(--purple-pale) 0%, var(--pink-pale) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .event-hero-badge {
          position: absolute;
          top: 20px;
          left: 24px;
          background: white;
          border-radius: 100px;
          padding: 5px 14px;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: var(--shadow-sm);
          font-weight: 500;
        }
        .event-hero-text {
          font-family: 'Anton', sans-serif;
          font-size: 2rem;
          text-align: center;
          color: var(--text-dark);
          max-width: 60%;
          line-height: 1.2;
        }
        .event-hero-text span { color: var(--pink); }
        .event-content { padding: 2rem 2.5rem; }
        .event-cat-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--pink-bg);
          border: 1px solid var(--pink-pale);
          border-radius: 100px;
          padding: 5px 14px;
          font-size: 0.82rem;
          color: var(--pink);
          font-weight: 600;
          margin-bottom: 0.75rem;
        }
        .event-title {
          font-family: 'Anton', sans-serif;
          font-size: 2.2rem;
          margin-bottom: 4px;
          color: var(--text-dark);
        }
        .event-location {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-bottom: 1.5rem;
        }
        .event-rsvp-row {
          display: flex;
          gap: 1rem;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid var(--border);
        }
        .btn-going {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--pink);
          color: white;
          border: none;
          border-radius: 100px;
          padding: 12px 28px;
          font-family: 'Albert Sans', sans-serif;
          font-size: 0.92rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-going:hover { background: #b04068; }
        .btn-cantmake {
          background: none;
          border: 1.5px solid var(--border);
          border-radius: 100px;
          padding: 11px 24px;
          font-family: 'Albert Sans', sans-serif;
          font-size: 0.92rem;
          font-weight: 500;
          color: var(--text-mid);
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-cantmake:hover { border-color: #aaa; }
        .event-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .info-card {
          background: white;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          padding: 1.25rem;
        }
        .info-card-title {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.07em;
          margin-bottom: 0.75rem;
        }
        .info-card-content {
          font-size: 0.95rem;
          line-height: 1.7;
          color: var(--text-mid);
        }
        .info-card-host {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .host-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--purple-pale), var(--pink-pale));
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--pink);
          flex-shrink: 0;
        }
        .host-name { font-size: 1.1rem; font-weight: 700; }
        .host-contact {
          font-size: 0.82rem;
          color: var(--pink);
          text-decoration: underline;
          cursor: pointer;
          margin-top: 2px;
        }
        .detail-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 0.75rem;
        }
        .detail-icon { font-size: 1.1rem; margin-top: 1px; flex-shrink: 0; }
        .detail-label { font-size: 0.82rem; font-weight: 700; color: var(--text-muted); }
        .detail-val { font-size: 0.88rem; color: var(--text-mid); }

        /* Sidebar */
        .event-sidebar {
          width: 260px;
          background: white;
          border-left: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          height: calc(100vh - var(--nav-height));
          position: sticky;
          top: var(--nav-height);
        }
        .sidebar-top {
          padding: 1.25rem;
          border-bottom: 1px solid var(--border);
        }
        .sidebar-lounge {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          background: var(--pink-bg);
        }
        .lounge-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--purple-pale), var(--pink-pale));
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .lounge-name { font-weight: 700; font-size: 0.9rem; color: var(--pink); }
        .lounge-sub { font-size: 0.75rem; color: var(--text-muted); }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          padding: 0.75rem;
          gap: 2px;
        }
        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 0.88rem;
          font-weight: 500;
          color: var(--text-mid);
          transition: all 0.15s;
        }
        .sidebar-item svg { width: 18px; height: 18px; flex-shrink: 0; }
        .sidebar-item:hover, .sidebar-item.active {
          background: var(--pink-bg);
          color: var(--pink);
        }
        .sidebar-bottom {
          padding: 1rem;
          margin-top: auto;
          border-top: 1px solid var(--border);
        }
        .btn-cohost {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--pink-bg);
          border: 1.5px solid var(--pink-pale);
          border-radius: var(--radius-sm);
          padding: 11px;
          font-family: 'Albert Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--pink);
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-cohost:hover { background: var(--pink-pale); }

        /* Chat */
        .chat-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 1rem;
          overflow: hidden;
          min-height: 0;
        }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 0.5rem 0;
        }
        .chat-msg {
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }
        .chat-msg.mine { flex-direction: row-reverse; }
        .chat-bubble-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--purple-pale), var(--pink-pale));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--pink);
          flex-shrink: 0;
        }
        .chat-bubble {
          background: var(--pink-bg);
          border-radius: 14px;
          padding: 8px 12px;
          max-width: 80%;
        }
        .chat-msg.mine .chat-bubble { background: var(--pink); color: white; }
        .chat-bubble-name {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--pink);
          margin-bottom: 2px;
        }
        .chat-msg.mine .chat-bubble-name { color: rgba(255,255,255,0.8); }
        .chat-bubble-text { font-size: 0.85rem; line-height: 1.5; }
        .chat-input-row {
          display: flex;
          gap: 8px;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border);
        }
        .chat-input {
          flex: 1;
          border: 1.5px solid var(--border);
          border-radius: 100px;
          padding: 9px 16px;
          font-family: 'Albert Sans', sans-serif;
          font-size: 0.88rem;
          outline: none;
          transition: border-color 0.2s;
          background: white;
          color: var(--text-dark);
        }
        .chat-input:focus { border-color: var(--pink); }
        .btn-send {
          background: var(--pink);
          color: white;
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.2s;
        }
        .btn-send:hover { background: #b04068; }

        @media (max-width: 768px) {
          .event-page { flex-direction: column; }
          .event-sidebar {
            width: 100%;
            height: auto;
            position: static;
            border-left: none;
            border-top: 1px solid var(--border);
          }
          .event-info-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
