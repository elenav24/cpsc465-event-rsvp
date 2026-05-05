export default function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200 bg-neutral-50">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-8 px-8">
        {/* Left — copyright */}
        <p className="text-zinc-500 text-sm">© 2026 Cohosted</p>

        {/* Right — links */}
        <div className="flex items-center gap-6">
          <a href="https://github.com/elenav24/cohosted/issues/new" className="text-zinc-500 text-sm hover:text-zinc-800 transition-colors">Report a Bug</a>
          <a href="mailto:support@cohosted.cloud" className="text-zinc-500 text-sm hover:text-zinc-800 transition-colors">Contact Us</a>
          <a href="https://github.com/elenav24/cohosted" className="text-zinc-500 text-sm hover:text-zinc-800 transition-colors">Source Code</a>
        </div>
      </div>
    </footer>
  )
}
