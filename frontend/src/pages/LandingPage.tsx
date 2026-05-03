import { Link } from 'react-router-dom'

// ── Figma SVG paths ──────────────────────────────────────────
// 4-pointed sparkle star (large)
const P_SPARKLE_PINK_LG   = "M29.5884 40.5885L26.694 50.7186L23.7996 40.5885C22.2795 35.2677 18.1203 31.1085 12.7996 29.5884L2.6694 26.694L12.7996 23.7996C18.1204 22.2795 22.2795 18.1203 23.7996 12.7996L26.694 2.6694L29.5884 12.7996C31.1085 18.1204 35.2677 22.2795 40.5885 23.7996L50.7186 26.694L40.5885 29.5884C35.2677 31.1085 31.1085 35.2677 29.5884 40.5885Z"
const P_SPARKLE_PINK_SM   = "M7.94196 11.9481L7.51964 13.6373L7.09732 11.9481C6.60413 9.97538 5.0639 8.43515 3.09126 7.94196L1.40197 7.51964L3.09126 7.09732C5.0639 6.60413 6.60413 5.0639 7.09732 3.0912L7.51964 1.40197L7.94196 3.0912C8.43515 5.0639 9.97538 6.60413 11.948 7.09732L13.6373 7.51964L11.948 7.94196C9.97538 8.43515 8.43515 9.97538 7.94196 11.9481Z"
const P_SPARKLE_PURPLE_LG = "M30.7523 42.185L27.744 52.7137L24.7358 42.185C23.1559 36.655 18.8331 32.3322 13.303 30.7523L2.7744 27.744L13.303 24.7358C18.8332 23.1559 23.1559 18.8331 24.7358 13.303L27.744 2.7744L30.7523 13.303C32.3322 18.8332 36.655 23.1559 42.185 24.7358L52.7137 27.744L42.185 30.7523C36.655 32.3322 32.3322 36.655 30.7523 42.185Z"
const P_SPARKLE_PURPLE_SM = "M8.25437 12.4181L7.81543 14.1737L7.37649 12.4181C6.86391 10.3678 5.2631 8.76695 3.21286 8.25437L1.45711 7.81543L3.21286 7.37649C5.2631 6.86391 6.86391 5.2631 7.37649 3.21279L7.81543 1.45711L8.25437 3.21279C8.76695 5.2631 10.3678 6.86391 12.418 7.37649L14.1737 7.81543L12.418 8.25437C10.3678 8.76695 8.76695 10.3678 8.25437 12.4181Z"
// Filled pink star (Container10 in Figma)
const P_STAR_PINK = "M12.8775 6.20651C15.1577 2.06884 16.298 0 18.0026 0C19.7072 0 20.8473 2.06884 23.1274 6.20651L23.7175 7.27698C24.3654 8.45278 24.6894 9.04068 25.1946 9.42858C25.6998 9.81647 26.329 9.96047 27.5874 10.2485L28.7328 10.5106C33.1609 11.524 35.375 12.0307 35.9016 13.7441C36.4284 15.4574 34.9191 17.2429 31.9003 20.8133L31.1192 21.7373C30.2614 22.7518 29.8325 23.2591 29.6397 23.8868C29.4466 24.5144 29.5114 25.1914 29.6412 26.545L29.7591 27.7776C30.2157 32.5416 30.444 34.9237 29.0647 35.9826C27.6857 37.0415 25.6127 36.0759 21.4668 34.145L20.3942 33.6456C19.216 33.0969 18.6271 32.8226 18.0026 32.8226C17.3781 32.8226 16.789 33.0969 15.611 33.6456L14.5382 34.145C10.3922 36.0759 8.31928 37.0415 6.94025 35.9826C5.56119 34.9237 5.7894 32.5416 6.24578 27.7776L6.36386 26.545C6.49356 25.1914 6.55839 24.5144 6.36545 23.8868C6.17249 23.2591 5.74357 22.7518 4.88574 21.7373L4.10476 20.8133C1.08602 17.2429 -0.423365 15.4574 0.103366 13.7441C0.63012 12.0307 2.84414 11.524 7.2722 10.5106L8.41778 10.2485C9.67598 9.96047 10.3051 9.81647 10.8104 9.42858C11.3156 9.04068 11.6396 8.45278 12.2874 7.27698L12.8775 6.20651Z"

// Pink sparkle cluster — large star + two small stars positioned within a single viewBox
// viewBox is sized to contain all three shapes without clipping
function SparkleClusterPink() {
  return (
    <svg width="80" height="80" viewBox="-5 -5 70 70" fill="none">
      {/* large 4-pointed star, centered ~27,27 */}
      <path d={P_SPARKLE_PINK_LG} stroke="#FCCEE8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5.3388" />
      {/* small star top-left */}
      <path d={P_SPARKLE_PINK_SM} stroke="#FCCEE8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8"
        transform="translate(-3, -3) scale(0.9)" />
      {/* small star bottom-right */}
      <path d={P_SPARKLE_PINK_SM} stroke="#FCCEE8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8"
        transform="translate(48, 44) scale(0.85)" />
    </svg>
  )
}

// Purple sparkle cluster
function SparkleClusterPurple() {
  return (
    <svg width="85" height="85" viewBox="-5 -5 72 72" fill="none">
      <path d={P_SPARKLE_PURPLE_LG} stroke="#EAD4FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5.55" />
      <path d={P_SPARKLE_PURPLE_SM} stroke="#EAD4FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.9"
        transform="translate(-3, -3) scale(0.9)" />
      <path d={P_SPARKLE_PURPLE_SM} stroke="#EAD4FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.9"
        transform="translate(50, 46) scale(0.85)" />
    </svg>
  )
}

// Filled pink star (the spinning one from Figma — Container10)
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
      className="relative w-full min-h-screen flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(134.032deg, #FFECE0 6.214%, #FFFFFF 49.723%, #EFECFF 93.233%)' }}
    >
      {/* ── Background blobs ── */}
      <div className="absolute rounded-full pointer-events-none w-[525px] h-[525px] left-[89px] top-[62px] blur-[67px] animate-pulse-glow animate-drift"
        style={{ background: 'linear-gradient(135deg, rgba(252,206,232,0.4) 0%, rgba(233,212,255,0.4) 100%)' }} />
      <div className="absolute rounded-full pointer-events-none w-[400px] h-[400px] -right-[50px] bottom-[200px] blur-[64px] animate-pulse-glow-2"
        style={{ background: 'linear-gradient(135deg, rgba(233,212,255,0.3) 0%, rgba(252,206,232,0.3) 100%)' }} />
      <div className="absolute rounded-full pointer-events-none w-[300px] h-[300px] left-[583px] top-[397px] blur-[40px] animate-drift-2"
        style={{ background: 'linear-gradient(135deg, rgba(253,165,213,0.2) 0%, rgba(218,178,255,0.2) 100%)' }} />
      <div className="absolute rounded-full pointer-events-none w-[204px] h-[204px] left-[943px] top-[206px] blur-[41px] opacity-[0.34] animate-pulse-glow-3 animate-drift-3"
        style={{ background: 'linear-gradient(135deg, rgba(255,240,133,0.2) 0%, rgba(252,206,232,0.2) 100%)' }} />

      {/* ── Filled pink spinning star (Figma Container10) ── */}
      {/* Figma: left-[140.53px] top-[70.5px] opacity-34, rotated -150.86deg, scale-y-100 */}
      <div className="absolute pointer-events-none animate-star-twinkle"
        style={{ left: 180, top: 140, opacity: 0.34, transform: 'rotate(-150.86deg) scaleY(-1)' }}>
        <StarPink />
      </div>

      {/* ── Sparkle clusters ── */}
      {/* Pink — Figma: left-[901px] top-[660px] */}
      <div className="absolute pointer-events-none animate-sparkle-pink" style={{ left: '62vw', top: '62vh' }}>
        <SparkleClusterPink />
      </div>
      {/* Purple — Figma: left-[1126px] top-[150px] */}
      <div className="absolute pointer-events-none animate-sparkle-purple" style={{ left: '78vw', top: 150 }}>
        <SparkleClusterPurple />
      </div>

      {/* ── Hero content ── */}
      <div
        className="relative z-10 flex-1 flex flex-col justify-center pt-[110px] pr-8 pb-12 gap-y-5"
        style={{ paddingLeft: 'clamp(1.5rem, 11.9vw, 171px)' }}
      >
        {/* Title */}
        <div
          className="text-black mb-12 max-w-[728px]"
          style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(2.8rem, 5.56vw, 80px)', lineHeight: 1.03 }}
        >
          <span>Events are </span>
          <span className="text-gradient-better">better </span>
          <span>when everyone plays a part</span>
        </div>

        {/* Subtitle */}
        <p
          className="text-black max-w-[608px] mb-16 leading-relaxed"
          style={{ fontFamily: "'Albert Sans', sans-serif", fontSize: 'clamp(1rem, 1.39vw, 20px)' }}
        >
          The RSVP tool built for potlucks, watch parties, and group hangs.{' '}
          <strong className="font-bold">Start hosting <em className="italic">with</em> your friends,</strong>{' '}
          not just <em className="italic">for</em> them.
        </p>

        {/* CTA Button */}
        <Link
          to="/signup"
          className="inline-flex items-center justify-center w-[340px] h-[71px] rounded-[10px] no-underline cursor-pointer transition-all duration-200 hover:-translate-x-px hover:-translate-y-px"
          style={{
            background: '#e1bede',
            fontFamily: "'Cantora One', cursive",
            fontSize: 'clamp(1.2rem, 2.22vw, 32px)',
            color: '#000',
            filter: 'drop-shadow(4px 4px 2px #462749)',
          }}
          onMouseEnter={e => (e.currentTarget.style.filter = 'drop-shadow(6px 6px 4px #462749)')}
          onMouseLeave={e => (e.currentTarget.style.filter = 'drop-shadow(4px 4px 2px #462749)')}
        >
          Create Your First Event
        </Link>
      </div>
    </div>
  )
}
