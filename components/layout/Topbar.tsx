"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Crown, ChevronDown } from "lucide-react";
import { useTheme, useAuth } from "@/components/providers/AppProviders";
import { useRole } from "@/components/providers/AppProviders";
import { SUPER_ADMIN_EMAIL } from "@/components/providers/AppProviders";

const ROLE_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  "Super Admin": { bg: "var(--orange-dim)",    text: "var(--orange)",  border: "var(--orange-border)" },
  Admin:         { bg: "var(--orange-dim)",    text: "var(--orange)",  border: "var(--orange-border)" },
  Accountant:    { bg: "var(--green-dim)",     text: "var(--green)",   border: "var(--green-border)"  },
  Support:       { bg: "rgba(96,165,250,0.1)", text: "#60a5fa",        border: "rgba(96,165,250,0.25)" },
  Intern:        { bg: "rgba(168,85,247,0.1)", text: "#a855f7",        border: "rgba(168,85,247,0.25)" },
  Guest:         { bg: "var(--surface2)",      text: "var(--ink-dim)", border: "var(--border)"        },
};

export default function Topbar() {
  const { dark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { role } = useRole();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
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
      {/* Brand */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div style={{ width: "3px", height: "14px" }} className="bg-orange rounded-full sm:h-4" />
        <span className="font-serif text-base sm:text-lg tracking-tight">
          <span className="text-orange">Nav</span>
          <span className="text-green">kon</span>
        </span>
        <span className="hidden xs:inline font-mono text-[9px] sm:text-[10px] uppercase tracking-[1.5px] sm:tracking-[2px] text-ink-muted ml-0.5 sm:ml-1">
          Admin
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle Button - Now a proper toggle */}
        <button
          onClick={toggleTheme}
          title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="relative flex items-center gap-2 bg-surface2 border border-border hover:border-orange-border px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl transition-all active:scale-95 group"
        >
          {/* Toggle track */}
          <div
            className="w-10 sm:w-11 h-5 sm:h-6 rounded-full border transition-all duration-200 relative"
            style={{
              background: dark ? "var(--orange-dim)" : "var(--surface2)",
              borderColor: dark ? "var(--orange-border)" : "var(--border)",
            }}
          >
            {/* Toggle thumb */}
            <div
              className="absolute top-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all duration-200 flex items-center justify-center text-[10px]"
              style={{
                left: dark ? "calc(100% - 20px)" : "2px",
                background: dark ? "var(--orange)" : "var(--ink-muted)",
                color: dark ? "white" : "var(--surface)",
              }}
            >
              {dark ? "☾" : "☀"}
            </div>
          </div>
          {/* Label text */}
          <span className="hidden xs:inline text-xs font-mono text-ink-soft group-hover:text-orange transition-colors">
            {dark ? "Dark" : "Light"}
          </span>
        </button>

        {/* Notifications */}
        <button className="relative w-8 h-8 sm:w-9 sm:h-9 bg-surface2 border border-border hover:border-orange-border rounded-lg sm:rounded-xl flex items-center justify-center transition-all hover:shadow-sm">
          <span className="text-sm sm:text-base">🔔</span>
          <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 bg-orange rounded-full border-2 border-surface" />
        </button>

        {/* Avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            title={user?.email || ""}
            className="flex items-center gap-1.5 group"
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            {/* Avatar circle */}
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-orange-dim border border-orange-border flex items-center justify-center text-xs font-bold text-orange font-mono hover:scale-105 transition-transform active:scale-95">
              {initials}
              {isSuperAdminUser && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange rounded-full flex items-center justify-center shadow border border-surface">
                  <Crown size={8} className="text-white" />
                </span>
              )}
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
              {/* User info header */}
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
                    <div className="text-sm font-sans font-medium text-ink truncate">
                      {displayName}
                    </div>
                    <div className="text-[10px] font-mono text-ink-ghost truncate mt-0.5">
                      {user?.email}
                    </div>
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