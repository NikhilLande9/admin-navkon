"use client";

import { useTheme } from "@/components/providers/AppProviders";

export default function Topbar() {
  const { dark, toggleTheme } = useTheme();

  return (
    <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 shrink-0 transition-colors">
      {/* Brand */}
      <div className="flex items-center gap-3">
        {/* w-0.75 is not valid Tailwind — use inline style */}
        <div style={{ width: "3px", height: "16px" }} className="bg-orange rounded-full" />
        <span className="font-serif text-lg tracking-tight">
          <span className="text-orange">Nav</span>
          <span className="text-green">kon</span>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[2px] text-ink-muted ml-1">
          Admin
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="flex items-center gap-2 bg-surface2 border border-border hover:border-orange-border text-ink-soft hover:text-orange px-4 py-1.5 rounded-xl text-xs font-mono transition-all active:scale-95"
        >
          <span className="text-sm">{dark ? "☀" : "☾"}</span>
          <span>{dark ? "Light" : "Dark"}</span>
        </button>

        {/* Notifications */}
        <button className="relative w-9 h-9 bg-surface2 border border-border hover:border-orange-border rounded-xl flex items-center justify-center transition-all hover:shadow-sm">
          <span className="text-base">🔔</span>
          <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange rounded-full border-2 border-surface" />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-orange-dim border border-orange-border flex items-center justify-center text-xs font-bold text-orange cursor-pointer font-mono hover:scale-105 transition-transform active:scale-95">
          N
        </div>
      </div>
    </header>
  );
}