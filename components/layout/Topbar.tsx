"use client";

import { useTheme } from "@/components/providers/AppProviders";

export default function Topbar() {
  const { dark, toggleTheme } = useTheme();

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
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="flex items-center gap-1.5 sm:gap-2 bg-surface2 border border-border hover:border-orange-border text-ink-soft hover:text-orange px-2.5 sm:px-4 py-1.5 rounded-lg sm:rounded-xl text-xs font-mono transition-all active:scale-95"
        >
          <span className="text-sm">{dark ? "☀" : "☾"}</span>
          <span className="hidden xs:inline">{dark ? "Light" : "Dark"}</span>
        </button>

        {/* Notifications */}
        <button className="relative w-8 h-8 sm:w-9 sm:h-9 bg-surface2 border border-border hover:border-orange-border rounded-lg sm:rounded-xl flex items-center justify-center transition-all hover:shadow-sm">
          <span className="text-sm sm:text-base">🔔</span>
          <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 bg-orange rounded-full border-2 border-surface" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-orange-dim border border-orange-border flex items-center justify-center text-xs font-bold text-orange cursor-pointer font-mono hover:scale-105 transition-transform active:scale-95">
          N
        </div>
      </div>
    </header>
  );
}