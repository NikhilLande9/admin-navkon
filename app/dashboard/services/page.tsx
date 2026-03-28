"use client";

import { useState } from "react";

type Service = {
  id: string;
  name: string;
  desc: string;
  status: "Running" | "Degraded" | "Stopped";
  uptime: string;
  requests: string;
  region: string;
  type: "Core" | "Worker" | "Infra";
};

const types = ["All", "Core", "Worker", "Infra"];

const typeColorMap: Record<string, string> = {
  Core: "var(--orange)",
  Worker: "var(--green)",
  Infra: "var(--ink-soft)",
};

const typeDimMap: Record<string, string> = {
  Core: "var(--orange-dim)",
  Worker: "var(--green-dim)",
  Infra: "var(--surface2)",
};

const typeBorderMap: Record<string, string> = {
  Core: "var(--orange-border)",
  Worker: "var(--green-border)",
  Infra: "var(--border)",
};

const statusStyle: Record<string, { bg: string; text: string; pulse: string }> = {
  Running: { bg: "var(--green-dim)", text: "var(--green)", pulse: "var(--green)" },
  Degraded: { bg: "var(--orange-dim)", text: "var(--orange)", pulse: "var(--orange)" },
  Stopped: { bg: "var(--red-dim)", text: "var(--red)", pulse: "var(--red)" },
};

export default function ServicesPage() {
  const [serviceList, setServiceList] = useState<Service[]>([]);
  const [typeFilter, setTypeFilter] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);

  const [newService, setNewService] = useState({
    name: "",
    desc: "",
    type: "Core" as "Core" | "Worker" | "Infra",
    region: "us-east-1",
  });

  const filtered = serviceList.filter(
    (s) => typeFilter === "All" || s.type === typeFilter
  );

  const restartService = (id: string) => {
    setServiceList((list) =>
      list.map((s) => (s.id === id ? { ...s, status: "Running" } : s))
    );
  };

  const startService = (id: string) => {
    setServiceList((list) =>
      list.map((s) =>
        s.id === id ? { ...s, status: "Running", uptime: "100%" } : s
      )
    );
  };

  const handleDeployService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name || !newService.desc) return;

    const service: Service = {
      id: `SVC-${String(10 + serviceList.length).padStart(2, "0")}`,
      name: newService.name.trim(),
      desc: newService.desc.trim(),
      status: "Running",
      uptime: "100%",
      requests: "0",
      region: newService.region,
      type: newService.type,
    };

    setServiceList((prev) => [service, ...prev]);
    setNewService({ name: "", desc: "", type: "Core", region: "us-east-1" });
    setIsDeployModalOpen(false);
  };

  const runningCount = serviceList.filter((s) => s.status === "Running").length;
  const degradedCount = serviceList.filter((s) => s.status === "Degraded").length;
  const stoppedCount = serviceList.filter((s) => s.status === "Stopped").length;

  return (
    <div className="font-mono text-ink">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tighter text-ink">
            Services
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="h-0.5 w-7 bg-green rounded" />
            <p className="text-ink-muted text-sm font-light">
              {runningCount} running · {degradedCount} degraded · {stoppedCount} stopped
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsDeployModalOpen(true)}
          className="bg-orange hover:bg-orange/90 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
        >
          + Deploy Service
        </button>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-5 py-2 text-sm font-medium rounded-xl border transition-all ${
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

      {/* Grid View */}
      {view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((svc) => {
            const ss = statusStyle[svc.status];
            return (
              <div
                key={svc.id}
                className="bg-grad-card border border-border rounded-2xl p-6 hover:border-orange hover:-translate-y-1 hover:shadow-2xl transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${svc.status === "Running" ? "pulse" : ""}`}
                      style={{ background: ss.pulse }}
                    />
                    <div>
                      <div className="font-medium text-ink">{svc.name}</div>
                      <div className="text-xs text-ink-muted font-mono">{svc.id}</div>
                    </div>
                  </div>
                  <span
                    className="text-xs px-3 py-1 rounded-full border font-medium"
                    style={{
                      color: typeColorMap[svc.type],
                      background: typeDimMap[svc.type],
                      border: `1px solid ${typeBorderMap[svc.type]}`,
                    }}
                  >
                    {svc.type}
                  </span>
                </div>

                <p className="text-sm text-ink-muted leading-relaxed mb-6 line-clamp-2">
                  {svc.desc}
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    ["Uptime", svc.uptime],
                    ["Requests", svc.requests],
                    ["Region", svc.region],
                    ["Status", svc.status],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="bg-surface2 border border-border rounded-xl p-3"
                    >
                      <div className="text-[10px] uppercase tracking-widest text-ink-ghost">
                        {label}
                      </div>
                      <div
                        className="mt-1 text-sm font-medium"
                        style={{ color: label === "Status" ? ss.text : "var(--ink-soft)" }}
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
                    onClick={() => restartService(svc.id)}
                    className="flex-1 py-2 text-xs border border-border hover:border-orange-border hover:text-orange rounded-xl transition-all"
                  >
                    Restart
                  </button>
                  {svc.status === "Stopped" && (
                    <button
                      onClick={() => startService(svc.id)}
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
      ) : (
        /* List View */
        <div className="bg-grad-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface2">
                {["Status", "Service", "Type", "Uptime", "Requests", "Region", "Actions"].map((h, i) => (
                  <th
                    key={i}
                    className="px-6 py-4 text-left text-xs uppercase tracking-widest font-normal text-ink-dim"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((svc, i) => {
                const ss = statusStyle[svc.status];
                return (
                  <tr
                    key={svc.id}
                    className="border-b border-border2 last:border-none hover:bg-surface2 transition-colors"
                  >
                    <td className="px-6 py-5">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${svc.status === "Running" ? "pulse" : ""}`}
                        style={{ background: ss.pulse }}
                      />
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-medium text-ink">{svc.name}</div>
                      <div className="text-xs text-ink-ghost mt-1 line-clamp-1">{svc.desc}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className="text-xs px-3 py-1 rounded-full border font-medium"
                        style={{
                          color: typeColorMap[svc.type],
                          background: typeDimMap[svc.type],
                          border: `1px solid ${typeBorderMap[svc.type]}`,
                        }}
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
                          onClick={() => restartService(svc.id)}
                          className="px-4 py-1.5 text-xs border border-border hover:border-orange-border hover:text-orange rounded-lg transition-all"
                        >
                          Restart
                        </button>
                        {svc.status === "Stopped" && (
                          <button
                            onClick={() => startService(svc.id)}
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
        </div>
      )}

      {/* Empty State */}
      {filtered.length === 0 && serviceList.length === 0 && (
        <div className="py-20 text-center text-ink-ghost">
          No services deployed yet.<br />
          Click "+ Deploy Service" to get started.
        </div>
      )}

      {/* Deploy Modal */}
      {isDeployModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg p-8">
            <h2 className="font-serif text-2xl font-bold mb-6 text-ink">Deploy New Service</h2>

            <form onSubmit={handleDeployService} className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">
                  Service Name
                </label>
                <input
                  type="text"
                  required
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none"
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
                  rows={4}
                  className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none resize-y"
                  placeholder="Handles real-time user behavior tracking and aggregation..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">
                    Type
                  </label>
                  <select
                    value={newService.type}
                    onChange={(e) => setNewService({ ...newService, type: e.target.value as any })}
                    className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none"
                  >
                    <option value="Core">Core</option>
                    <option value="Worker">Worker</option>
                    <option value="Infra">Infra</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">
                    Region
                  </label>
                  <select
                    value={newService.region}
                    onChange={(e) => setNewService({ ...newService, region: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none"
                  >
                    <option value="us-east-1">us-east-1</option>
                    <option value="us-west-2">us-west-2</option>
                    <option value="eu-west-1">eu-west-1</option>
                    <option value="ap-south-1">ap-south-1</option>
                    <option value="global">global</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsDeployModalOpen(false)}
                  className="px-6 py-2.5 border border-border bg-surface2 hover:bg-surface rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-orange hover:bg-orange/90 text-white rounded-xl text-sm font-medium transition-all"
                >
                  Deploy Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}