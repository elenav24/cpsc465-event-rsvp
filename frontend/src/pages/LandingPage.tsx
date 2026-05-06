import { Link } from 'react-router-dom'

const partyImg = '/party.webp'

// Filled pink star (Container10 in Figma)
const P_STAR_PINK = "M12.8775 6.20651C15.1577 2.06884 16.298 0 18.0026 0C19.7072 0 20.8473 2.06884 23.1274 6.20651L23.7175 7.27698C24.3654 8.45278 24.6894 9.04068 25.1946 9.42858C25.6998 9.81647 26.329 9.96047 27.5874 10.2485L28.7328 10.5106C33.1609 11.524 35.375 12.0307 35.9016 13.7441C36.4284 15.4574 34.9191 17.2429 31.9003 20.8133L31.1192 21.7373C30.2614 22.7518 29.8325 23.2591 29.6397 23.8868C29.4466 24.5144 29.5114 25.1914 29.6412 26.545L29.7591 27.7776C30.2157 32.5416 30.444 34.9237 29.0647 35.9826C27.6857 37.0415 25.6127 36.0759 21.4668 34.145L20.3942 33.6456C19.216 33.0969 18.6271 32.8226 18.0026 32.8226C17.3781 32.8226 16.789 33.0969 15.611 33.6456L14.5382 34.145C10.3922 36.0759 8.31928 37.0415 6.94025 35.9826C5.56119 34.9237 5.7894 32.5416 6.24578 27.7776L6.36386 26.545C6.49356 25.1914 6.55839 24.5144 6.36545 23.8868C6.17249 23.2591 5.74357 22.7518 4.88574 21.7373L4.10476 20.8133C1.08602 17.2429 -0.423365 15.4574 0.103366 13.7441C0.63012 12.0307 2.84414 11.524 7.2722 10.5106L8.41778 10.2485C9.67598 9.96047 10.3051 9.81647 10.8104 9.42858C11.3156 9.04068 11.6396 8.45278 12.2874 7.27698L12.8775 6.20651Z"

// 4-pointed twinkle star — animation uses custom keyframe from global.css
function TwinkleStar({ size = 28, color = '#FCCEE8', delay = '0s', duration = '2.8s' }: {
    size?: number; color?: string; delay?: string; duration?: string
}) {
    const h = size / 2
    const arm = size * 0.48
    const nub = size * 0.14
    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            fill="none"
            style={{ animation: `star-twinkle-real ${duration} ease-in-out infinite ${delay}` }}
        >
            <line x1={h} y1={h - arm} x2={h} y2={h + arm} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            <line x1={h - arm} y1={h} x2={h + arm} y2={h} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            <line x1={h - nub} y1={h - nub} x2={h + nub} y2={h + nub} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <line x1={h + nub} y1={h - nub} x2={h - nub} y2={h + nub} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}

function StarPink() {
    return (
        <svg width="36" height="37" viewBox="0 0 36.005 36.4192" fill="none">
            <path d={P_STAR_PINK} fill="#FCCEE8" />
        </svg>
    )
}

export default function LandingPage() {
    return (
        <div
            className="relative w-full flex-1 flex flex-col overflow-hidden"
            style={{ background: 'linear-gradient(134.032deg, #FFECE0 6.214%, #FFFFFF 49.723%, #EFECFF 93.233%)' }}
        >
            {/* ── Background blobs ── */}
            <div
                className="absolute rounded-full pointer-events-none w-[525px] h-[525px] left-[89px] top-[62px] blur-[67px] animate-pulse-glow animate-drift"
                style={{ background: 'linear-gradient(135deg, rgba(252,206,232,0.4) 0%, rgba(233,212,255,0.4) 100%)' }}
            />
            <div
                className="absolute rounded-full pointer-events-none w-[400px] h-[400px] -right-[50px] bottom-[200px] blur-[64px] animate-pulse-glow-2"
                style={{ background: 'linear-gradient(135deg, rgba(233,212,255,0.3) 0%, rgba(252,206,232,0.3) 100%)' }}
            />
            <div
                className="absolute rounded-full pointer-events-none w-[300px] h-[300px] left-[583px] top-[397px] blur-[40px] animate-drift-2"
                style={{ background: 'linear-gradient(135deg, rgba(253,165,213,0.2) 0%, rgba(218,178,255,0.2) 100%)' }}
            />
            <div
                className="absolute rounded-full pointer-events-none w-[204px] h-[204px] left-[943px] top-[206px] blur-[41px] opacity-[0.34] animate-pulse-glow-3 animate-drift-3"
                style={{ background: 'linear-gradient(135deg, rgba(255,240,133,0.2) 0%, rgba(252,206,232,0.2) 100%)' }}
            />

            {/* ── Filled pink spinning star ── */}
            <div
                className="absolute pointer-events-none animate-star-twinkle left-[180px] top-[130px] opacity-[0.34]"
                style={{ transform: 'rotate(-150.86deg) scaleY(-1)' }}
            >
                <StarPink />
            </div>

            {/* ── Twinkle stars ── */}
            <div className="absolute pointer-events-none left-[13%] top-[11%]">
                <TwinkleStar size={22} color="#FCCEE8" delay="0s" duration="2.6s" />
            </div>
            <div className="absolute pointer-events-none left-[62%] top-[58%]">
                <TwinkleStar size={32} color="#FCCEE8" delay="0.7s" duration="3.1s" />
            </div>
            <div className="absolute pointer-events-none left-[8%] top-[68%]">
                <TwinkleStar size={16} color="#FCCEE8" delay="1.4s" duration="2.4s" />
            </div>
            <div className="absolute pointer-events-none left-[78%] top-[14%]">
                <TwinkleStar size={36} color="#EAD4FF" delay="0.4s" duration="3.4s" />
            </div>
            <div className="absolute pointer-events-none left-[88%] top-[52%]">
                <TwinkleStar size={20} color="#EAD4FF" delay="1.8s" duration="2.9s" />
            </div>
            <div className="absolute pointer-events-none left-[52%] top-[22%]">
                <TwinkleStar size={14} color="#EAD4FF" delay="2.2s" duration="2.2s" />
            </div>
            <div className="absolute pointer-events-none left-[35%] top-[72%]">
                <TwinkleStar size={18} color="#FCCEE8" delay="0.9s" duration="2.7s" />
            </div>
            <div className="absolute pointer-events-none left-[71%] top-[38%]">
                <TwinkleStar size={12} color="#EAD4FF" delay="1.6s" duration="2.3s" />
            </div>
            <div className="absolute pointer-events-none left-[44%] top-[85%]">
                <TwinkleStar size={24} color="#EAD4FF" delay="3.0s" duration="3.2s" />
            </div>
            <div className="absolute pointer-events-none left-[92%] top-[28%]">
                <TwinkleStar size={14} color="#FCCEE8" delay="0.3s" duration="2.5s" />
            </div>
            <div className="absolute pointer-events-none left-[22%] top-[45%]">
                <TwinkleStar size={10} color="#FCCEE8" delay="2.6s" duration="2.0s" />
            </div>
            <div className="absolute pointer-events-none left-[57%] top-[78%]">
                <TwinkleStar size={28} color="#EAD4FF" delay="1.1s" duration="3.5s" />
            </div>

            {/* ── Hero content ── */}
            <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center md:justify-between w-full pt-32 pb-16 px-[10%] md:pt-0 md:pb-0 md:pl-16 lg:pl-24 xl:pl-40 md:pr-0">

                {/* ── Left half: text ── */}
                <div className="flex flex-col justify-center items-center md:items-start gap-8 w-full md:w-1/2 text-center md:text-left">
                    {/* Title */}
                    <div
                        className="text-black leading-[1.03]"
                        style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(3.5rem, 5.56vw, 80px)' }}
                    >
                        <span>Events are </span>
                        <span className="text-gradient-better">better </span>
                        <span>when everyone plays a part</span>
                    </div>

                    {/* Subtitle */}
                    <p
                        className="text-black leading-relaxed w-full md:max-w-[80%]"
                        style={{ fontFamily: "'Albert Sans', sans-serif", fontSize: 'clamp(1.15rem, 1.39vw, 20px)' }}
                    >
                        The RSVP tool built for potlucks, watch parties, and group hangs.{' '}
                        <strong className="font-bold">Start hosting <em className="italic">with</em> your friends,</strong>{' '}
                        not just <em className="italic">for</em> them.
                    </p>

                    {/* CTA Button */}
                    <Link
                        to="/signup"
                        className="inline-flex items-center justify-center rounded-[10px] no-underline cursor-pointer transition-all duration-200 hover:-translate-x-px hover:-translate-y-px w-full md:w-auto"
                        style={{
                            background: '#e1bede',
                            fontFamily: "'Cantora One', cursive",
                            fontSize: 'clamp(1.2rem, 2.22vw, 32px)',
                            boxShadow: '4px 4px 0px #462749',
                            textDecoration: 'none',
                            maxWidth: '400px',
                            height: 'clamp(64px, 6vw, 71px)',
                            color: '#000',
                            padding: '0 2rem',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '6px 6px 0px #462749' }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '4px 4px 0px #462749' }}
                    >
                        Create Your First Event
                    </Link>
                </div>

                {/* ── Right half: photo card centered ── */}
                <div className="w-full md:w-1/2 flex items-center justify-center pt-14 pb-8 md:py-0">

                    {/* Mobile: no tilt */}
                    <div className="relative md:hidden" style={{ width: '65%', aspectRatio: '4 / 5' }}>
                        <div className="absolute inset-0 rounded-[18px]" style={{ boxShadow: '6px 8px 0px #c084b8' }} />
                        <img
                            src={partyImg}
                            alt="Party"
                            className="relative z-10 w-full h-full object-cover rounded-[14px] block border-[5px] border-[#f0a8d8]"
                            style={{ outline: '2px dashed rgba(255,255,255,0.6)', outlineOffset: '-10px' }}
                        />
                    </div>

                    {/* Desktop: tilted with hover */}
                    <div
                        className="relative hidden md:block cursor-default top-4 right-15"
                        style={{
                            width: 'clamp(230px, 23vw, 340px)',
                            aspectRatio: '4 / 5',
                            transform: 'rotate(2.5deg)',
                            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLDivElement).style.transform = 'rotate(0deg) scale(1.04) translateY(-6px)'
                            const shadow = e.currentTarget.querySelector('.card-shadow') as HTMLDivElement
                            if (shadow) shadow.style.boxShadow = '12px 16px 0px #c084b8'
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLDivElement).style.transform = 'rotate(2.5deg)'
                            const shadow = e.currentTarget.querySelector('.card-shadow') as HTMLDivElement
                            if (shadow) shadow.style.boxShadow = '8px 10px 0px #c084b8'
                        }}
                    >
                        <div
                            className="card-shadow absolute inset-0 rounded-[18px] z-0"
                            style={{ boxShadow: '8px 10px 0px #c084b8', transition: 'box-shadow 0.3s ease' }}
                        />
                        <img
                            src={partyImg}
                            alt="Party"
                            className="relative z-10 w-full h-full object-cover rounded-[14px] block border-[5px] border-[#f0a8d8]"
                            style={{ outline: '2px dashed rgba(255,255,255,0.6)', outlineOffset: '-10px' }}
                        />
                    </div>
                </div>

            </div>
        </div>
    )
}
