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
    gradient: 'from-pink-pale to-pink-100',
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
    gradient: 'from-pink-pale to-purple-100',
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
    gradient: 'from-pink-pale to-teal-100',
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
    gradient: 'from-pink-pale to-yellow-100',
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
    gradient: 'from-pink-pale to-purple-100',
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
    gradient: 'from-pink-pale to-orange-100',
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
    <div
      className="bg-white rounded-[var(--radius-lg)] border border-border overflow-hidden cursor-pointer transition-[transform,box-shadow] duration-200 shadow-[var(--shadow-sm)] flex flex-col hover:-translate-y-1 hover:shadow-[var(--shadow)] hover:border-pink-light"
      onClick={() => onUse(template)}
    >
      {/* Image area */}
      <div className={`h-[160px] bg-gradient-to-br ${template.gradient} flex items-center justify-center relative`}>
        {template.featured && (
          <span className="absolute top-3 left-3 bg-pink text-white text-[0.7rem] font-bold px-3 py-1 rounded-full uppercase tracking-[0.06em]">
            Most Popular
          </span>
        )}
        <span className="text-[3.5rem] leading-none" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))' }}>
          {template.emoji}
        </span>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-heading text-[1.3rem] text-text-dark mb-2">{template.title}</h3>
        <p className="text-[0.88rem] text-text-muted leading-[1.6] mb-4 flex-1">{template.description}</p>

        <div className="flex flex-wrap gap-[0.4rem] mb-4">
          {template.features.map((f) => (
            <span key={f.label} className="text-[0.75rem] bg-pink-bg text-[#555] rounded-full px-[10px] py-[3px] whitespace-nowrap">
              {f.icon} {f.label}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border-light pt-3 mt-auto">
          <span className="text-[0.78rem] text-text-muted">👥 Best for {template.bestFor}</span>
          <span className="text-[0.82rem] font-bold text-pink">Use Template →</span>
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
    <div className="flex-1 pt-[var(--nav-height)] w-full">
      {/* Hero */}
      <div className="text-center px-8 pt-16 pb-12 relative overflow-hidden">
        <img
          src={starSvg}
          alt=""
          aria-hidden
          className="absolute opacity-[0.18] pointer-events-none w-[80px] top-8 left-[6%]"
          style={{ filter: 'brightness(0) saturate(100%) invert(60%) sepia(30%) saturate(400%) hue-rotate(300deg)' }}
        />
        <img
          src={starSvg}
          alt=""
          aria-hidden
          className="absolute opacity-[0.18] pointer-events-none w-[56px] bottom-4 right-[8%]"
          style={{ filter: 'brightness(0) saturate(100%) invert(60%) sepia(30%) saturate(400%) hue-rotate(300deg)' }}
        />
        <h1 className="font-heading text-text-dark mb-4 leading-[1.1]" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)' }}>
          Start with <em className="italic text-pink">Joy.</em>
        </h1>
        <p className="text-[1rem] text-text-muted leading-[1.7] max-w-[520px] mx-auto">
          Skip the blank page. Pick a template designed to foster connection,<br />
          and customize it to make it your own in minutes.
        </p>
      </div>

      {/* Grid */}
      <div className="grid gap-6 max-w-[1400px] mx-auto px-8 pb-16 max-[900px]:grid-cols-2 max-[580px]:grid-cols-1 max-[580px]:px-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {TEMPLATES.map((t) => (
          <TemplateCard key={t.id} template={t} onUse={handleUse} />
        ))}
      </div>

      {/* CTA bottom */}
      <div className="bg-pink-pale text-center px-8 py-16 rounded-[32px] max-w-[1400px] mx-auto mb-16 max-[580px]:mx-4 max-[580px]:mb-12">
        <h2 className="font-heading text-text-dark mb-3" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)' }}>
          Don't see your vibe?
        </h2>
        <p className="text-[0.95rem] text-text-muted mb-7">
          Create a custom event from scratch and make it entirely your own.
        </p>
        <button
          className="bg-pink-dark text-white border-none rounded-full px-9 py-[14px] font-sans text-[1rem] font-bold cursor-pointer transition-all duration-200 hover:bg-accent-dark hover:-translate-y-0.5 hover:shadow-[var(--shadow-accent)]"
          onClick={() => navigate('/events/new')}
        >
          Create from Scratch
        </button>
      </div>
    </div>
  )
}
