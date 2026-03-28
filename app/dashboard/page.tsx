"use client";

import { useState, useEffect } from "react";

type Stat = {
  label: string;
  value: string;
  change: string;
  up: boolean;
  icon: string;
};

type Activity = {
  time: string;
  event: string;
  user: string;
  type: "account" | "billing" | "service" | "settings";
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stat[]>([
    { label: "Total Revenue", value: "$84,320", change: "+12.4%", up: true, icon: "💰" },
    { label: "Active Users", value: "3,842", change: "+8.1%", up: true, icon: "👥" },
    { label: "Services Running", value: "27", change: "-2", up: false, icon: "⚙️" },
    { label: "Pending Invoices", value: "14", change: "+3", up: false, icon: "📄" },
  ]);

  const [activityData, setActivityData] = useState<Activity[]>([
    { time: "2m ago", event: "New account created", user: "alice@navkon.io", type: "account" },
    { time: "14m ago", event: "Invoice #1042 paid", user: "beta@corp.com", type: "billing" },
    { time: "1h ago", event: "Service 'API Gateway' restarted", user: "system", type: "service" },
    { time: "3h ago", event: "Settings updated", user: "admin@navkon.io", type: "settings" },
    { time: "5h ago", event: "New account created", user: "gamma@startup.io", type: "account" },
    { time: "1d ago", event: "Invoice #1041 overdue", user: "delta@co.com", type: "billing" },
  ]);

  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimated(true), 100);

    // Simulate live activity (replace with real API/WebSocket later)
    const interval = setInterval(() => {
      setActivityData((prev) => {
        const newActivity: Activity = {
          time: "Just now",
          event: "Service status updated",
          user: "system",
          type: "service",
        };
        return [newActivity, ...prev.slice(0, 5)];
      });
    }, 25000);

    return () => clearInterval(interval);
  }, []);

  const typeColor: Record<string, string> = {
    account: "var(--green)",
    billing: "var(--orange)",
    service: "var(--blue, #00b4f5)",
    settings: "var(--purple, #c084fc)",
  };

  const bars = [42, 67, 55, 80, 73, 91, 60, 85, 78, 95, 70, 88];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="font-mono text-ink">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold tracking-tighter text-ink">
          Overview
        </h1>
        <div className="flex items-center gap-3 mt-2">
          <div className="h-0.5 w-8 bg-green rounded" />
          <p className="text-ink-muted text-sm font-light">
            Saturday, March 28, 2026 — All systems nominal
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <div
            key={i}
            className="stat-card bg-grad-card border border-border rounded-2xl p-6 hover:border-orange hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-2xl">{s.icon}</span>
              <span
                className={`text-xs px-3 py-1 rounded-full border font-mono ${
                  s.up
                    ? "text-green bg-green-dim border-green-border"
                    : "text-red bg-red-dim border-red"
                }`}
              >
                {s.change}
              </span>
            </div>
            <div className="text-3xl font-semibold tracking-tighter font-serif text-ink mb-1">
              {s.value}
            </div>
            <div className="text-xs uppercase tracking-widest text-ink-muted">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-3 bg-grad-card border border-border rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-serif font-bold text-lg text-ink">Monthly Revenue</h3>
              <div className="h-0.5 w-10 bg-green rounded mt-2" />
            </div>
            <span className="text-xs uppercase tracking-widest text-ink-muted">
              2025 — 2026
            </span>
          </div>

          <div className="flex items-end gap-2 h-40">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-surface2 border border-border rounded h-36 flex items-end overflow-hidden">
                  <div
                    className="bar-fill w-full rounded transition-all duration-1000"
                    style={{
                      height: animated ? `${h}%` : "0%",
                      background:
                        i === 11
                          ? "linear-gradient(180deg, var(--orange), var(--orange-mid))"
                          : i >= 9
                          ? "linear-gradient(180deg, var(--green), var(--deep-green))"
                          : "linear-gradient(180deg, var(--border), var(--surface2))",
                      transitionDelay: `${i * 50}ms`,
                    }}
                  />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-ink-ghost">
                  {months[i]}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-6 mt-6 text-xs text-ink-muted">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded bg-orange" />
              Current month
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded bg-green" />
              High months
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-grad-card border border-border rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="font-serif font-bold text-lg text-ink">Recent Activity</h3>
            <div className="h-0.5 w-8 bg-green rounded mt-2" />
          </div>

          <div className="space-y-1">
            {activityData.map((a, i) => (
              <div
                key={i}
                className="activity-row flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface2 transition-colors"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    background: typeColor[a.type],
                    boxShadow: `0 0 6px ${typeColor[a.type]}`,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ink-soft truncate">{a.event}</div>
                  <div className="text-xs text-ink-muted mt-0.5">{a.user}</div>
                </div>
                <div className="text-xs text-ink-dim whitespace-nowrap">{a.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}