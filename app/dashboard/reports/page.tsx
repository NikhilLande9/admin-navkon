// app/dashboard/reports/page.tsx
"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import RoleGuard from "@/components/auth/RoleGuard";
import { BarChart3, Download, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";

/* ─── lightweight types pulled from other collections ─── */
type AnyDoc = Record<string, any>;

type ReportRange = "7d" | "30d" | "90d" | "all";

function withinRange(seconds: number | undefined, range: ReportRange): boolean {
  if (!seconds || range === "all") return true;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return Date.now() / 1000 - seconds < days * 86400;
}

function trend(current: number, previous: number) {
  if (previous === 0) return { icon: <Minus size={13} />, label: "No prior data", color: "var(--ink-dim)" };
  const pct = ((current - previous) / previous) * 100;
  if (pct > 0) return { icon: <TrendingUp size={13} />, label: `+${pct.toFixed(1)}%`, color: "var(--green)" };
  return { icon: <TrendingDown size={13} />, label: `${pct.toFixed(1)}%`, color: "var(--red)" };
}

export default function ReportsPage() {
  const [clients,  setClients]  = useState<AnyDoc[]>([]);
  const [products, setProducts] = useState<AnyDoc[]>([]);
  const [team,     setTeam]     = useState<AnyDoc[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [range,    setRange]    = useState<ReportRange>("30d");

  useEffect(() => {
    let done = 0;
    const check = () => { if (++done === 3) setLoading(false); };

    const unsubs = [
      onSnapshot(query(collection(db, "clients"),  orderBy("createdAt", "desc")), (s) => { setClients(s.docs.map((d) => ({ id: d.id, ...d.data() }))); check(); }),
      onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc")), (s) => { setProducts(s.docs.map((d) => ({ id: d.id, ...d.data() }))); check(); }),
      onSnapshot(query(collection(db, "team"),     orderBy("createdAt", "desc")), (s) => { setTeam(s.docs.map((d) => ({ id: d.id, ...d.data() }))); check(); }),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  /* ── derived stats ── */
  const inRange     = (docs: AnyDoc[]) => docs.filter((d) => withinRange(d.createdAt?.seconds, range));
  const prevRange   = (docs: AnyDoc[]) => {
    if (range === "all") return [];
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    return docs.filter((d) => {
      if (!d.createdAt?.seconds) return false;
      const age = Date.now() / 1000 - d.createdAt.seconds;
      return age >= days * 86400 && age < days * 86400 * 2;
    });
  };

  const newClients  = inRange(clients).length;
  const prevClients = prevRange(clients).length;

  const activeProducts  = products.filter((p) => p.status === "Active").length;
  const inventoryValue  = products.reduce((s, p) => s + (p.price || 0) * (p.stock || 0), 0);

  const activeStaff  = team.filter((m) => m.status === "Active").length;
  const departments  = new Set(team.map((m) => m.department).filter(Boolean)).size;

  /* ── category breakdown for products ── */
  const categoryMap: Record<string, number> = {};
  products.forEach((p) => {
    const cat = p.category || "Uncategorised";
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const categories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

  /* ── client status breakdown ── */
  const activeClients   = clients.filter((c) => c.status === "Active").length;
  const inactiveClients = clients.filter((c) => c.status === "Inactive").length;

  /* ── CSV export helper ── */
  const exportCSV = (rows: AnyDoc[], filename: string) => {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]).filter((k) => k !== "id" && k !== "createdAt");
    const csv  = [keys.join(","), ...rows.map((r) => keys.map((k) => `"${r[k] ?? ""}"`).join(","))].join("\n");
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = filename;
    a.click();
  };

  const RANGES: { label: string; value: ReportRange }[] = [
    { label: "7 days", value: "7d" },
    { label: "30 days", value: "30d" },
    { label: "90 days", value: "90d" },
    { label: "All time", value: "all" },
  ];

  const clientTrend = trend(newClients, prevClients);

  return (
    <RoleGuard page="Reports">
      <div className="font-mono text-ink">

        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-1">
            <BarChart3 size={24} className="text-orange" strokeWidth={1.75} />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tighter text-ink">Reports</h1>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-px w-6 sm:w-8 bg-orange rounded" />
            <p className="text-ink-muted text-xs sm:text-sm font-light">Analytics and summaries across your workspace</p>
          </div>
        </div>

        {/* Range selector */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {RANGES.map((r) => (
            <button key={r.value} onClick={() => setRange(r.value)}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono border transition-all
                ${range === r.value
                  ? "bg-orange text-white border-orange shadow shadow-orange/20"
                  : "bg-surface border-border text-ink-muted hover:border-orange hover:text-orange"}`}>
              {r.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center gap-3 py-16 text-ink-muted text-sm font-sans">
            <Loader2 size={18} className="animate-spin text-orange" /> Crunching numbers…
          </div>
        ) : (
          <div className="space-y-6">

            {/* KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Clients",     value: clients.length,         sub: `${activeClients} active` },
                { label: "New Clients",       value: newClients,             sub: clientTrend.label, subColor: clientTrend.color },
                { label: "Active Staff",      value: activeStaff,            sub: `${departments} dept${departments !== 1 ? "s" : ""}` },
                { label: "Inventory Value",   value: `₹${inventoryValue.toLocaleString()}`, sub: `${activeProducts} active products` },
              ].map(({ label, value, sub, subColor }) => (
                <div key={label} className="bg-surface border border-border rounded-xl p-4">
                  <div className="text-2xl font-serif font-bold text-ink">{value}</div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-ink-ghost mt-1">{label}</div>
                  {sub && (
                    <div className="text-[10px] font-mono mt-2" style={{ color: subColor ?? "var(--ink-dim)" }}>{sub}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Two column breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Client status breakdown */}
              <div className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-sm font-semibold text-ink">Client Status</h2>
                  <button onClick={() => exportCSV(clients, "clients.csv")}
                    className="flex items-center gap-1.5 text-[10px] font-mono text-ink-dim hover:text-orange transition-colors">
                    <Download size={11} /> Export
                  </button>
                </div>
                {[
                  { label: "Active",   count: activeClients,   total: clients.length, color: "var(--green)"  },
                  { label: "Inactive", count: inactiveClients, total: clients.length, color: "var(--ink-dim)" },
                ].map(({ label, count, total, color }) => (
                  <div key={label} className="mb-3 last:mb-0">
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-ink-muted">{label}</span>
                      <span style={{ color }}>{count} / {total}</span>
                    </div>
                    <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: total ? `${(count / total) * 100}%` : "0%", background: color }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Product categories */}
              <div className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-sm font-semibold text-ink">Products by Category</h2>
                  <button onClick={() => exportCSV(products, "products.csv")}
                    className="flex items-center gap-1.5 text-[10px] font-mono text-ink-dim hover:text-orange transition-colors">
                    <Download size={11} /> Export
                  </button>
                </div>
                {categories.length === 0 ? (
                  <p className="text-ink-ghost text-xs font-sans">No products yet.</p>
                ) : categories.slice(0, 6).map(([cat, count]) => (
                  <div key={cat} className="mb-3 last:mb-0">
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-ink-muted truncate mr-4">{cat}</span>
                      <span className="text-orange shrink-0">{count}</span>
                    </div>
                    <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-orange transition-all"
                        style={{ width: `${(count / products.length) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Team breakdown */}
            <div className="bg-surface border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-sm font-semibold text-ink">Team by Department</h2>
                <button onClick={() => exportCSV(team, "team.csv")}
                  className="flex items-center gap-1.5 text-[10px] font-mono text-ink-dim hover:text-orange transition-colors">
                  <Download size={11} /> Export
                </button>
              </div>
              {team.length === 0 ? (
                <p className="text-ink-ghost text-xs font-sans">No team members yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Array.from(new Set(team.map((m) => m.department || "Unassigned"))).map((dept) => {
                    const count = team.filter((m) => (m.department || "Unassigned") === dept).length;
                    return (
                      <div key={dept} className="bg-surface2 rounded-xl px-4 py-3">
                        <div className="text-lg font-serif font-bold text-ink">{count}</div>
                        <div className="text-[10px] font-mono text-ink-ghost mt-0.5 truncate">{dept}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </RoleGuard>
  );
}