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
  const [stats] = useState<Stat[]>([
    { label: "Total Revenue", value: "$0", change: "+0%", up: true, icon: "💰" },
    { label: "Active Users", value: "0", change: "+0", up: true, icon: "👥" },
    { label: "Services Running", value: "0", change: "0", up: true, icon: "⚙️" },
    { label: "Pending Invoices", value: "0", change: "0", up: true, icon: "📄" },
  ]);

  const [activityData] = useState<Activity[]>([]);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const typeColor: Record<string, string> = {
    account: "var(--green)",
    billing: "var(--orange)",
    service: "var(--blue)",
    settings: "var(--purple)",
  };

  const bars = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  }).format(new Date());

  return (
    <div className="font-mono text-ink">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold tracking-tighter text-ink">
          Overview
        </h1>
        <div className="flex items-center gap-3 mt-2">
          <div className="h-px w-8 bg-green rounded" />
          <p className="text-ink-muted text-sm font-light">
            {today} — All systems nominal
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-2xl p-6 hover:border-orange hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200"
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
        <div className="lg:col-span-3 bg-surface border border-border rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-serif font-bold text-lg text-ink">Monthly Revenue</h3>
              <div className="h-px w-10 bg-green rounded mt-2" />
            </div>
            <span className="text-xs uppercase tracking-widest text-ink-muted">
              {new Date().getFullYear() - 1} — {new Date().getFullYear()}
            </span>
          </div>

          <div className="flex items-end gap-2 h-40">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-surface2 border border-border rounded h-36 flex items-end overflow-hidden">
                  <div
                    className="w-full rounded transition-all duration-1000"
                    style={{
                      height: animated ? `${h}%` : "0%",
                      background: "linear-gradient(180deg, var(--border), var(--surface2))",
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
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="font-serif font-bold text-lg text-ink">Recent Activity</h3>
            <div className="h-px w-8 bg-green rounded mt-2" />
          </div>

          {activityData.length === 0 ? (
            <div className="py-12 text-center text-ink-ghost text-sm">
              No recent activity yet.
            </div>
          ) : (
            <div className="space-y-1">
              {activityData.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface2 transition-colors"
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
          )}
        </div>
      </div>

      {/* UDYAM footer note */}
      <div className="mt-8 pt-4 border-t border-border flex items-center justify-between text-[9px] uppercase tracking-widest text-ink-ghost font-mono">
        <span>NAVKON LABS · UDYAM-MH-33-0750188</span>
        <span>Invoices issued without GST · GST applicable upon registration</span>
      </div>
    </div>
  );
}