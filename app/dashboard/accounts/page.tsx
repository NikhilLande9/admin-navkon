"use client";

import { useState } from "react";

type Account = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive" | "Suspended";
  joined: string;
  plan: "Starter" | "Pro" | "Enterprise";
};

const roles = ["Admin", "Manager", "Viewer"];
const plans = ["Starter", "Pro", "Enterprise"] as const;

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [selected, setSelected] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state for new account
  const [newAccount, setNewAccount] = useState({
    name: "",
    email: "",
    role: "Viewer" as const,
    plan: "Starter" as const,
  });

  const filtered = accounts.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "All" || a.role === roleFilter;
    return matchSearch && matchRole;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAccount.name || !newAccount.email) return;

    const account: Account = {
      id: `ACC-${String(Date.now()).slice(-4)}`,
      name: newAccount.name.trim(),
      email: newAccount.email.trim().toLowerCase(),
      role: newAccount.role,
      plan: newAccount.plan,
      status: "Active",
      joined: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })
        .format(new Date()),
    };

    setAccounts((prev) => [account, ...prev]);
    setNewAccount({ name: "", email: "", role: "Viewer", plan: "Starter" });
    setIsAddModalOpen(false);
  };

  const statusColor: Record<string, { bg: string; text: string; dot: string }> = {
    Active: { bg: "var(--green-dim)", text: "var(--green)", dot: "var(--green)" },
    Inactive: { bg: "var(--surface2)", text: "var(--ink-muted)", dot: "var(--ink-muted)" },
    Suspended: { bg: "var(--red-dim)", text: "var(--red)", dot: "var(--red)" },
  };

  const planColorMap: Record<string, string> = {
    Enterprise: "var(--orange)",
    Pro: "var(--green)",
    Starter: "var(--ink-soft)",
  };

  return (
    <div style={{ fontFamily: "'DM Mono', 'Courier New', monospace", color: "var(--ink)" }}>
      <style>{`
        .acct-row { transition: background 0.15s; }
        .acct-row:hover { background: var(--surface2) !important; }

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

        .search-input {
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--ink);
          padding: 10px 16px;
          border-radius: 8px;
          font-family: inherit;
          font-size: 13px;
          outline: none;
          width: 260px;
          transition: border-color 0.2s;
        }
        .search-input:focus { border-color: var(--orange); }
        .search-input::placeholder { color: var(--ink-dim); }

        .action-btn, .add-btn {
          background: var(--surface2);
          border: 1px solid var(--border);
          color: var(--ink-soft);
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-family: inherit;
          transition: all 0.15s;
        }
        .action-btn:hover, .add-btn:hover { 
          border-color: var(--orange-border); 
          color: var(--orange); 
        }

        .add-btn {
          background: var(--orange);
          border: none;
          color: #fff;
          font-weight: 500;
        }
        .add-btn:hover { opacity: 0.9; }

        .check-box {
          width: 14px;
          height: 14px;
          border: 1px solid var(--border);
          border-radius: 3px;
          cursor: pointer;
          accent-color: var(--orange);
        }

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
          max-width: 420px;
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
            Accounts
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            <div style={{ height: 2, width: 28, background: "var(--green)", borderRadius: 1 }} />
            <p style={{ color: "var(--ink-muted)", fontSize: 13, margin: 0, fontWeight: 300 }}>
              {accounts.length} total · {accounts.filter((a) => a.status === "Active").length} active
            </p>
          </div>
        </div>
        <button className="add-btn" onClick={() => setIsAddModalOpen(true)}>
          + Add Account
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <input
          className="search-input"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {["All", ...roles].map((r) => (
            <button
              key={r}
              className={`filter-btn ${roleFilter === r ? "active" : ""}`}
              onClick={() => setRoleFilter(r)}
            >
              {r}
            </button>
          ))}
        </div>

        {selected.length > 0 && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button className="action-btn">Suspend ({selected.length})</button>
            <button 
              className="action-btn" 
              style={{ color: "var(--red)", borderColor: "var(--red-dim)" }}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ 
        background: "var(--grad-card)", 
        border: "1px solid var(--border)", 
        borderRadius: 12, 
        overflow: "hidden" 
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["", "ID", "Name", "Role", "Plan", "Status", "Joined", ""].map((h, i) => (
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
            {filtered.map((a, i) => {
              const sc = statusColor[a.status];
              const planColor = planColorMap[a.plan];

              return (
                <tr
                  key={a.id}
                  className="acct-row"
                  style={{
                    borderBottom: i < filtered.length - 1 ? "1px solid var(--border2)" : "none",
                    background: selected.includes(a.id) ? "var(--orange-dim)" : "transparent",
                  }}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <input
                      type="checkbox"
                      className="check-box"
                      checked={selected.includes(a.id)}
                      onChange={() => toggleSelect(a.id)}
                    />
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 11, color: "var(--ink-muted)" }}>{a.id}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: "var(--orange-dim)",
                        border: "1px solid var(--orange-border)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, color: "var(--orange)", fontWeight: 600,
                      }}>
                        {a.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: "var(--ink)" }}>{a.name}</div>
                        <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>{a.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--ink-soft)" }}>{a.role}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      fontSize: 11,
                      color: planColor,
                      background: a.plan === "Enterprise" ? "var(--orange-dim)" : a.plan === "Pro" ? "var(--green-dim)" : "var(--surface2)",
                      padding: "2px 10px",
                      borderRadius: 20,
                      border: `1px solid ${a.plan === "Enterprise" ? "var(--orange-border)" : a.plan === "Pro" ? "var(--green-border)" : "var(--border)"}`,
                    }}>
                      {a.plan}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      display: "flex", alignItems: "center", gap: 6,
                      fontSize: 11, color: sc.text, background: sc.bg,
                      padding: "4px 10px", borderRadius: 20, width: "fit-content",
                      border: `1px solid ${sc.text}40`,
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: sc.dot }} />
                      {a.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 11, color: "var(--ink-muted)" }}>{a.joined}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <button className="action-btn" style={{ padding: "4px 12px", fontSize: 11 }}>
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ 
            padding: 60, 
            textAlign: "center", 
            color: "var(--ink-ghost)", 
            fontSize: 13 
          }}>
            {accounts.length === 0 
              ? "No accounts yet. Click '+ Add Account' to get started." 
              : "No accounts match your search."}
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {isAddModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2 style={{ margin: "0 0 24px 0", fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700 }}>
              Add New Account
            </h2>

            <form onSubmit={handleAddAccount}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "var(--ink-muted)" }}>
                  Full Name / Company
                </label>
                <input
                  type="text"
                  required
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    background: "var(--surface)",
                    color: "var(--ink)",
                    fontSize: 14,
                  }}
                  placeholder="John Doe or Acme Corp"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "var(--ink-muted)" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newAccount.email}
                  onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    background: "var(--surface)",
                    color: "var(--ink)",
                    fontSize: 14,
                  }}
                  placeholder="name@company.com"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "var(--ink-muted)" }}>
                    Role
                  </label>
                  <select
                    value={newAccount.role}
                    onChange={(e) => setNewAccount({ ...newAccount, role: e.target.value as any })}
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
                    {roles.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "var(--ink-muted)" }}>
                    Plan
                  </label>
                  <select
                    value={newAccount.plan}
                    onChange={(e) => setNewAccount({ ...newAccount, plan: e.target.value as any })}
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
                    {plans.map((plan) => (
                      <option key={plan} value={plan}>{plan}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="action-btn"
                  style={{ padding: "10px 20px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="add-btn"
                  style={{ padding: "10px 24px" }}
                >
                  Add Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}