"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Crown, ChevronDown, Bell } from "lucide-react";
import { useTheme, useAuth, useRole, SUPER_ADMIN_EMAIL } from "@/components/providers/AppProviders";

/* ─── Role badge palette ─────────────────────────────────────────────── */
const ROLE_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  "Super Admin": { bg: "var(--orange-dim)",    text: "var(--orange)",  border: "var(--orange-border)" },
  Admin:         { bg: "var(--orange-dim)",    text: "var(--orange)",  border: "var(--orange-border)" },
  Accountant:    { bg: "var(--green-dim)",     text: "var(--green)",   border: "var(--green-border)"  },
  Support:       { bg: "rgba(96,165,250,0.1)", text: "#60a5fa",        border: "rgba(96,165,250,0.25)" },
  Intern:        { bg: "rgba(168,85,247,0.1)", text: "#a855f7",        border: "rgba(168,85,247,0.25)" },
  Guest:         { bg: "var(--surface2)",      text: "var(--ink-dim)", border: "var(--border)"        },
};

/* ─── Samurai Day/Night Toggle ───────────────────────────────────────────
   Layout (toggle is 88×34px):
   • bright.png fades out, dark.png fades in  — crossfade background
   • .sm-orb slides LEFT→RIGHT                — sun (white-yellow) to moon (silver)
   • twinkling stars appear in dark mode
   • inset shadow overlay for depth
──────────────────────────────────────────────────────────────────────── */
function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <>
      <style>{`
        /* ── Shell ── */
        .sm-label {
          --w: 88px;
          --h: 34px;
          --orb: 26px;
          --pad: 4px;
          --travel: calc(var(--w) - var(--orb) - var(--pad) * 2);  /* 88-26-8 = 54px */
          --ease: cubic-bezier(0.1, 0, 0.1, 1);
          --dur: 0.9s;

          cursor: pointer;
          display: block;
          position: relative;
          width: var(--w);
          height: var(--h);
          border-radius: 100px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .sm-input { display: none; }

        /* ── Background layers (crossfade) ── */
        .sm-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          border-radius: 100px;
          transition: opacity var(--dur) ease-in-out;
        }
        .sm-bright {
          background-image: url('/images/bright.png');
          opacity: 1;
        }
        .sm-dark {
          background-image: url('/images/dark.png');
          opacity: 0;
        }
        .sm-input:checked ~ .sm-bright { opacity: 0; }
        .sm-input:checked ~ .sm-dark   { opacity: 1; }

        /* ── Stars (only visible in dark mode) ── */
        .sm-stars {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.4s ease 0.15s;
        }
        .sm-input:checked ~ .sm-stars { opacity: 1; }

        /* Individual star dots */
        .sm-stars span {
          position: absolute;
          background: #fff;
          border-radius: 50%;
          animation: sm-twinkle 1.8s ease-in-out infinite;
        }
        .sm-stars span:nth-child(1)  { width:2px; height:2px; top:22%; left:55%; animation-delay:0s;    animation-duration:1.6s; }
        .sm-stars span:nth-child(2)  { width:2px; height:2px; top:35%; left:68%; animation-delay:0.3s;  animation-duration:2.1s; }
        .sm-stars span:nth-child(3)  { width:1px; height:1px; top:18%; left:75%; animation-delay:0.6s;  animation-duration:1.4s; }
        .sm-stars span:nth-child(4)  { width:2px; height:2px; top:55%; left:60%; animation-delay:0.9s;  animation-duration:1.9s; }
        .sm-stars span:nth-child(5)  { width:1px; height:1px; top:28%; left:82%; animation-delay:0.2s;  animation-duration:2.3s; }
        .sm-stars span:nth-child(6)  { width:2px; height:2px; top:65%; left:72%; animation-delay:1.1s;  animation-duration:1.7s; }
        .sm-stars span:nth-child(7)  { width:1px; height:1px; top:40%; left:88%; animation-delay:0.5s;  animation-duration:2.0s; }
        .sm-stars span:nth-child(8)  { width:2px; height:2px; top:15%; left:62%; animation-delay:0.8s;  animation-duration:1.5s; }

        @keyframes sm-twinkle {
          0%, 100% { opacity: 0.15; transform: scale(1);   }
          50%       { opacity: 1;    transform: scale(1.4); }
        }

        /* ── Orb (sun→moon, slides left→right) ── */
        .sm-orb {
          position: absolute;
          z-index: 2;
          top: var(--pad);
          left: var(--pad);
          width: var(--orb);
          height: var(--orb);
          border-radius: 50%;
          overflow: hidden;
          pointer-events: none;
          transition: left var(--dur) var(--ease);
          /* Sun glow */
          box-shadow:
            0 0 6px 2px rgba(255, 210, 60, 0.55),
            0 1px 4px rgba(0,0,0,0.25),
            inset 0 1px 2px rgba(255,255,200,0.8);
        }
        .sm-input:checked ~ .sm-orb {
          left: calc(var(--pad) + var(--travel));
          /* Moon glow */
          box-shadow:
            0 0 6px 2px rgba(180, 200, 255, 0.45),
            0 1px 4px rgba(0,0,0,0.30),
            inset 0 1px 2px rgba(220,230,255,0.7);
        }

        /* Sun face (default) */
        .sm-sun {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(circle at 40% 38%, #FFE97A, #FFB800 70%);
          transition: opacity var(--dur) ease;
          opacity: 1;
        }

        /* Moon face (slides in from right) */
        .sm-moon {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(circle at 38% 36%, #E8EDF8, #C4C9D1 65%);
          transform: translateX(100%);
          transition: transform var(--dur) var(--ease);
        }
        /* Moon craters */
        .sm-moon::before,
        .sm-moon::after {
          content: "";
          position: absolute;
          border-radius: 50%;
          background: #959DB1;
        }
        .sm-moon::before { width: 5px; height: 5px; top: 35%; left: 22%; }
        .sm-moon::after  { width: 3px; height: 3px; top: 58%; left: 42%; }

        .sm-input:checked ~ .sm-orb .sm-sun  { opacity: 0; }
        .sm-input:checked ~ .sm-orb .sm-moon { transform: translateX(0); }

        /* ── Depth inset shadow — always on top ── */
        .sm-label::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 100px;
          box-shadow: inset 0 2px 6px rgba(0,0,0,0.28);
          pointer-events: none;
          z-index: 3;
        }
      `}</style>

      <label
        className="sm-label"
        title={dark ? "Switch to Light" : "Switch to Dark"}
        aria-label="Toggle theme"
      >
        <input
          type="checkbox"
          className="sm-input"
          checked={dark}
          onChange={onToggle}
          aria-checked={dark}
        />

        {/* Crossfade backgrounds */}
        <div className="sm-bg sm-bright" />
        <div className="sm-bg sm-dark" />

        {/* Twinkling stars (dark only) */}
        <div className="sm-stars">
          <span /><span /><span /><span />
          <span /><span /><span /><span />
        </div>

        {/* Sliding orb */}
        <div className="sm-orb">
          <div className="sm-sun" />
          <div className="sm-moon" />
        </div>
      </label>
    </>
  );
}

/* ─── Main Topbar ────────────────────────────────────────────────────── */
export default function Topbar() {
  const { dark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { role } = useRole();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Admin";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isSuperAdminUser = user?.email === SUPER_ADMIN_EMAIL;
  const displayRole = isSuperAdminUser ? "Super Admin" : (role ?? "Guest");
  const badge = ROLE_BADGE[displayRole] ?? ROLE_BADGE["Guest"];

  /* close dropdowns on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setMenuOpen(false); setNotifOpen(false); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push("/login");
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <header className="h-14 sm:h-16 bg-surface border-b border-border flex items-center justify-between px-3 sm:px-6 shrink-0 transition-colors">

      <div />

      {/* ── Right side ── */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* Samurai Day/Night toggle */}
        <ThemeToggle dark={dark} onToggle={toggleTheme} />

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative w-8 h-8 sm:w-9 sm:h-9 bg-surface2 border border-border hover:border-orange-border rounded-lg sm:rounded-xl flex items-center justify-center transition-all hover:shadow-sm active:scale-95"
            aria-label="Notifications"
          >
            <Bell size={15} className="text-ink-soft" strokeWidth={1.75} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-orange rounded-full border-2 border-surface" />
          </button>

          {notifOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-72 bg-surface border border-border rounded-2xl shadow-xl z-50 overflow-hidden"
              style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}
            >
              <div className="px-4 py-3 border-b border-border bg-surface2/50 flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-ink uppercase tracking-wider">Notifications</span>
                <span className="text-[10px] font-mono text-orange bg-orange-dim border border-orange-border px-2 py-0.5 rounded-full">1 new</span>
              </div>
              <div className="px-4 py-3">
                <div className="flex gap-3 items-start">
                  <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-orange shrink-0" />
                  <div>
                    <p className="text-xs font-sans text-ink leading-snug">Welcome to Navkon Admin.</p>
                    <p className="text-[10px] font-mono text-ink-ghost mt-0.5">Just now</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-5 bg-border" />

        {/* Avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            title={user?.email || ""}
            className="flex items-center gap-1.5 sm:gap-2 group"
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            {/* Avatar */}
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-orange-dim border border-orange-border flex items-center justify-center text-xs font-bold text-orange font-mono group-hover:scale-105 transition-transform active:scale-95">
              {initials}
              {isSuperAdminUser && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange rounded-full flex items-center justify-center shadow border border-surface">
                  <Crown size={8} className="text-white" />
                </span>
              )}
            </div>

            {/* Name + role (desktop) */}
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-[11px] font-sans font-medium text-ink leading-none">{displayName}</span>
              <span
                className="text-[9px] font-mono mt-0.5"
                style={{ color: badge.text }}
              >
                {displayRole}
              </span>
            </div>

            <ChevronDown
              size={12}
              className={`text-ink-dim transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown panel */}
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border rounded-2xl shadow-xl z-50 overflow-hidden"
              style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}
            >
              {/* User info */}
              <div className="px-4 py-4 border-b border-border bg-surface2/50">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full bg-orange-dim border border-orange-border flex items-center justify-center text-sm font-bold text-orange font-mono shrink-0">
                    {initials}
                    {isSuperAdminUser && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange rounded-full flex items-center justify-center shadow border border-surface">
                        <Crown size={8} className="text-white" />
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-sans font-medium text-ink truncate">{displayName}</p>
                    <p className="text-[10px] font-mono text-ink-ghost truncate mt-0.5">{user?.email}</p>
                  </div>
                </div>

                {/* Role badge */}
                <div className="mt-3">
                  <span
                    className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border"
                    style={{ background: badge.bg, color: badge.text, borderColor: badge.border }}
                  >
                    {isSuperAdminUser && <Crown size={8} />}
                    {displayRole}
                  </span>
                </div>
              </div>

              {/* Sign out */}
              <div className="px-2 py-2">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-sans font-medium text-ink-muted hover:bg-red-dim hover:text-red transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loggingOut ? (
                    <svg className="animate-spin h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <LogOut size={14} strokeWidth={1.75} className="shrink-0" />
                  )}
                  {loggingOut ? "Signing out…" : "Sign Out"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}