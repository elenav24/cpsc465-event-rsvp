import { useState } from 'react'
import { Link } from 'react-router-dom'

interface Step {
  number: string
  title: string
  description: string
  icon: string
  cardBgClass: string
  rotateClass: string
  reverse: boolean
  CardVisual: () => React.JSX.Element
}

interface Feature {
  icon: string
  title: string
  desc: string
}

// Data

const POLL_BARS = [
  { label: 'Sat, 14th', widthClass: 'w-4/5', faded: false },
  { label: 'Fri, 13th', widthClass: 'w-1/4', faded: true },
]

const DIETARY_TAGS = ['3 Vegan', '1 Nut Allergy']
const AVATAR_COLORS = ['bg-zinc-300', 'bg-zinc-400', 'bg-zinc-500']

const FEATURES: Feature[] = [
  {
    icon: 'notifications_off',
    title: 'Quiet Coordination',
    desc: 'We eliminate notification fatigue with smart summaries and silent RSVP tracking.',
  },
  {
    icon: 'group',
    title: 'Community First',
    desc: 'Our tools are built to encourage collaboration, making every guest feel like a co-host.',
  },
  {
    icon: 'favorite',
    title: 'Memories Included',
    desc: 'Every event generates a beautiful digital archive of your shared moments automatically.',
  },
]

// Step card visuals

function TemplateCardVisual() {
  return (
    <div className="w-full aspect-video bg-gradient-to-br from-pink-pale to-purple-pale rounded-xl flex items-center justify-center">
      <span className="material-symbols-outlined text-pink opacity-40 text-[clamp(24px,6vw,64px)]">
        auto_fix_high
      </span>
    </div>
  )
}

function InviteCardVisual() {
  return (
    <div className="w-full aspect-video bg-gradient-to-br from-pink-light/60 to-pink-pale rounded-xl flex items-center justify-center">
      <span className="material-symbols-outlined text-pink opacity-40 text-[clamp(24px,6vw,64px)]">
        send
      </span>
    </div>
  )
}

function PollCardVisual() {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white p-4 rounded-xl border border-pink/20 shadow-sm">
        <p className="text-[10px] font-bold text-pink mb-2 uppercase tracking-widest">
          Preferred Date?
        </p>
        {POLL_BARS.map(({ label, widthClass, faded }) => (
          <div key={label} className="flex items-center gap-3 mb-2 last:mb-0">
            <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div className={`h-full ${widthClass} rounded-full ${faded ? 'bg-pink/40' : 'bg-pink'}`} />
            </div>
            <span className="text-[10px] font-bold text-text-heading">{label}</span>
          </div>
        ))}
      </div>
      <div className="bg-white p-4 rounded-xl border border-pink/20 shadow-sm">
        <p className="text-[10px] font-bold text-pink mb-2 uppercase tracking-widest">
          Dietary Needs
        </p>
        <div className="flex gap-2 flex-wrap">
          {DIETARY_TAGS.map((tag) => (
            <span key={tag} className="px-2.5 py-1 bg-zinc-100 rounded-full text-[10px] font-medium text-text">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function LoungeCardVisual() {
  return (
    <div className="w-full aspect-square bg-gradient-to-br from-purple-pale to-purple-light rounded-xl flex items-center justify-center relative">
      <span className="material-symbols-outlined text-purple-btn opacity-30 text-[clamp(32px,8vw,80px)]">
        nightlife
      </span>
      <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-pink/10 shadow-2xl">
        <p className="text-xs font-bold text-pink italic">Live Event Gallery</p>
        <div className="flex mt-2">
          {AVATAR_COLORS.map((cls, i) => (
            <div key={i} className={`w-5 h-5 rounded-full ${cls} border-2 border-white -mr-1.5`} />
          ))}
          <div className="w-5 h-5 rounded-full bg-pink border-2 border-white flex items-center justify-center text-[7px] font-bold text-white">
            +12
          </div>
        </div>
      </div>
    </div>
  )
}

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Spark Inspiration',
    description: 'Choose from designer templates that set the mood. Skip the blank-page anxiety and start with a vibe that matches your community.',
    icon: 'auto_fix_high',
    cardBgClass: 'bg-surface',
    rotateClass: 'rotate-1',
    reverse: false,
    CardVisual: TemplateCardVisual,
  },
  {
    number: '02',
    title: 'Gather Your People',
    description: 'Simple links, no app required. We handle the RSVPs and "Who\'s coming?" questions automatically so you can focus on the guest list.',
    icon: 'send',
    cardBgClass: 'bg-pink-pale',
    rotateClass: '-rotate-1',
    reverse: true,
    CardVisual: InviteCardVisual,
  },
  {
    number: '03',
    title: 'Social Decisions',
    description: 'Empower your group with interactive polls. Vote on dates, themes, or the menu without the 40-person group text chaos.',
    icon: 'poll',
    cardBgClass: 'bg-pink-bg',
    rotateClass: 'rotate-0',
    reverse: false,
    CardVisual: PollCardVisual,
  },
  {
    number: '04',
    title: 'The Lounge Experience',
    description: 'Once the party starts, your event page transforms into a live "Lounge" for photo sharing and group memories. Stress-free hosting from start to finish.',
    icon: 'nightlife',
    cardBgClass: 'bg-purple-pale',
    rotateClass: 'rotate-1',
    reverse: true,
    CardVisual: LoungeCardVisual,
  },
]

// ─── Components ───────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="container text-center relative pt-4 pb-20">
      <div className="relative z-10">
        <span className="font-heading text-pink text-lg block pt-5 mb-4 uppercase tracking-[0.2em]">
          The Path to Stress-Free Hosting
        </span>
        <h1
          className="font-display uppercase text-text-heading mb-6 text-7xl leading-none tracking-wider"
        >
          Host with <span className="text-pink italic">Soul</span>
        </h1>
        <p className="font-sans text-lg text-text max-w-2xl mx-auto mb-10 leading-relaxed">
          We've redesigned the planning process to keep the focus where it belongs:
          on the social connection, not the spreadsheet stress.
        </p>
      </div>
    </section>
  )
}

function StepCard({ step, hovered, onEnter, onLeave }: {
  step: Step
  hovered: boolean
  onEnter: () => void
  onLeave: () => void
}) {
  const textContent = (
    <div className={step.reverse ? 'text-left' : 'text-right'}>
      <h2 className="font-display text-[clamp(1.2rem,2.5vw,1.875rem)] uppercase text-pink mb-2 tracking-wider leading-tight">
        {step.number}. {step.title}
      </h2>
      <p className="font-sans text-[clamp(0.75rem,1.2vw,0.95rem)] text-text leading-relaxed">
        {step.description}
      </p>
    </div>
  )

  const cardContent = (
    <div className={[
      step.cardBgClass,
      'rounded-[16px] md:rounded-[24px] p-3 md:p-5 overflow-hidden',
      'border border-border',
      'transition-transform duration-300',
      hovered ? 'rotate-0' : step.rotateClass,
    ].join(' ')}>
      <step.CardVisual />
    </div>
  )

  return (
    <div
      className="grid items-center w-full"
      style={{ gridTemplateColumns: '1fr 80px 1fr' }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/* Left column — min-w-0 allows it to shrink below content size */}
      <div className="min-w-0 pr-4 md:pr-8">
        {step.reverse ? cardContent : textContent}
      </div>

      {/* Center column — circle sits on top of the line */}
      <div className="flex items-center justify-center flex-shrink-0 relative z-10">
        <div className={[
          'w-14 h-14 rounded-full bg-pink text-white',
          'flex items-center justify-center flex-shrink-0',
          'shadow-[var(--shadow-accent)] transition-transform duration-300',
          hovered ? 'scale-110' : 'scale-100',
        ].join(' ')}>
          <span className="material-symbols-outlined text-[22px]">{step.icon}</span>
        </div>
      </div>

      {/* Right column — min-w-0 allows it to shrink below content size */}
      <div className="min-w-0 pl-4 md:pl-8">
        {step.reverse ? textContent : cardContent}
      </div>
    </div>
  )
}

function StepsSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <section className="mx-auto w-[60%] max-w-5xl">
      {/* Desktop */}
      <div className="hidden md:block relative">
        {/* Line centered on the 80px middle column.
            Grid is 1fr 80px 1fr so the center of col 2 = exactly 50% of the container. */}
        <div
          className="absolute top-0 bottom-0 w-[3px] bg-pink-pale pointer-events-none"
          style={{ left: 'calc(50% - 1.5px)' }}
        />
        <div className="flex flex-col gap-16 relative">
          {STEPS.map((step, i) => (
            <StepCard
              key={step.number}
              step={step}
              hovered={hoveredIndex === i}
              onEnter={() => setHoveredIndex(i)}
              onLeave={() => setHoveredIndex(null)}
            />
          ))}
        </div>
      </div>

      {/* Mobile — 90% width */}
      <div className="md:hidden w-[90%] mx-auto flex flex-col gap-14">
        {STEPS.map((step, i) => (
          <div
            key={step.number}
            className="flex flex-col gap-5"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-pink text-white flex items-center justify-center shadow-[var(--shadow-accent)] flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">{step.icon}</span>
              </div>
              <h2 className="font-display text-2xl uppercase text-pink tracking-wider leading-tight">
                {step.number}. {step.title}
              </h2>
            </div>
            <p className="font-sans text-[1rem] text-text leading-relaxed">
              {step.description}
            </p>
            <div className={[
              step.cardBgClass,
              'rounded-[24px] p-5 overflow-hidden border border-border',
            ].join(' ')}>
              <step.CardVisual />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function FeatureItem({ icon, title, desc }: Feature) {
  return (
    <div className="flex items-start gap-5">
      <span className="material-symbols-outlined text-white bg-pink p-3 rounded-2xl flex-shrink-0 shadow-[var(--shadow-accent)]">
        {icon}
      </span>
      <div>
        <h4 className="font-sans font-bold text-xl text-text-heading mb-1">{title}</h4>
        <p className="font-sans text-text leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function FeaturesSection() {
  return (
    <section className="bg-pink-pale mt-32 py-24">
      <div className="container flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1 min-w-[300px]">
          <div className="w-full aspect-[4/3] bg-gradient-to-br from-pink-light/60 to-purple-pale rounded-[40px] border border-border flex items-center justify-center shadow-[var(--shadow-lg)]">
            <span className="material-symbols-outlined text-pink opacity-30" style={{ fontSize: 120 }}>
              celebration
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-[300px]">
          <h2
            className="font-display uppercase text-accent-dark mb-8 leading-[0.95] tracking-wider"
            style={{ fontSize: 'clamp(3rem, 5vw, 4rem)' }}
          >
            Less <span className="italic text-pink">Noise</span>,<br />
            More <span className="text-pink">Joy</span>
          </h2>
          <div className="flex flex-col gap-8">
            {FEATURES.map((feature) => (
              <FeatureItem key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="container mt-32 text-center">
      <div className="bg-pink text-white rounded-[48px] py-24 px-10 relative overflow-hidden shadow-[var(--shadow-lg)]">
        <span
          className="material-symbols-outlined absolute -top-10 -left-10 text-white/[0.08] pointer-events-none select-none"
          style={{ fontSize: 240 }}
        >
          star_rate
        </span>
        <h2
          className="font-display uppercase relative z-10 leading-none tracking-wider mb-8"
          style={{ fontSize: 'clamp(3.5rem, 8vw, 6rem)' }}
        >
          Start Your <span className="italic">Story</span>
        </h2>
        <p className="font-sans text-2xl mb-12 max-w-2xl mx-auto text-pink-pale relative z-10 leading-relaxed">
          Join thousands of hosts who have traded planning anxiety for party anticipation.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
          <Link
            to="/signup"
            className="btn btn-lg bg-white text-pink font-heading rounded-full hover:scale-105 transition-transform px-12 text-2xl"
          >
            Create My Event
          </Link>
          <button className="btn btn-lg bg-transparent border-2 border-white text-white font-heading rounded-full hover:bg-white/10 transition-colors px-12 text-2xl">
            See Live Demo
          </button>
        </div>
      </div>
    </section>
  )
}

export default function HowItWorks() {
  return (
    <main className="page-main overflow-hidden pb-20">
      <HeroSection />
      <StepsSection />
      <FeaturesSection />
      <CTASection />
    </main>
  )
}
