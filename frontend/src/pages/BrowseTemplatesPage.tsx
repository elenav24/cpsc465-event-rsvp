import { useNavigate } from 'react-router-dom'
import starSvg from '../assets/star.svg'

interface TemplateFeature {
  icon: string
  label: string
}

interface Template {
  id: string
  title: string
  description: string
  gradient: string
  accentColor: string
  emoji: string
  bestFor: string
  features: TemplateFeature[]
  prefill: {
    title: string
    description: string
    hasPotluck: boolean
    polls: string[]
    tasks: string[]
  }
  featured?: boolean
}

const TEMPLATES: Template[] = [
  {
    id: 'backyard-bbq',
    title: 'Backyard BBQ',
    description: 'Sizzling grills and sunset chills. The ultimate blueprint for a relaxed outdoor gathering with friends.',
    gradient: 'from-orange-100 to-pink-100',
    accentColor: '#e07b54',
    emoji: '🔥',
    bestFor: '10–25 guests',
    features: [
      { icon: '🥗', label: 'Potluck Signup' },
      { icon: '📋', label: 'Grill Duty Tasks' },
    ],
    prefill: {
      title: 'Backyard BBQ',
      description: "Fire up the grill and bring your appetite! We're hosting a backyard BBQ and we'd love for you to join. Good food, great company, and plenty of sunshine.",
      hasPotluck: true,
      polls: ['What time works best?', 'Burgers or hot dogs?'],
      tasks: ['Set up tables & chairs', 'Buy charcoal & lighter fluid', 'Prepare the grill', 'Set up drinks station'],
    },
  },
  {
    id: 'movie-night',
    title: 'Movie Night',
    description: 'Popcorn, cozy blankets, and the silver screen. Perfect for low-key evenings and cinematic marathons.',
    gradient: 'from-indigo-100 to-purple-100',
    accentColor: '#7c6fcd',
    emoji: '🎬',
    bestFor: '4–12 guests',
    features: [
      { icon: '🎞️', label: 'Curated Watchlist Poll' },
      { icon: '🍿', label: 'Snack Potluck' },
    ],
    prefill: {
      title: 'Movie Night',
      description: "Grab your blanket and get ready for a cozy movie night! We'll vote on what to watch and everyone's bringing snacks.",
      hasPotluck: true,
      polls: ['Which movie should we watch?', 'Indoor or outdoor screening?'],
      tasks: ['Set up projector / TV', 'Arrange seating & blankets', 'Prepare popcorn station'],
    },
  },
  {
    id: 'potluck-dinner',
    title: 'Potluck Dinner',
    description: "Sharing is caring. Manage who's bringing what without the awkward group chat spreadsheets.",
    gradient: 'from-green-100 to-teal-100',
    accentColor: '#4caf8a',
    emoji: '🍲',
    bestFor: '8–20 guests',
    features: [
      { icon: '📋', label: 'Smart Signup Sheet' },
      { icon: '🥘', label: 'Dietary Tracker' },
    ],
    prefill: {
      title: 'Potluck Dinner',
      description: "Let's share a meal together! Sign up to bring a dish and we'll make sure we have a balanced spread — appetizers, mains, sides, and desserts.",
      hasPotluck: true,
      polls: ['Cuisine theme?', 'Dietary restrictions to accommodate?'],
      tasks: ['Collect dietary restrictions', 'Set up serving table', 'Prepare plates & utensils'],
    },
  },
  {
    id: 'birthday-bash',
    title: 'Birthday Bash',
    description: "The ultimate party starter. From digital RSVPs to collaborative playlists, we thought of everything so you can actually enjoy the cake.",
    gradient: 'from-pink-100 to-yellow-100',
    accentColor: '#e05c8a',
    emoji: '🎂',
    bestFor: 'Any size',
    features: [
      { icon: '✅', label: 'RSVP Tracking' },
      { icon: '🎵', label: 'Spotify Collab' },
    ],
    prefill: {
      title: 'Birthday Bash 🎉',
      description: "It's time to celebrate! Join us for a birthday bash filled with good vibes, great people, and even better cake. RSVP so we know to save you a slice.",
      hasPotluck: false,
      polls: ['Cake flavor?', 'Theme: Formal or Casual?'],
      tasks: ['Order / bake the cake', 'Decorate the venue', 'Prepare party favors', 'Create playlist'],
    },
    featured: true,
  },
  {
    id: 'study-session',
    title: 'Study Session',
    description: 'Turn a grind into a group win. Organize focused sprints and collaborative breaks with ease.',
    gradient: 'from-blue-100 to-purple-100',
    accentColor: '#5b8dee',
    emoji: '📚',
    bestFor: '2–8 people',
    features: [
      { icon: '⏱️', label: 'Focus Timers Included' },
      { icon: '☕', label: 'Snack Break Poll' },
    ],
    prefill: {
      title: 'Study Session',
      description: "Let's get productive together! We'll do focused work sprints with breaks in between. Bring your laptop, notes, and a positive attitude.",
      hasPotluck: false,
      polls: ['Pomodoro length: 25 or 50 min?', 'Location preference?'],
      tasks: ['Share study materials', 'Set up timer', 'Assign break activities'],
    },
  },
  {
    id: 'game-night',
    title: 'Game Night',
    description: 'Board games, card games, or video games — let the group vote and let the chaos begin.',
    gradient: 'from-yellow-100 to-orange-100',
    accentColor: '#f0a030',
    emoji: '🎲',
    bestFor: '4–16 guests',
    features: [
      { icon: '🗳️', label: 'Game Vote Poll' },
      { icon: '🏆', label: 'Score Tracker Task' },
    ],
    prefill: {
      title: 'Game Night',
      description: "It's game night! Vote on what we're playing, bring your competitive spirit, and get ready for a night of laughs and friendly rivalry.",
      hasPotluck: true,
      polls: ['Board games or video games?', 'Which game should we play?'],
      tasks: ['Gather game supplies', 'Set up game area', 'Prepare prizes for winners'],
    },
  },
]

function TemplateCard({ template, onUse }: { template: Template; onUse: (t: Template) => void }) {
  return (
    <div className="tpl-card" onClick={() => onUse(template)}>
      {/* Image area */}
      <div className={`tpl-img bg-gradient-to-br ${template.gradient}`}>
        {template.featured && (
          <span className="tpl-badge">Most Popular</span>
        )}
        <span className="tpl-emoji">{template.emoji}</span>
      </div>

      {/* Body */}
      <div className="tpl-body">
        <h3 className="tpl-title">{template.title}</h3>
        <p className="tpl-desc">{template.description}</p>

        <div className="tpl-features">
          {template.features.map((f) => (
            <span key={f.label} className="tpl-feature">
              {f.icon} {f.label}
            </span>
          ))}
        </div>

        <div className="tpl-footer">
          <span className="tpl-best-for">👥 Best for {template.bestFor}</span>
          <span className="tpl-use-btn">Use Template →</span>
        </div>
      </div>
    </div>
  )
}

export default function BrowseTemplatesPage() {
  const navigate = useNavigate()

  const handleUse = (template: Template) => {
    navigate('/events/new', { state: { template: template.prefill } })
  }

  return (
    <div className="tpl-page">
      {/* Hero */}
      <div className="tpl-hero">
        <img src={starSvg} alt="" aria-hidden className="tpl-star tpl-star-left" style={{ filter: 'brightness(0) saturate(100%) invert(60%) sepia(30%) saturate(400%) hue-rotate(300deg)' }} />
        <img src={starSvg} alt="" aria-hidden className="tpl-star tpl-star-right" style={{ filter: 'brightness(0) saturate(100%) invert(60%) sepia(30%) saturate(400%) hue-rotate(300deg)' }} />
        <h1 className="tpl-hero-title">Start with <em>Joy.</em></h1>
        <p className="tpl-hero-sub">
          Skip the blank page. Pick a template designed to foster connection,<br />
          and customize it to make it your own in minutes.
        </p>
      </div>

      {/* Grid */}
      <div className="tpl-grid">
        {TEMPLATES.map((t) => (
          <TemplateCard key={t.id} template={t} onUse={handleUse} />
        ))}
      </div>

      {/* CTA bottom */}
      <div className="tpl-cta">
        <h2 className="tpl-cta-title">Don't see your vibe?</h2>
        <p className="tpl-cta-sub">
          Create a custom event from scratch and make it entirely your own.
        </p>
        <button className="tpl-cta-btn" onClick={() => navigate('/events/new')}>
          Create from Scratch
        </button>
      </div>

      <style>{`
        .tpl-page {
          flex: 1;
          padding-top: var(--nav-height);
          width: 100%;
        }

        /* Hero */
        .tpl-hero {
          text-align: center;
          padding: 4rem 2rem 3rem;
          position: relative;
          overflow: hidden;
        }
        .tpl-star {
          position: absolute;
          opacity: 0.18;
          pointer-events: none;
        }
        .tpl-star-left  { width: 80px; top: 2rem; left: 6%; }
        .tpl-star-right { width: 56px; bottom: 1rem; right: 8%; }
        .tpl-hero-title {
          font-family: 'Cantora One', cursive;
          font-size: clamp(2.4rem, 5vw, 3.8rem);
          color: var(--text-dark);
          margin-bottom: 1rem;
          line-height: 1.1;
        }
        .tpl-hero-title em {
          font-style: italic;
          color: var(--pink);
        }
        .tpl-hero-sub {
          font-size: 1rem;
          color: var(--text-muted);
          line-height: 1.7;
          max-width: 520px;
          margin: 0 auto;
        }

        /* Grid */
        .tpl-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 2rem 4rem;
        }

        /* Card */
        .tpl-card {
          background: white;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
        }
        .tpl-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow);
          border-color: var(--pink-light);
        }
        .tpl-img {
          height: 160px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .tpl-emoji {
          font-size: 3.5rem;
          line-height: 1;
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.1));
        }
        .tpl-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: var(--pink);
          color: white;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 100px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .tpl-body {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .tpl-title {
          font-family: 'Cantora One', cursive;
          font-size: 1.3rem;
          color: var(--text-dark);
          margin-bottom: 0.5rem;
        }
        .tpl-desc {
          font-size: 0.88rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 1rem;
          flex: 1;
        }
        .tpl-features {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-bottom: 1rem;
        }
        .tpl-feature {
          font-size: 0.75rem;
          background: var(--pink-bg);
          color: var(--text-mid);
          border-radius: 100px;
          padding: 3px 10px;
          white-space: nowrap;
        }
        .tpl-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid var(--border-light);
          padding-top: 0.75rem;
          margin-top: auto;
        }
        .tpl-best-for {
          font-size: 0.78rem;
          color: var(--text-muted);
        }
        .tpl-use-btn {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--pink);
        }

        /* Bottom CTA */
        .tpl-cta {
          background: var(--pink-pale);
          text-align: center;
          padding: 4rem 2rem;
          border-radius: 32px;
          max-width: 1100px;
          margin: 0 auto 4rem;
        }
        .tpl-cta-title {
          font-family: 'Cantora One', cursive;
          font-size: clamp(1.8rem, 3vw, 2.4rem);
          color: var(--text-dark);
          margin-bottom: 0.75rem;
        }
        .tpl-cta-sub {
          font-size: 0.95rem;
          color: var(--text-muted);
          margin-bottom: 1.75rem;
        }
        .tpl-cta-btn {
          background: var(--pink-dark, #973B69);
          color: white;
          border: none;
          border-radius: 100px;
          padding: 14px 36px;
          font-family: 'Albert Sans', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tpl-cta-btn:hover {
          background: var(--accent-dark);
          transform: translateY(-2px);
          box-shadow: var(--shadow-accent);
        }

        @media (max-width: 900px) {
          .tpl-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 580px) {
          .tpl-grid { grid-template-columns: 1fr; padding: 0 1rem 3rem; }
          .tpl-hero { padding: 3rem 1rem 2rem; }
          .tpl-cta { margin: 0 1rem 3rem; }
        }
      `}</style>
    </div>
  )
}
