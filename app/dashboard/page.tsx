//app\dashboard\page.tsx
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
      <div className="mb-6 sm:mb-8">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tighter text-ink">
          Overview
        </h1>
        <div className="flex items-center gap-2 sm:gap-3 mt-2">
          <div className="h-px w-6 sm:w-8 bg-green rounded" />
          <p className="text-ink-muted text-xs sm:text-sm font-light">
            <span className="hidden sm:inline">{today} — </span>All systems nominal
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-orange hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200"
          >
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <span className="text-xl sm:text-2xl">{s.icon}</span>
              <span
                className={`text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border font-mono ${
                  s.up
                    ? "text-green bg-green-dim border-green-border"
                    : "text-red bg-red-dim border-red"
                }`}
              >
                {s.change}
              </span>
            </div>
            <div className="text-xl sm:text-3xl font-semibold tracking-tighter font-serif text-ink mb-1">
              {s.value}
            </div>
            <div className="text-[9px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-ink-muted">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-3 bg-surface border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-2">
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-ink">Monthly Revenue</h3>
              <div className="h-px w-8 sm:w-10 bg-green rounded mt-2" />
            </div>
            <span className="text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-ink-muted">
              {new Date().getFullYear() - 1} — {new Date().getFullYear()}
            </span>
          </div>

          <div className="flex items-end gap-1 sm:gap-2 h-32 sm:h-40">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 sm:gap-2">
                <div className="w-full bg-surface2 border border-border rounded h-28 sm:h-36 flex items-end overflow-hidden">
                  <div
                    className="w-full rounded transition-all duration-1000"
                    style={{
                      height: animated ? `${h}%` : "0%",
                      background: "linear-gradient(180deg, var(--border), var(--surface2))",
                      transitionDelay: `${i * 50}ms`,
                    }}
                  />
                </div>
                <span className="text-[8px] sm:text-[10px] uppercase tracking-wider sm:tracking-widest text-ink-ghost">
                  {months[i].slice(0, 3)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-4 sm:gap-6 mt-4 sm:mt-6 text-[10px] sm:text-xs text-ink-muted">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2 h-2 rounded bg-orange" />
              <span className="hidden sm:inline">Current month</span>
              <span className="sm:hidden">Current</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2 h-2 rounded bg-green" />
              <span className="hidden sm:inline">High months</span>
              <span className="sm:hidden">High</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <h3 className="font-serif font-bold text-base sm:text-lg text-ink">Recent Activity</h3>
            <div className="h-px w-6 sm:w-8 bg-green rounded mt-2" />
          </div>

          {activityData.length === 0 ? (
            <div className="py-8 sm:py-12 text-center text-ink-ghost text-xs sm:text-sm">
              No recent activity yet.
            </div>
          ) : (
            <div className="space-y-1">
              {activityData.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:bg-surface2 transition-colors"
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      background: typeColor[a.type],
                      boxShadow: `0 0 6px ${typeColor[a.type]}`,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm text-ink-soft truncate">{a.event}</div>
                    <div className="text-[10px] sm:text-xs text-ink-muted mt-0.5">{a.user}</div>
                  </div>
                  <div className="text-[10px] sm:text-xs text-ink-dim whitespace-nowrap">{a.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* UDYAM footer note */}
      <div className="mt-6 sm:mt-8 pt-3 sm:pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2 text-[8px] sm:text-[9px] uppercase tracking-wider sm:tracking-widest text-ink-ghost font-mono">
        <span>NAVKON LABS · UDYAM-MH-33-0750188</span>
        <span className="text-[7px] sm:text-[9px]">Invoices issued without GST · GST applicable upon registration</span>
      </div>
    </div>
  );
}