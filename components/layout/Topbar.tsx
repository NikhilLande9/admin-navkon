"use client";

// components/layout/Topbar.tsx

import { useTheme } from "@/components/providers/AppProviders";

export default function Topbar() {
  const { dark, toggleTheme } = useTheme();

  return (
    <header
      style={{
        height: 56,
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        flexShrink: 0,
        transition: "background 0.3s, border-color 0.3s",
      }}
    >
      {/* Left: Wordmark accent */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ height: 18, width: 3, background: "var(--orange)", borderRadius: 2 }} />
        <span
          style={{
            fontFamily: "var(--font-dm-serif, 'DM Serif Display', serif)",
            fontSize: 15,
            letterSpacing: "-0.3px",
          }}
        >
          <span style={{ color: "var(--orange)" }}>Nav</span>
          <span style={{ color: "var(--green)" }}>kon</span>
        </span>
        <span
          style={{
            fontSize: 10,
            color: "var(--ink-muted)",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginLeft: 4,
          }}
        >
          Admin
        </span>
      </div>

      {/* Right: Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Day / Night Toggle — wired to AppProviders ThemeContext */}
        <button
          onClick={toggleTheme}
          title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            color: "var(--ink-soft)",
            padding: "6px 14px",
            borderRadius: 8,
            cursor: "pointer",
            fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)",
            fontSize: 12,
            transition: "border-color 0.15s, color 0.15s, background 0.15s",
          }}
          onMouseOver={(e) => {
            const btn = e.currentTarget;
            btn.style.borderColor = "var(--orange-border)";
            btn.style.color = "var(--orange)";
          }}
          onMouseOut={(e) => {
            const btn = e.currentTarget;
            btn.style.borderColor = "var(--border)";
            btn.style.color = "var(--ink-soft)";
          }}
        >
          <span style={{ fontSize: 13 }}>{dark ? "☀" : "☾"}</span>
          <span>{dark ? "Light" : "Dark"}</span>
        </button>

        {/* Notifications */}
        <button
          style={{
            position: "relative",
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            color: "var(--ink-soft)",
            width: 36, height: 36,
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 15,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "border-color 0.15s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--orange-border)")}
          onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          🔔
          <div
            style={{
              position: "absolute", top: 7, right: 7,
              width: 7, height: 7, borderRadius: "50%",
              background: "var(--orange)",
              border: "1.5px solid var(--surface)",
            }}
          />
        </button>

        {/* Avatar */}
        <div
          style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "var(--orange-dim)",
            border: "2px solid var(--orange-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, color: "var(--orange)", fontWeight: 600,
            cursor: "pointer",
            fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)",
            flexShrink: 0,
          }}
        >
          A
        </div>
      </div>
    </header>
  );
}
