"use client";

import { useState, useEffect } from "react";

const stats = [
  { label: "Total Revenue", value: "$84,320", change: "+12.4%", up: true, icon: "💰" },
  { label: "Active Users", value: "3,842", change: "+8.1%", up: true, icon: "👥" },
  { label: "Services Running", value: "27", change: "-2", up: false, icon: "⚙️" },
  { label: "Pending Invoices", value: "14", change: "+3", up: false, icon: "📄" },
];

const activityData = [
  { time: "2m ago", event: "New account created", user: "alice@navkon.io", type: "account" },
  { time: "14m ago", event: "Invoice #1042 paid", user: "beta@corp.com", type: "billing" },
  { time: "1h ago", event: "Service 'API Gateway' restarted", user: "system", type: "service" },
  { time: "3h ago", event: "Settings updated", user: "admin@navkon.io", type: "settings" },
  { time: "5h ago", event: "New account created", user: "gamma@startup.io", type: "account" },
  { time: "1d ago", event: "Invoice #1041 overdue", user: "delta@co.com", type: "billing" },
];

const typeColor: Record<string, string> = {
  account: "var(--green)",
  billing: "var(--orange)",
  service: "var(--blue, #00b4f5)",
  settings: "var(--purple, #c084fc)",
};

const bars = [42, 67, 55, 80, 73, 91, 60, 85, 78, 95, 70, 88];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Dashboard() {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { setTimeout(() => setAnimated(true), 100); }, []);

  return (
    <div style={{ fontFamily: "'DM Mono', 'Courier New', monospace", color: "var(--ink)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=DM+Serif+Display&family=Syne:wght@700;800&display=swap');

        .stat-card {
          background: var(--grad-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 24px;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
          cursor: default;
        }
        .stat-card:hover {
          border-color: var(--orange);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px var(--orange-dim);
        }
        .activity-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 8px;
          border-bottom: 1px solid var(--border2);
          transition: background 0.15s;
          border-radius: 6px;
        }
        .activity-row:hover { background: var(--surface2); }
        .activity-row:last-child { border-bottom: none; }
        .bar-fill { transition: height 1s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", margin: 0, color: "var(--ink)" }}>
          Overview
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
          <div style={{ height: 1, width: 32, background: "var(--green)", borderRadius: 1 }} />
          <p style={{ color: "var(--ink-muted)", fontSize: 13, margin: 0, fontWeight: 300 }}>
            Saturday, March 28, 2026 — All systems nominal
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <span style={{
                fontSize: 11,
                color: s.up ? "var(--green)" : "var(--red)",
                background: s.up ? "var(--green-dim)" : "var(--red-dim)",
                padding: "2px 8px",
                borderRadius: 20,
                border: `1px solid ${s.up ? "var(--green-border)" : "var(--red-dim)"}`,
              }}>
                {s.change}
              </span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 500, color: "var(--ink)", fontFamily: "'Syne', sans-serif", letterSpacing: "-1px" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 4, textTransform: "uppercase", letterSpacing: "1px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16 }}>
        {/* Bar Chart */}
        <div style={{ background: "var(--grad-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, margin: 0, color: "var(--ink)" }}>Monthly Revenue</h3>
              <div style={{ height: 2, background: "var(--green)", width: 40, borderRadius: 1, marginTop: 6 }} />
            </div>
            <span style={{ fontSize: 11, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>2025 — 2026</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 160 }}>
            {bars.map((h, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ width: "100%", background: "var(--surface2)", borderRadius: 4, height: 140, display: "flex", alignItems: "flex-end", border: "1px solid var(--border)" }}>
                  <div
                    className="bar-fill"
                    style={{
                      width: "100%",
                      height: animated ? `${h}%` : "0%",
                      background: i === 11
                        ? "linear-gradient(180deg, var(--orange), var(--orange-mid, #fb923c))"
                        : i >= 9
                          ? "linear-gradient(180deg, var(--green), var(--deep-green))"
                          : "linear-gradient(180deg, var(--border), var(--surface2))",
                      borderRadius: 4,
                      transitionDelay: `${i * 60}ms`,
                    }}
                  />
                </div>
                <span style={{ fontSize: 9, color: "var(--ink-ghost, #475569)", textTransform: "uppercase" }}>{months[i]}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: "var(--orange)" }} />
              <span style={{ fontSize: 10, color: "var(--ink-muted)" }}>Current month</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: "var(--green)" }} />
              <span style={{ fontSize: 10, color: "var(--ink-muted)" }}>High months</span>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div style={{ background: "var(--grad-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, margin: "0 0 6px", color: "var(--ink)" }}>Recent Activity</h3>
            <div style={{ height: 2, background: "var(--green)", width: 32, borderRadius: 1 }} />
          </div>
          {activityData.map((a, i) => (
            <div key={i} className="activity-row">
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: typeColor[a.type],
                flexShrink: 0,
                boxShadow: `0 0 6px ${typeColor[a.type]}`,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "var(--ink-soft)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.event}</div>
                <div style={{ fontSize: 10, color: "var(--ink-muted)", marginTop: 2 }}>{a.user}</div>
              </div>
              <div style={{ fontSize: 10, color: "var(--ink-dim)", flexShrink: 0 }}>{a.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}