import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaWandMagicSparkles } from "react-icons/fa6"
import starSvg from '../assets/star.svg'
import { HiUserGroup } from "react-icons/hi";
import { FaClipboardList } from "react-icons/fa";
import { BiParty } from "react-icons/bi";


interface Step {
    number: string
    title: string
    description: string
    icon: string | React.ReactElement
    cardBgClass: string
    rotateClass: string
    reverse: boolean
    CardVisual: () => React.JSX.Element
}

// Data

// Step card visuals — all use the same photo-frame pattern.
// To add a real photo later, replace the inner div with:
//   <img src={yourPhoto} alt="..." className="w-full h-full object-cover" />

function TemplateCardVisual() {
    return (
        <div className="w-full aspect-video bg-gradient-to-br from-pink-pale to-purple-pale rounded-xl flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-pink opacity-30 text-[clamp(24px,6vw,64px)]">
                auto_fix_high
            </span>
        </div>
    )
}

function InviteCardVisual() {
    return (
        <div className="w-full aspect-video bg-gradient-to-br from-pink-pale to-pink-pale rounded-xl flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-pink opacity-30 text-[clamp(24px,6vw,64px)]">
                send
            </span>
        </div>
    )
}

function PollCardVisual() {
    return (
        <div className="w-full aspect-video bg-gradient-to-br from-pink-pale to-pink-pale rounded-xl flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-pink opacity-30 text-[clamp(24px,6vw,64px)]">
                poll
            </span>
        </div>
    )
}

function LoungeCardVisual() {
    return (
        <div className="w-full aspect-video bg-gradient-to-br from-pink-pale to-purple-light rounded-xl flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-purple-btn opacity-30 text-[clamp(24px,6vw,64px)]">
                nightlife
            </span>
        </div>
    )
}

const STEPS: Step[] = [
    {
        number: '1',
        title: 'Set the Vibe',
        description: "Start with a designer-curated template that sets the mood, or build your vision from scratch. Whether it's an intimate dinner or a rooftop bash, we give you the perfect foundation to spark inspiration.",
        icon: <FaWandMagicSparkles/>,
        cardBgClass: 'bg-surface',
        rotateClass: 'rotate-1',
        reverse: false,
        CardVisual: TemplateCardVisual,
    },
    {
        number: '2',
        title: 'Gather Your People',
        description: 'Share one link and let the magic happen. Manage RSVPs and guest preferences in a single, beautiful dashboard.',
        icon: <HiUserGroup/>,
        cardBgClass: 'bg-pink-pale',
        rotateClass: '-rotate-1',
        reverse: true,
        CardVisual: InviteCardVisual,
    },
    {
        number: '3',
        title: 'Decide Together',
        description: "Keep everyone in the loop with interactive polls, potluck signups, and assigned tasks. Whether you're picking a date or coordinating who brings the drinks, everyone stays aligned in one collaborative space.",
        icon: <FaClipboardList/>,
        cardBgClass: 'bg-pink-bg',
        rotateClass: 'rotate-1',
        reverse: false,
        CardVisual: PollCardVisual,
    },
    {
        number: '4',
        title: 'Enjoy the Moment',
        description: "With the details handled and the guest list synced, you're free to actually enjoy your own party. We take care of the admin so you can focus on the people.",
        icon: <BiParty/>,
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
                    How It <span className="text-pink-dark">Works</span>
                </h1>
                <p className="font-sans text-lg text-text-dark max-w-2xl mx-auto mb-10 leading-relaxed max-w-130">
                    Skip the group chat chaos. Cohosted makes organizing events effortless and collaborative in four simple moves.
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
            <h2 className="font-display text-accent-dark lg:text-4xl sm:text-2xl uppercase mb-2 tracking-wider leading-tight">
                {step.number}. {step.title}
            </h2>
            <p className="font-sans text-[clamp(0.75rem,1.2vw,0.95rem)] text-text-dark leading-relaxed">
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
                    'w-14 h-14 rounded-full bg-accent-dark text-white',
                    'flex items-center justify-center flex-shrink-0',
                    'shadow-[var(--shadow-accent)] transition-transform duration-300',
                    hovered ? 'scale-110' : 'scale-100',
                ].join(' ')}>
                    {typeof step.icon === 'string'
                        ? <span className="material-symbols-outlined text-[22px]">{step.icon}</span>
                        : <span className="text-[22px] flex items-center justify-center">{step.icon}</span>
                    }
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
                                {typeof step.icon === 'string'
                                    ? <span className="material-symbols-outlined text-[20px]">{step.icon}</span>
                                    : <span className="text-[20px] flex items-center justify-center">{step.icon}</span>
                                }
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

function CTASection() {
    return (
        <section className="container mt-20 text-center">
            <div className="bg-pink-dark text-white rounded-[48px] py-24 px-10 relative overflow-hidden shadow-[var(--shadow-lg)]">
                <img
                    src={starSvg}
                    alt=""
                    aria-hidden="true"
                    className="absolute -top-8 -left-8 w-48 h-48 opacity-[0.15] pointer-events-none select-none"
                    style={{ filter: 'brightness(0) invert(1)' }}
                />
                <h2
                    className="font-display text-7xl uppercase relative z-10 leading-none tracking-wider mb-8"
                >
                    Ready to Cohost?
                </h2>
                <p className="font-sans text-xl mb-12 max-w-[50%] mx-auto text-pink-pale relative z-10 leading-relaxed">
                    Join thousands of hosts who have traded planning anxiety for party anticipation.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
                    <Link
                        to="/signup"
                        className="btn bg-white text-pink-dark font-heading rounded-[2rem] px-16 py-4 text-xl tracking-wide hover:scale-105 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-200"
                    >
                        Create My Event
                    </Link>
                    <button className="btn bg-transparent border-2 border-white text-white font-heading rounded-[2rem] px-16 py-4 text-xl tracking-wide hover:scale-105 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:bg-white/10 transition-all duration-200">
                        Browse Templates
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
            <CTASection />
        </main>
    )
}
