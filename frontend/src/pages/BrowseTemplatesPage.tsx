import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import starSvg from '../assets/star.svg'

// ─── Template Data ────────────────────────────────────────────────────────────
export interface TemplateFeature {
  type: 'poll' | 'potluck' | 'task'
  label: string
}

export interface Template {
  id: string
  title: string
  tag: string
  category: string
  image: string
  description: string
  guestRange: string
  features: TemplateFeature[]
  prefill: {
    title: string
    description: string
    hasPotluck: boolean
    polls: string[]
    tasks: string[]
  }
}

const TEMPLATES: Template[] = [
  {
    id: 'backyard-bbq',
    title: 'Backyard BBQ',
    tag: 'Casual',
    category: 'Casual',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80',
    description: 'The classic summer hangout. Perfect for burgers, cold drinks, and good music under the sun.',
    guestRange: '10–30 Guests',
    features: [
      { type: 'potluck', label: 'Potluck Signup' },
      { type: 'task', label: 'Grill Duty Tasks' },
    ],
    prefill: {
      title: 'Backyard BBQ',
      description: "Fire up the grill and bring your appetite! We're hosting a backyard BBQ — good food, great company, and plenty of sunshine.",
      hasPotluck: true,
      polls: ['What time works best?'],
      tasks: ['Set up tables & chairs', 'Buy charcoal & lighter fluid', 'Prepare the grill', 'Set up drinks station'],
    },
  },
  {
    id: 'movie-night',
    title: 'Movie Night',
    tag: 'Cozy',
    category: 'Cozy',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80',
    description: 'Popcorn, projectors, and cozy blankets. Set up a cinematic experience in your living room or yard.',
    guestRange: '4–12 Guests',
    features: [
      { type: 'poll', label: 'Movie Vote Poll' },
      { type: 'potluck', label: 'Snack Potluck' },
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
    tag: 'Social',
    category: 'Social',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
    description: "Share the load and the flavor. Coordinate who's bringing what with our interactive dish signup list.",
    guestRange: '6–20 Guests',
    features: [
      { type: 'potluck', label: 'Dish Signup Sheet' },
      { type: 'task', label: 'Setup Tasks' },
    ],
    prefill: {
      title: 'Potluck Dinner',
      description: "Let's share a meal together! Sign up to bring a dish — appetizers, mains, sides, and desserts all welcome.",
      hasPotluck: true,
      polls: ['Cuisine theme?'],
      tasks: ['Collect dietary restrictions', 'Set up serving table', 'Prepare plates & utensils'],
    },
  },
  {
    id: 'birthday-bash',
    title: 'Birthday Bash',
    tag: 'Energetic',
    category: 'Energetic',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=80',
    description: 'Make the day to remember with customizable RSVPs, countdowns, and a space for guest photos.',
    guestRange: 'Any Size',
    features: [
      { type: 'poll', label: 'Theme Vote' },
      { type: 'task', label: 'Party Prep Tasks' },
    ],
    prefill: {
      title: 'Birthday Bash 🎉',
      description: "It's time to celebrate! Join us for a birthday bash filled with good vibes, great people, and even better cake.",
      hasPotluck: false,
      polls: ['Cake flavor?', 'Theme: Formal or Casual?'],
      tasks: ['Order / bake the cake', 'Decorate the venue', 'Prepare party favors', 'Create playlist'],
    },
  },
  {
    id: 'study-session',
    title: 'Study Session',
    tag: 'Productive',
    category: 'Productive',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80',
    description: 'Coffee, focus, and collaboration. Organize a group session to tackle projects or exam prep together.',
    guestRange: '2–8 People',
    features: [
      { type: 'poll', label: 'Location Poll' },
      { type: 'task', label: 'Study Tasks' },
    ],
    prefill: {
      title: 'Study Session',
      description: "Let's get productive together! Focused work sprints with breaks in between. Bring your laptop and a positive attitude.",
      hasPotluck: false,
      polls: ['Pomodoro length: 25 or 50 min?', 'Location preference?'],
      tasks: ['Share study materials', 'Set up timer', 'Assign break activities'],
    },
  },
  {
    id: 'game-night',
    title: 'Game Night',
    tag: 'Social',
    category: 'Social',
    image: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&q=80',
    description: 'Board games, card games, or console marathons. Let guests know what to bring and keep score easily.',
    guestRange: '4–16 Guests',
    features: [
      { type: 'poll', label: 'Game Vote Poll' },
      { type: 'task', label: 'Score Tracker' },
    ],
    prefill: {
      title: 'Game Night',
      description: "It's game night! Vote on what we're playing, bring your competitive spirit, and get ready for a night of laughs.",
      hasPotluck: true,
      polls: ['Board games or video games?', 'Which game should we play?'],
      tasks: ['Gather game supplies', 'Set up game area', 'Prepare prizes for winners'],
    },
  },
  {
    id: 'picnic',
    title: 'Park Picnic',
    tag: 'Casual',
    category: 'Casual',
    image: 'https://images.unsplash.com/photo-1526401485004-46910ecc8e51?w=600&q=80',
    description: 'Sunshine, blankets, and good food. Coordinate who brings what so nobody shows up with three bags of chips.',
    guestRange: '6–20 Guests',
    features: [
      { type: 'potluck', label: 'Picnic Supplies' },
      { type: 'task', label: 'Setup Tasks' },
    ],
    prefill: {
      title: 'Park Picnic',
      description: "Let's take it outside! Bring a blanket and sign up for a picnic item so we have a great spread.",
      hasPotluck: true,
      polls: ['Which park?'],
      tasks: ['Bring blankets / chairs', 'Bring sunscreen', 'Bring a frisbee or ball', 'Bring trash bags'],
    },
  },
  {
    id: 'brunch',
    title: 'Sunday Brunch',
    tag: 'Cozy',
    category: 'Cozy',
    image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=600&q=80',
    description: 'Mimosas, pancakes, and good conversation. The perfect low-key weekend gathering for your crew.',
    guestRange: '4–14 Guests',
    features: [
      { type: 'potluck', label: 'Dish Signup' },
      { type: 'poll', label: 'Time Poll' },
    ],
    prefill: {
      title: 'Sunday Brunch',
      description: "Brunch is better together. Sign up to bring a dish and let's make a spread worth waking up for.",
      hasPotluck: true,
      polls: ['10am or 11am start?'],
      tasks: ['Buy OJ & sparkling wine', 'Set the table', 'Prep coffee station'],
    },
  },
  {
    id: 'watch-party',
    title: 'Watch Party',
    tag: 'Social',
    category: 'Social',
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=600&q=80',
    description: "Cheer together, cry together. Whether it's the finale or the big game, watch parties are better with a crowd.",
    guestRange: '6–20 Guests',
    features: [
      { type: 'potluck', label: 'Snack Signup' },
      { type: 'task', label: 'Setup Tasks' },
    ],
    prefill: {
      title: 'Watch Party',
      description: "We're watching together — bring snacks and your reactions. The more the merrier.",
      hasPotluck: true,
      polls: ['Seating preference?'],
      tasks: ['Set up TV / projector', 'Arrange seating', 'Prepare snack table'],
    },
  },
  {
    id: 'hike',
    title: 'Group Hike',
    tag: 'Energetic',
    category: 'Energetic',
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80',
    description: 'Hit the trails together. Coordinate carpools, difficulty level, and post-hike food plans all in one place.',
    guestRange: '4–20 People',
    features: [
      { type: 'poll', label: 'Trail Vote' },
      { type: 'task', label: 'Carpool Tasks' },
    ],
    prefill: {
      title: 'Group Hike',
      description: "Let's hit the trails! Vote on the route, coordinate carpools, and plan the post-hike meal.",
      hasPotluck: false,
      polls: ['Which trail?', 'Difficulty: Easy, Medium, or Hard?'],
      tasks: ['Organize carpools', 'Pack first aid kit', 'Confirm meeting point'],
    },
  },
  {
    id: 'dinner-party',
    title: 'Dinner Party',
    tag: 'Social',
    category: 'Social',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
    description: 'Elevate the evening. A curated dinner experience where guests can contribute and feel part of the magic.',
    guestRange: '6–16 Guests',
    features: [
      { type: 'potluck', label: 'Course Signup' },
      { type: 'poll', label: 'Menu Poll' },
      { type: 'task', label: 'Prep Tasks' },
    ],
    prefill: {
      title: 'Dinner Party',
      description: "You're invited to an evening of great food and even better company. Sign up for a course and let's make something special.",
      hasPotluck: true,
      polls: ['Cuisine theme?', 'Dietary restrictions to accommodate?'],
      tasks: ['Set the table', 'Prepare appetizers', 'Chill the wine', 'Prepare dessert station'],
    },
  },
]

// ─── Category filter list ─────────────────────────────────────────────────────
const CATEGORIES = ['All Templates', 'Casual', 'Cozy', 'Social', 'Energetic', 'Productive']

// ─── Category tag colors ──────────────────────────────────────────────────────
const TAG_CLASSES: Record<string, string> = {
  Casual:     'bg-[#FFF8C5]  text-[#7a6520]  border-[#FFF8C5]',  // pastel yellow
  Cozy:       'bg-[#EAE4FF]  text-[#4a3a8a]  border-[#EAE4FF]',  // pastel lavender
  Social:     'bg-[#FFD6E7]  text-[#7a2d4a]  border-[#FFD6E7]',  // pastel pink
  Energetic:  'bg-[#C8E8FF]  text-[#1a4a6e]  border-[#C8E8FF]',  // pastel sky blue
  Productive: 'bg-[#C8F0DA]  text-[#1a4d32]  border-[#C8F0DA]',  // pastel mint
  Competitive:'bg-[#FFD6E7]  text-[#7a2d4a]  border-[#FFD6E7]',  // fallback pink
}
const FEATURE_META: Record<TemplateFeature['type'], { bg: string; text: string }> = {
  poll:    { bg: '#E8E4F5', text: '#4a4070' },  // dusty purple
  potluck: { bg: '#F5E8E4', text: '#6b3a2e' },  // dusty rose-brown
  task:    { bg: '#E4F0E8', text: '#2e5438' },  // dusty sage
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function TemplateCard({ template, onUse }: { template: Template; onUse: (t: Template) => void }) {
  return (
    <div
      className="bg-white rounded-2xl border-r border-b border-[#6C3483] border-l border-t border-l-[#e8e4ed] border-t-[#e8e4ed] overflow-hidden cursor-pointer flex flex-col group transition-all duration-200 shadow-[4px_4px_0px_#6C3483] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#6C3483]"
      onClick={() => onUse(template)}
    >
      {/* Photo — framed like a polaroid */}
      <div className="relative bg-white flex-shrink-0 p-3 pb-2">
        <div className="relative rounded-lg overflow-hidden">
          <img
            src={template.image}
            alt={template.title}
            className="w-full h-[155px] object-cover block"
          />
        </div>
        {/* Tag badge — top right over the padding area */}
        <span className={`absolute top-2 right-2 text-[0.68rem] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${TAG_CLASSES[template.tag] ?? 'bg-[#F9C8D9] text-[#7a2d4a] border-[#F9C8D9]'}`}>
          {template.tag}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 pb-4 pt-2 flex flex-col flex-1">
        <h3 className="font-sans font-bold text-text-heading text-base mb-1 leading-snug">
          {template.title}
        </h3>
        <p className="text-xs text-text-muted leading-relaxed mb-3 flex-1">
          {template.description}
        </p>

        {/* Feature chips */}
        {template.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {template.features.map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center text-[0.65rem] font-medium px-2 py-0.5 rounded"
                style={{ background: FEATURE_META[f.type].bg, color: FEATURE_META[f.type].text }}
              >
                {f.label}
              </span>
            ))}
          </div>
        )}

        {/* CTA button — offset shadow like landing page CTA */}
        <button
          className="w-full py-2 rounded-[10px] text-sm font-bold font-sans bg-[#e1bede] text-[#1a1a1a] transition-all duration-200 hover:-translate-x-px hover:-translate-y-px"
          style={{ boxShadow: '4px 4px 0px #462749' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '6px 6px 0px #462749' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '4px 4px 0px #462749' }}
        >
          Use Template
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BrowseTemplatesPage() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('All Templates')

  const filtered = activeCategory === 'All Templates'
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.category === activeCategory)

  const handleUse = (template: Template) => {
    navigate('/events/new', { state: { template: template.prefill } })
  }

  return (
    <div className="flex-1 pt-[var(--nav-height)] w-full min-h-screen">

      {/* ── Hero ── */}
      <div className="container text-center relative pt-4 pb-12">
        <span className="font-heading text-purple-deep text-lg block pt-5 mb-4 uppercase tracking-[0.2em]">
          Hand-Picked for Every Occasion
        </span>
        <h1 className="font-display uppercase text-text-heading mb-6 text-7xl leading-none tracking-wider">
          START WITH A <span className="text-[#6a3593]">VIBE</span>
        </h1>
        <p className="font-sans text-lg text-text-dark max-w-2xl mx-auto mb-10 leading-relaxed">
          Choose from our hand-picked event templates to get your gathering started in seconds. Customize everything to make it yours.
        </p>
      </div>

      {/* ── Body: sidebar + grid ── */}
      <div className="max-w-[1300px] mx-auto px-6 pb-20 flex gap-8 items-start">

        {/* ── Left sidebar ── */}
        <aside className="w-44 flex-shrink-0 sticky top-[calc(var(--nav-height)+24px)]">
          <p className="text-[0.7rem] font-bold uppercase tracking-widest text-text-muted mb-3 px-1">
            Filter Categories
          </p>
          <nav className="flex flex-col gap-0.5">
            {CATEGORIES.map((cat) => {
              const active = cat === activeCategory
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={[
                    'text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer border-none outline-none font-sans',
                    active
                      ? 'bg-purple-pale text-purple-deep'
                      : 'bg-transparent text-text hover:bg-purple-pale/50 hover:text-purple-deep',
                  ].join(' ')}
                >
                  {active && <span className="mr-1">•</span>}
                  {cat}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* ── Template grid ── */}
        <div className="flex-1 min-w-0">
          <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
            {filtered.map((t) => (
              <TemplateCard key={t.id} template={t} onUse={handleUse} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20 text-text-muted text-sm">
              No templates in this category yet.
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div className="container mb-20">
        <div className="max-w-3xl mx-auto">
          <div className="relative overflow-hidden rounded-[48px] py-14 px-10 text-center bg-purple-deep shadow-[0_8px_40px_rgba(108,52,131,0.35)]">
            {/* decorative star */}
            <img
              src={starSvg}
              alt=""
              aria-hidden="true"
              className="absolute -top-8 -left-8 w-36 h-36 opacity-[0.15] pointer-events-none select-none"
              style={{ filter: 'brightness(0) invert(1)' }}
            />

            <h2 className="relative z-10 text-white mb-5 font-display text-5xl uppercase leading-none tracking-wider">
              DON'T SEE WHAT YOU NEED?
            </h2>
            <p className="relative z-10 mb-8 max-w-[50%] mx-auto leading-relaxed font-sans text-base text-purple-pale">
              Build a custom event from scratch and save it as your own template for future gatherings.
            </p>
            <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                className="btn bg-white text-purple-deep font-heading rounded-[2rem] px-10 py-3 text-base tracking-wide hover:scale-105 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-200"
                onClick={() => navigate('/events/new')}
              >
                Build Your Own
              </button>
              <button
                className="btn bg-transparent border-2 border-white text-white font-heading rounded-[2rem] px-10 py-3 text-base tracking-wide hover:scale-105 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:bg-white/10 transition-all duration-200"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Back to Top
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
