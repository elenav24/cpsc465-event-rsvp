import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import LogoIcon from "./LogoIcon";

export default function Nav() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const loggedIn = !!user;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const isEventPage = /^\/events\/[^/]+$/.test(pathname);
  // Center links fade out on scroll; on the event page they're always hidden
  const hideCenter = isEventPage || scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileOpen(false);
    setProfileOpen(false);
  };

  const initials = profile?.display_name
    ? profile.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (profile?.email?.[0] ?? "U").toUpperCase();

  const displayName =
    profile?.display_name ?? profile?.email?.split("@")[0] ?? "Account";

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] h-[var(--nav-height)] flex items-center justify-between px-6 max-[850px]:px-4 transition-[background,border-color] duration-300 ease-in-out bg-white/70 backdrop-blur-md border-b border-white/40">
      {/* Logo */}
      <Link
        to={loggedIn ? "/events" : "/"}
        className="font-heading text-[#1a1a1a] flex items-center gap-2 no-underline flex-shrink-0 z-[1] hover:no-underline hover:text-[#1a1a1a]"
      >
        <LogoIcon size={40} className="max-[850px]:w-[28px] max-[850px]:h-[28px]" />
        <span className="font-heading text-[30px] max-[850px]:text-[20px] text-black leading-none">
          cohosted
        </span>
      </Link>

      {/* Center links — only shown when logged out, fade out on scroll, hidden on event page */}
      {!loggedIn && (
        <div
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-10 transition-opacity duration-300 ease-in-out max-[850px]:hidden"
          style={{
            opacity: hideCenter ? 0 : 1,
            pointerEvents: hideCenter ? "none" : "auto",
          }}
        >
          <Link
            to="/how-it-works"
            className="font-sans text-[18px] font-medium text-[#444] no-underline cursor-pointer transition-colors duration-200 whitespace-nowrap hover:text-pink hover:no-underline"
          >
            How It Works
          </Link>
          <Link
            to="/templates"
            className="font-sans text-[18px] font-medium text-[#444] no-underline cursor-pointer transition-colors duration-200 whitespace-nowrap hover:text-pink hover:no-underline"
          >
            Browse Templates
          </Link>
        </div>
      )}

      {/* Right actions — hidden on mobile */}
      <div className="flex items-center gap-3 flex-shrink-0 z-[1] max-[850px]:hidden">
        {loggedIn ? (
          <>
            <Link
              to="/events"
              className="font-sans text-[18px] font-medium text-[#444] no-underline cursor-pointer transition-colors duration-200 whitespace-nowrap hover:text-pink hover:no-underline"
            >
              My Events
            </Link>

            {/* Profile avatar + dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                className="w-[34px] h-[34px] rounded-full bg-pink text-white font-sans text-[0.78rem] font-bold border-none cursor-pointer flex items-center justify-center transition-[opacity,transform] duration-200 flex-shrink-0 hover:opacity-85 hover:scale-105"
                onClick={() => setProfileOpen((o) => !o)}
                aria-label="Account menu"
                aria-expanded={profileOpen}
              >
                {initials}
              </button>
              {profileOpen && (
                <div className="absolute top-[calc(100%+10px)] right-0 bg-white border border-border rounded-[var(--radius)] shadow-[var(--shadow)] min-w-[200px] py-2 z-[200]">
                  <div className="px-4 pt-2 pb-[0.1rem] text-[0.88rem] font-semibold text-text-dark whitespace-nowrap overflow-hidden text-ellipsis">
                    {displayName}
                  </div>
                  <div className="px-4 pb-2 text-[0.75rem] text-text-muted whitespace-nowrap overflow-hidden text-ellipsis">
                    {profile?.email}
                  </div>
                  <div className="h-px bg-border my-1" />
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 w-full px-4 py-2 font-sans text-[0.85rem] font-medium text-[#555] bg-transparent border-none cursor-pointer no-underline transition-[background,color] duration-150 text-left hover:bg-pink-bg hover:text-pink hover:no-underline"
                    onClick={() => setProfileOpen(false)}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Edit Profile
                  </Link>
                  <Link
                    to="/profile?tab=reminders"
                    className="flex items-center gap-2 w-full px-4 py-2 font-sans text-[0.85rem] font-medium text-[#555] bg-transparent border-none cursor-pointer no-underline transition-[background,color] duration-150 text-left hover:bg-pink-bg hover:text-pink hover:no-underline"
                    onClick={() => setProfileOpen(false)}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 01-3.46 0" />
                    </svg>
                    Reminders
                  </Link>
                  <button
                    className="flex items-center gap-2 w-full px-4 py-2 font-sans text-[0.85rem] font-medium text-[#c00] bg-transparent border-none cursor-pointer transition-[background,color] duration-150 text-left hover:bg-[#fff0f0] hover:text-[#c00]"
                    onClick={handleLogout}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="inline-flex items-center justify-center bg-[#d06395] text-white font-sans text-[18px] font-bold border-none rounded-[50px] px-[22px] h-[36px] cursor-pointer no-underline whitespace-nowrap transition-[background,transform] duration-200 hover:bg-[#b8527f] hover:-translate-y-px hover:no-underline"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="font-sans text-[18px] font-medium text-black bg-transparent border-none cursor-pointer px-2 py-1 no-underline inline-flex items-center transition-opacity duration-200 hover:text-pink hover:no-underline"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>

      {/* Hamburger — mobile only */}
      <button
        className="hidden flex-col justify-center gap-[5px] bg-transparent border-none cursor-pointer p-1 z-[101] max-[850px]:flex"
        onClick={() => setMobileOpen((o) => !o)}
        aria-label="Toggle menu"
        aria-expanded={mobileOpen}
      >
        <span
          className={`block w-6 h-[2px] bg-[#1a1a1a] rounded-[2px] transition-[transform,opacity] duration-[250ms] ease-in-out origin-center ${mobileOpen ? "translate-y-[7px] rotate-45" : ""}`}
        />
        <span
          className={`block w-6 h-[2px] bg-[#1a1a1a] rounded-[2px] transition-[transform,opacity] duration-[250ms] ease-in-out origin-center ${mobileOpen ? "opacity-0" : ""}`}
        />
        <span
          className={`block w-6 h-[2px] bg-[#1a1a1a] rounded-[2px] transition-[transform,opacity] duration-[250ms] ease-in-out origin-center ${mobileOpen ? "-translate-y-[7px] -rotate-45" : ""}`}
        />
      </button>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="fixed top-[var(--nav-height)] left-0 right-0 bg-white/[0.97] backdrop-blur-[12px] border-b border-border flex flex-col px-8 pt-4 pb-6 gap-1 z-[99] shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          {loggedIn ? (
            <>
              <Link
                to="/events"
                className="font-sans text-[16px] font-medium text-[#333] no-underline py-3 border-b border-border-light cursor-pointer bg-transparent text-left transition-colors duration-200 hover:text-pink hover:no-underline"
                onClick={() => setMobileOpen(false)}
              >
                My Events
              </Link>
              <Link
                to="/profile"
                className="font-sans text-[16px] font-medium text-[#333] no-underline py-3 border-b border-border-light cursor-pointer bg-transparent text-left transition-colors duration-200 hover:text-pink hover:no-underline"
                onClick={() => setMobileOpen(false)}
              >
                Edit Profile
              </Link>
              <button
                className="font-sans text-[16px] font-medium text-danger bg-transparent border-none border-b-0 py-3 cursor-pointer text-left transition-colors duration-200"
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/how-it-works"
                className="font-sans text-[16px] font-medium text-[#333] no-underline py-3 border-b border-border-light cursor-pointer bg-transparent text-left transition-colors duration-200 hover:text-pink hover:no-underline"
                onClick={() => setMobileOpen(false)}
              >
                How It Works
              </Link>
              <Link
                to="/templates"
                className="font-sans text-[16px] font-medium text-[#333] no-underline py-3 border-b border-border-light cursor-pointer bg-transparent text-left transition-colors duration-200 hover:text-pink hover:no-underline"
                onClick={() => setMobileOpen(false)}
              >
                Browse Templates
              </Link>
              <Link
                to="/login"
                className="font-sans text-[16px] font-medium text-[#333] no-underline py-3 border-b border-border-light cursor-pointer bg-transparent text-left transition-colors duration-200 hover:text-pink hover:no-underline"
                onClick={() => setMobileOpen(false)}
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="font-sans text-[16px] font-bold text-pink no-underline py-3 border-b-0 cursor-pointer bg-transparent text-left mt-2 transition-colors duration-200 hover:no-underline"
                onClick={() => setMobileOpen(false)}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
