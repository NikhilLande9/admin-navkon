//app\dashboard\services\page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import RoleGuard from "@/components/auth/RoleGuard";
import { CheckCircle2, XCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceStatus = "Running" | "Degraded" | "Stopped";
type ServiceType   = "Core" | "Worker" | "Infra";

type Service = {
  id: string;           // Firestore document ID
  name: string;
  desc: string;
  status: ServiceStatus;
  uptime: string;
  requests: string;
  region: string;
  type: ServiceType;
  createdAt: Timestamp | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SERVICE_TYPES: ServiceType[] = ["Core", "Worker", "Infra"];
const REGIONS = ["us-east-1", "us-west-2", "eu-west-1", "ap-south-1", "global"];

const typeColor: Record<ServiceType, { color: string; bg: string; border: string }> = {
  Core:   { color: "var(--orange)",   bg: "var(--orange-dim)", border: "var(--orange-border)" },
  Worker: { color: "var(--green)",    bg: "var(--green-dim)",  border: "var(--green-border)"  },
  Infra:  { color: "var(--ink-soft)", bg: "var(--surface2)",   border: "var(--border)"        },
};

const statusStyle: Record<ServiceStatus, { bg: string; text: string; pulse: string }> = {
  Running:  { bg: "var(--green-dim)",  text: "var(--green)",  pulse: "var(--green)"  },
  Degraded: { bg: "var(--orange-dim)", text: "var(--orange)", pulse: "var(--orange)" },
  Stopped:  { bg: "var(--red-dim)",    text: "var(--red)",    pulse: "var(--red)"    },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [newService, setNewService] = useState({
    name:   "",
    desc:   "",
    type:   "Core" as ServiceType,
    region: "ap-south-1",
  });

  // ── Firestore real-time listener ──────────────────────────────────────────

  useEffect(() => {
    const q = query(collection(db, "services"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: Service[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id:        d.id,
            name:      data.name     as string,
            desc:      data.desc     as string,
            status:    (data.status  as ServiceStatus) || "Running",
            uptime:    data.uptime   as string || "100%",
            requests:  data.requests as string || "0",
            region:    data.region   as string,
            type:      (data.type    as ServiceType) || "Core",
            createdAt: data.createdAt || null,
          };
        });
        setServices(docs);
        setLoading(false);
      },
      (err) => {
        console.error("Services snapshot error:", err);
        showToast("Failed to load services. Please refresh.", false);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = services.filter(
    (s) => typeFilter === "All" || s.type === typeFilter
  );

  // ── Deploy service ────────────────────────────────────────────────────────

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name || !newService.desc) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "services"), {
        name:      newService.name.trim(),
        desc:      newService.desc.trim(),
        type:      newService.type,
        region:    newService.region,
        status:    "Running" as ServiceStatus,
        uptime:    "100%",
        requests:  "0",
        createdAt: serverTimestamp(),
      });
      setNewService({ name: "", desc: "", type: "Core", region: "ap-south-1" });
      setIsDeployOpen(false);
      showToast("Service deployed successfully", true);
    } catch (err) {
      console.error("Deploy error:", err);
      showToast("Failed to deploy service. Please try again.", false);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Status actions ────────────────────────────────────────────────────────

  const setStatus = async (id: string, status: ServiceStatus) => {
    try {
      await updateDoc(doc(db, "services", id), { status });
      showToast(`Service ${status === "Running" ? "started" : "restarted"} successfully`, true);
    } catch {
      showToast("Failed to update service status.", false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const runningCount  = services.filter((s) => s.status === "Running").length;
  const degradedCount = services.filter((s) => s.status === "Degraded").length;
  const stoppedCount  = services.filter((s) => s.status === "Stopped").length;

  return (
    <RoleGuard page="Services">
      <div className="font-mono text-ink">

        {/* Toast */}
        {toast && (
          <div
            className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl font-sans text-sm"
            style={{
              background:  toast.ok ? "var(--green-dim)" : "var(--red-dim)",
              borderColor: toast.ok ? "var(--green-border)" : "var(--red)",
              color:       toast.ok ? "var(--green)" : "var(--red)",
            }}
          >
            {toast.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tighter text-ink">
              Services
            </h1>
            <div className="flex items-center gap-2 sm:gap-3 mt-2">
              <div className="h-px w-5 sm:w-7 bg-green rounded" />
              <p className="text-ink-muted text-xs sm:text-sm font-light">
                {loading ? "Loading…" : `${runningCount} running · ${degradedCount} degraded · ${stoppedCount} stopped`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDeployOpen(true)}
            className="bg-orange hover:opacity-90 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all"
          >
            + Deploy Service
          </button>
        </div>

        {/* Filters & View Toggle */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {["All", ...SERVICE_TYPES].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 sm:px-5 py-2 text-sm font-medium rounded-xl border transition-all ${
                typeFilter === t
                  ? "bg-orange-dim border-orange text-orange"
                  : "bg-transparent border-border text-ink-muted hover:border-orange-border hover:text-orange"
              }`}
            >
              {t}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setView("grid")}
              className={`px-4 py-2 border rounded-xl text-lg transition-all ${
                view === "grid"
                  ? "bg-surface2 border-orange text-ink"
                  : "border-border text-ink-dim hover:border-orange-border"
              }`}
            >
              ⊞
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-4 py-2 border rounded-xl text-lg transition-all ${
                view === "list"
                  ? "bg-surface2 border-orange text-ink"
                  : "border-border text-ink-dim hover:border-orange-border"
              }`}
            >
              ☰
            </button>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-surface border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Grid View */}
        {!loading && view === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((svc) => {
              const ss = statusStyle[svc.status];
              const tc = typeColor[svc.type];
              return (
                <div
                  key={svc.id}
                  className="bg-surface border border-border rounded-2xl p-6 hover:border-orange hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          background: ss.pulse,
                          boxShadow: svc.status === "Running" ? `0 0 6px ${ss.pulse}` : "none",
                        }}
                      />
                      <div>
                        <div className="font-medium text-ink">{svc.name}</div>
                        <div className="text-xs text-ink-ghost font-mono">{svc.region}</div>
                      </div>
                    </div>
                    <span
                      className="text-xs px-3 py-1 rounded-full border font-medium"
                      style={{ color: tc.color, background: tc.bg, borderColor: tc.border }}
                    >
                      {svc.type}
                    </span>
                  </div>

                  <p className="text-sm text-ink-muted leading-relaxed mb-5 line-clamp-2">
                    {svc.desc}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {[
                      ["Uptime",   svc.uptime,   null],
                      ["Requests", svc.requests, null],
                      ["Status",   svc.status,   ss.text],
                      ["Type",     svc.type,     tc.color],
                    ].map(([label, value, color]) => (
                      <div key={label as string} className="bg-surface2 border border-border rounded-xl p-3">
                        <div className="text-[10px] uppercase tracking-widest text-ink-ghost">{label}</div>
                        <div
                          className="mt-1 text-sm font-medium"
                          style={{ color: (color as string) || "var(--ink-soft)" }}
                        >
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 py-2 text-xs border border-border hover:border-orange-border hover:text-orange rounded-xl transition-all">
                      Logs
                    </button>
                    <button
                      onClick={() => setStatus(svc.id, "Running")}
                      className="flex-1 py-2 text-xs border border-border hover:border-orange-border hover:text-orange rounded-xl transition-all"
                    >
                      Restart
                    </button>
                    {svc.status === "Stopped" && (
                      <button
                        onClick={() => setStatus(svc.id, "Running")}
                        className="flex-1 py-2 text-xs border border-green-border text-green hover:bg-green-dim rounded-xl transition-all"
                      >
                        Start
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View */}
        {!loading && view === "list" && (
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface2">
                  {["Status", "Service", "Type", "Uptime", "Requests", "Region", "Actions"].map((h, i) => (
                    <th key={i} className="px-6 py-4 text-left text-xs uppercase tracking-widest font-normal text-ink-dim">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((svc) => {
                  const ss = statusStyle[svc.status];
                  const tc = typeColor[svc.type];
                  return (
                    <tr key={svc.id} className="border-b border-border last:border-none hover:bg-surface2 transition-colors">
                      <td className="px-6 py-5">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            background: ss.pulse,
                            boxShadow: svc.status === "Running" ? `0 0 6px ${ss.pulse}` : "none",
                          }}
                        />
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-medium text-ink">{svc.name}</div>
                        <div className="text-xs text-ink-ghost mt-1 line-clamp-1">{svc.desc}</div>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className="text-xs px-3 py-1 rounded-full border font-medium"
                          style={{ color: tc.color, background: tc.bg, borderColor: tc.border }}
                        >
                          {svc.type}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-ink-soft">{svc.uptime}</td>
                      <td className="px-6 py-5 text-sm text-ink-soft">{svc.requests}</td>
                      <td className="px-6 py-5 text-sm text-ink-muted">{svc.region}</td>
                      <td className="px-6 py-5">
                        <div className="flex gap-2">
                          <button className="px-4 py-1.5 text-xs border border-border hover:border-orange-border hover:text-orange rounded-lg transition-all">
                            Logs
                          </button>
                          <button
                            onClick={() => setStatus(svc.id, "Running")}
                            className="px-4 py-1.5 text-xs border border-border hover:border-orange-border hover:text-orange rounded-lg transition-all"
                          >
                            Restart
                          </button>
                          {svc.status === "Stopped" && (
                            <button
                              onClick={() => setStatus(svc.id, "Running")}
                              className="px-4 py-1.5 text-xs border border-green-border text-green hover:bg-green-dim rounded-lg transition-all"
                            >
                              Start
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && !loading && (
              <div className="py-16 text-center text-ink-ghost text-sm">
                {services.length === 0
                  ? "No services deployed yet. Click '+ Deploy Service' to get started."
                  : "No services match the current filter."}
              </div>
            )}
          </div>
        )}

        {/* Empty state for grid */}
        {!loading && view === "grid" && filtered.length === 0 && (
          <div className="py-20 text-center text-ink-ghost">
            {services.length === 0
              ? "No services deployed yet.\nClick '+ Deploy Service' to get started."
              : "No services match the current filter."}
          </div>
        )}

        {/* Deploy Modal */}
        {isDeployOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-surface border border-border rounded-2xl w-full max-w-lg p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
              <h2 className="font-serif text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-ink">
                Deploy New Service
              </h2>
              <form onSubmit={handleDeploy} className="space-y-5">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">
                    Service Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none transition-colors"
                    placeholder="User Analytics Service"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">
                    Description
                  </label>
                  <textarea
                    required
                    value={newService.desc}
                    onChange={(e) => setNewService({ ...newService, desc: e.target.value })}
                    rows={3}
                    className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none resize-y transition-colors"
                    placeholder="Handles real-time user behavior tracking and aggregation…"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">
                      Type
                    </label>
                    <select
                      value={newService.type}
                      onChange={(e) => setNewService({ ...newService, type: e.target.value as ServiceType })}
                      className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none transition-colors"
                    >
                      {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">
                      Region
                    </label>
                    <select
                      value={newService.region}
                      onChange={(e) => setNewService({ ...newService, region: e.target.value })}
                      className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none transition-colors"
                    >
                      {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsDeployOpen(false); setNewService({ name: "", desc: "", type: "Core", region: "ap-south-1" }); }}
                    disabled={submitting}
                    className="px-6 py-2.5 border border-border bg-surface2 hover:bg-surface rounded-xl text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-2.5 bg-orange hover:opacity-90 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Deploying…
                      </>
                    ) : "Deploy Service"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </RoleGuard>
  );
}