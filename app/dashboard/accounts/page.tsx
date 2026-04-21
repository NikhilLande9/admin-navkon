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

  const [newAccount, setNewAccount] = useState({
    name: "",
    email: "",
    role: "Viewer" as const,
    plan: "Starter" as const,
  });

  const filtered = accounts.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q);
    const matchRole = roleFilter === "All" || a.role === roleFilter;
    return matchSearch && matchRole;
  });

  const toggleSelect = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

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
      joined: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date()),
    };
    setAccounts((prev) => [account, ...prev]);
    setNewAccount({ name: "", email: "", role: "Viewer", plan: "Starter" });
    setIsAddModalOpen(false);
  };

  const statusColor: Record<string, { bg: string; text: string; dot: string }> = {
    Active:    { bg: "var(--green-dim)",  text: "var(--green)",    dot: "var(--green)"    },
    Inactive:  { bg: "var(--surface2)",   text: "var(--ink-muted)", dot: "var(--ink-muted)" },
    Suspended: { bg: "var(--red-dim)",    text: "var(--red)",      dot: "var(--red)"      },
  };

  const planColorMap: Record<string, { color: string; bg: string; border: string }> = {
    Enterprise: { color: "var(--orange)", bg: "var(--orange-dim)", border: "var(--orange-border)" },
    Pro:        { color: "var(--green)",  bg: "var(--green-dim)",  border: "var(--green-border)"  },
    Starter:    { color: "var(--ink-soft)", bg: "var(--surface2)", border: "var(--border)"        },
  };

  return (
    <div className="font-mono text-ink">
      {/* Header */}
      <div className="flex flex-col sm:flex-row flex-wrap justify-between items-start gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tighter text-ink">Accounts</h1>
          <div className="flex items-center gap-2 sm:gap-3 mt-2">
            <div className="h-px w-5 sm:w-7 bg-green rounded" />
            <p className="text-ink-muted text-xs sm:text-sm font-light">
              {accounts.length} total · {accounts.filter((a) => a.status === "Active").length} active
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-orange hover:opacity-90 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
        >
          + Add Account
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center mb-4 sm:mb-6">
        <input
          type="text"
          placeholder="Search by name, email or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-surface border border-border text-ink px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm w-full sm:w-72 focus:border-orange outline-none transition-colors font-mono placeholder:text-ink-dim"
        />
        <div className="flex gap-2 flex-wrap">
          {["All", ...roles].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-medium rounded-xl border transition-all ${
                roleFilter === r
                  ? "bg-orange-dim border-orange text-orange"
                  : "bg-transparent border-border text-ink-muted hover:border-orange-border hover:text-orange"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        {selected.length > 0 && (
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto sm:ml-auto">
            <button className="flex-1 sm:flex-none px-4 sm:px-5 py-2 text-xs sm:text-sm border border-border bg-surface2 hover:border-orange-border hover:text-orange rounded-xl transition-all">
              Suspend ({selected.length})
            </button>
            <button className="flex-1 sm:flex-none px-4 sm:px-5 py-2 text-xs sm:text-sm border border-red text-red hover:bg-red-dim rounded-xl transition-all">
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Table - Desktop */}
      <div className="hidden md:block bg-surface border border-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface2">
              {["", "ID", "Name", "Role", "Plan", "Status", "Joined", ""].map((h, i) => (
                <th key={i} className="px-6 py-4 text-left text-xs uppercase tracking-widest font-normal text-ink-dim">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const sc = statusColor[a.status];
              const pc = planColorMap[a.plan];
              return (
                <tr
                  key={a.id}
                  className="border-b border-border last:border-none hover:bg-surface2 transition-colors"
                  style={{ background: selected.includes(a.id) ? "var(--orange-dim)" : undefined }}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selected.includes(a.id)}
                      onChange={() => toggleSelect(a.id)}
                      className="w-4 h-4 accent-orange"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-ink-muted font-mono">{a.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-dim border border-orange-border flex items-center justify-center text-orange font-semibold text-sm">
                        {a.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm text-ink">{a.name}</div>
                        <div className="text-xs text-ink-muted">{a.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-ink-soft">{a.role}</td>
                  <td className="px-6 py-4">
                    <span
                      className="text-xs px-3 py-1 rounded-full font-medium border"
                      style={{ color: pc.color, background: pc.bg, borderColor: pc.border }}
                    >
                      {a.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full border"
                      style={{ color: sc.text, background: sc.bg, borderColor: `${sc.text}40` }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ background: sc.dot }} />
                      {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-ink-muted">{a.joined}</td>
                  <td className="px-6 py-4">
                    <button className="px-4 py-1.5 text-xs border border-border bg-surface2 hover:border-orange-border hover:text-orange rounded-lg transition-all">
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-ink-ghost text-sm">
            {accounts.length === 0
              ? "No accounts yet. Click '+ Add Account' to get started."
              : "No accounts match your search."}
          </div>
        )}
      </div>

      {/* Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {filtered.map((a) => {
          const sc = statusColor[a.status];
          const pc = planColorMap[a.plan];
          return (
            <div
              key={a.id}
              className="bg-surface border border-border rounded-xl p-4 transition-all"
              style={{ background: selected.includes(a.id) ? "var(--orange-dim)" : undefined }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={selected.includes(a.id)}
                    onChange={() => toggleSelect(a.id)}
                    className="w-4 h-4 accent-orange shrink-0 mt-1"
                  />
                  <div className="w-10 h-10 rounded-full bg-orange-dim border border-orange-border flex items-center justify-center text-orange font-semibold text-sm shrink-0">
                    {a.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{a.name}</div>
                    <div className="text-xs text-ink-muted truncate">{a.email}</div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div>
                  <div className="text-ink-ghost uppercase tracking-wider text-[10px]">ID</div>
                  <div className="text-ink-muted font-mono">{a.id}</div>
                </div>
                <div>
                  <div className="text-ink-ghost uppercase tracking-wider text-[10px]">Role</div>
                  <div className="text-ink-soft">{a.role}</div>
                </div>
                <div>
                  <div className="text-ink-ghost uppercase tracking-wider text-[10px]">Plan</div>
                  <span
                    className="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium border mt-1"
                    style={{ color: pc.color, background: pc.bg, borderColor: pc.border }}
                  >
                    {a.plan}
                  </span>
                </div>
                <div>
                  <div className="text-ink-ghost uppercase tracking-wider text-[10px]">Status</div>
                  <span
                    className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border mt-1"
                    style={{ color: sc.text, background: sc.bg, borderColor: `${sc.text}40` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                    {a.status}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-border">
                <span className="text-xs text-ink-muted">Joined {a.joined}</span>
                <button className="px-3 py-1.5 text-xs border border-border bg-surface2 hover:border-orange-border hover:text-orange rounded-lg transition-all">
                  Edit
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-ink-ghost text-sm bg-surface border border-border rounded-xl">
            {accounts.length === 0
              ? "No accounts yet. Click '+ Add Account' to get started."
              : "No accounts match your search."}
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="font-serif text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-ink">Add New Account</h2>
            <form onSubmit={handleAddAccount} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">Full Name / Company</label>
                <input
                  type="text" required value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none transition-colors"
                  placeholder="John Doe or Acme Corp"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">Email Address</label>
                <input
                  type="email" required value={newAccount.email}
                  onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
                  className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none transition-colors"
                  placeholder="name@company.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">Role</label>
                  <select
                    value={newAccount.role}
                    onChange={(e) => setNewAccount({ ...newAccount, role: e.target.value as any })}
                    className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none transition-colors"
                  >
                    {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">Plan</label>
                  <select
                    value={newAccount.plan}
                    onChange={(e) => setNewAccount({ ...newAccount, plan: e.target.value as any })}
                    className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none transition-colors"
                  >
                    {plans.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button" onClick={() => setIsAddModalOpen(false)}
                  className="px-5 sm:px-6 py-2.5 border border-border bg-surface2 hover:bg-surface rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 sm:px-8 py-2.5 bg-orange hover:opacity-90 text-white rounded-xl text-sm font-medium transition-all"
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