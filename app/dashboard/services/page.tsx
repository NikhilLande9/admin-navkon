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

  // Form state for new service
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
    <div style={{ fontFamily: "'DM Mono', 'Courier New', monospace", color: "var(--ink)" }}>
      <style>{`
        .svc-card {
          background: var(--grad-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
          cursor: default;
        }
        .svc-card:hover {
          border-color: var(--orange-border);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px var(--orange-dim);
        }

        .filter-btn {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--ink-muted);
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-family: inherit;
          transition: all 0.15s;
        }
        .filter-btn:hover { border-color: var(--orange-border); color: var(--orange); }
        .filter-btn.active {
          background: var(--orange-dim);
          border-color: var(--orange);
          color: var(--orange);
        }

        .view-btn {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--ink-dim);
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-family: inherit;
          transition: all 0.15s;
        }
        .view-btn.active {
          background: var(--surface2);
          color: var(--ink);
          border-color: var(--orange-border);
        }

        .svc-action {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--ink-muted);
          padding: 5px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 11px;
          font-family: inherit;
          transition: all 0.15s;
        }
        .svc-action:hover { border-color: var(--orange-border); color: var(--orange); }

        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        .pulse { animation: pulse 2s infinite; }

        .svc-row { transition: background 0.15s; }
        .svc-row:hover { background: var(--surface2) !important; }

        .modal {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }
        .modal-content {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          width: 100%;
          max-width: 480px;
          padding: 28px;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ 
            fontFamily: "'Syne', sans-serif", 
            fontSize: 28, 
            fontWeight: 800, 
            letterSpacing: "-0.5px", 
            margin: 0, 
            color: "var(--ink)" 
          }}>
            Services
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            <div style={{ height: 2, width: 28, background: "var(--green)", borderRadius: 1 }} />
            <p style={{ color: "var(--ink-muted)", fontSize: 13, margin: 0, fontWeight: 300 }}>
              {runningCount} running · {degradedCount} degraded · {stoppedCount} stopped
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsDeployModalOpen(true)}
          style={{
            background: "var(--orange)", 
            border: "none", 
            color: "#fff",
            padding: "8px 20px", 
            borderRadius: 6, 
            cursor: "pointer",
            fontSize: 12, 
            fontFamily: "inherit", 
            fontWeight: 500,
          }}
        >
          + Deploy Service
        </button>
      </div>

      {/* Filters & View Toggle */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 20 }}>
        {types.map((t) => (
          <button 
            key={t} 
            className={`filter-btn ${typeFilter === t ? "active" : ""}`} 
            onClick={() => setTypeFilter(t)}
          >
            {t}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button 
            className={`view-btn ${view === "grid" ? "active" : ""}`} 
            onClick={() => setView("grid")}
          >
            ⊞
          </button>
          <button 
            className={`view-btn ${view === "list" ? "active" : ""}`} 
            onClick={() => setView("list")}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Grid View */}
      {view === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {filtered.map((svc) => {
            const ss = statusStyle[svc.status];
            return (
              <div key={svc.id} className="svc-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div
                      className={svc.status === "Running" ? "pulse" : ""}
                      style={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: "50%", 
                        background: ss.pulse, 
                        flexShrink: 0 
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 500 }}>{svc.name}</div>
                      <div style={{ fontSize: 10, color: "var(--ink-muted)", marginTop: 2 }}>{svc.id}</div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10,
                    color: typeColorMap[svc.type],
                    background: typeDimMap[svc.type],
                    padding: "2px 8px", 
                    borderRadius: 20,
                    border: `1px solid ${typeBorderMap[svc.type]}`,
                  }}>
                    {svc.type}
                  </span>
                </div>

                <p style={{ fontSize: 11, color: "var(--ink-muted)", margin: "0 0 16px", lineHeight: 1.6 }}>
                  {svc.desc}
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                  {[
                    ["Uptime", svc.uptime],
                    ["Requests", svc.requests],
                    ["Region", svc.region],
                    ["Status", svc.status]
                  ].map(([k, v]) => (
                    <div 
                      key={k} 
                      style={{ 
                        background: "var(--surface2)", 
                        borderRadius: 6, 
                        padding: "8px 10px", 
                        border: "1px solid var(--border)" 
                      }}
                    >
                      <div style={{ 
                        fontSize: 9, 
                        color: "var(--ink-ghost)", 
                        textTransform: "uppercase", 
                        letterSpacing: "0.8px" 
                      }}>
                        {k}
                      </div>
                      <div style={{ 
                        fontSize: 12, 
                        color: k === "Status" ? ss.text : "var(--ink-soft)", 
                        marginTop: 2 
                      }}>
                        {v}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  <button className="svc-action">Logs</button>
                  <button className="svc-action" onClick={() => restartService(svc.id)}>
                    Restart
                  </button>
                  {svc.status === "Stopped" && (
                    <button
                      className="svc-action"
                      style={{ color: "var(--green)", borderColor: "var(--green-border)" }}
                      onClick={() => startService(svc.id)}
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
        <div style={{ 
          background: "var(--grad-card)", 
          border: "1px solid var(--border)", 
          borderRadius: 12, 
          overflow: "hidden" 
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Status", "Service", "Type", "Uptime", "Requests", "Region", "Actions"].map((h, i) => (
                  <th 
                    key={i} 
                    style={{
                      padding: "12px 16px", 
                      textAlign: "left", 
                      fontSize: 10,
                      color: "var(--ink-dim)", 
                      textTransform: "uppercase",
                      letterSpacing: "1px", 
                      fontWeight: 400, 
                      background: "var(--surface2)",
                    }}
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
                    className="svc-row" 
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border2)" : "none" }}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <div 
                        className={svc.status === "Running" ? "pulse" : ""} 
                        style={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: "50%", 
                          background: ss.pulse 
                        }} 
                      />
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontSize: 13, color: "var(--ink)" }}>{svc.name}</div>
                      <div style={{ fontSize: 10, color: "var(--ink-ghost)" }}>{svc.desc}</div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        fontSize: 11,
                        color: typeColorMap[svc.type],
                        background: typeDimMap[svc.type],
                        padding: "2px 8px", 
                        borderRadius: 20,
                        border: `1px solid ${typeBorderMap[svc.type]}`,
                      }}>
                        {svc.type}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--ink-soft)" }}>
                      {svc.uptime}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--ink-soft)" }}>
                      {svc.requests}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--ink-muted)" }}>
                      {svc.region}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="svc-action">Logs</button>
                        <button className="svc-action" onClick={() => restartService(svc.id)}>
                          Restart
                        </button>
                        {svc.status === "Stopped" && (
                          <button
                            className="svc-action"
                            style={{ color: "var(--green)", borderColor: "var(--green-border)" }}
                            onClick={() => startService(svc.id)}
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
        <div style={{ 
          padding: 80, 
          textAlign: "center", 
          color: "var(--ink-ghost)", 
          fontSize: 13 
        }}>
          No services deployed yet.<br />
          Click "+ Deploy Service" to get started.
        </div>
      )}

      {/* Deploy New Service Modal */}
      {isDeployModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2 style={{ 
              margin: "0 0 24px 0", 
              fontFamily: "'Syne', sans-serif", 
              fontSize: 22, 
              fontWeight: 700 
            }}>
              Deploy New Service
            </h2>

            <form onSubmit={handleDeployService}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "var(--ink-muted)" }}>
                  Service Name
                </label>
                <input
                  type="text"
                  required
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    background: "var(--surface)",
                    color: "var(--ink)",
                    fontSize: 14,
                  }}
                  placeholder="User Analytics Service"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "var(--ink-muted)" }}>
                  Description
                </label>
                <textarea
                  required
                  value={newService.desc}
                  onChange={(e) => setNewService({ ...newService, desc: e.target.value })}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    background: "var(--surface)",
                    color: "var(--ink)",
                    fontSize: 14,
                    resize: "vertical",
                  }}
                  placeholder="Handles real-time user behavior tracking and aggregation..."
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "var(--ink-muted)" }}>
                    Type
                  </label>
                  <select
                    value={newService.type}
                    onChange={(e) => setNewService({ ...newService, type: e.target.value as any })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      background: "var(--surface)",
                      color: "var(--ink)",
                      fontSize: 14,
                    }}
                  >
                    <option value="Core">Core</option>
                    <option value="Worker">Worker</option>
                    <option value="Infra">Infra</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "var(--ink-muted)" }}>
                    Region
                  </label>
                  <select
                    value={newService.region}
                    onChange={(e) => setNewService({ ...newService, region: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      background: "var(--surface)",
                      color: "var(--ink)",
                      fontSize: 14,
                    }}
                  >
                    <option value="us-east-1">us-east-1</option>
                    <option value="us-west-2">us-west-2</option>
                    <option value="eu-west-1">eu-west-1</option>
                    <option value="ap-south-1">ap-south-1</option>
                    <option value="global">global</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setIsDeployModalOpen(false)}
                  style={{
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                    color: "var(--ink-soft)",
                    padding: "10px 20px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: "var(--orange)",
                    border: "none",
                    color: "#fff",
                    padding: "10px 28px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 500,
                  }}
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