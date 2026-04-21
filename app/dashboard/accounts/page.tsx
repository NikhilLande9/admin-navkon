//app\dashboard\accounts\page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import RoleGuard from "@/components/auth/RoleGuard";
import { Pencil, Trash2, CheckCircle2, XCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AccountStatus = "Active" | "Inactive" | "Suspended";
type AccountPlan = "Starter" | "Pro" | "Enterprise";
type AccountRole = "Admin" | "Manager" | "Viewer";

type Account = {
  id: string;            // Firestore document ID
  name: string;
  email: string;
  role: AccountRole;
  status: AccountStatus;
  plan: AccountPlan;
  joined: string;        // Formatted display date
  createdAt: Timestamp | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLES: AccountRole[] = ["Admin", "Manager", "Viewer"];
const PLANS: AccountPlan[] = ["Starter", "Pro", "Enterprise"];
const STATUSES: AccountStatus[] = ["Active", "Inactive", "Suspended"];

const fmt = (d: Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);

const statusColor: Record<AccountStatus, { bg: string; text: string; dot: string }> = {
  Active:    { bg: "var(--green-dim)",  text: "var(--green)",     dot: "var(--green)"     },
  Inactive:  { bg: "var(--surface2)",   text: "var(--ink-muted)", dot: "var(--ink-muted)" },
  Suspended: { bg: "var(--red-dim)",    text: "var(--red)",       dot: "var(--red)"       },
};

const planColor: Record<AccountPlan, { color: string; bg: string; border: string }> = {
  Enterprise: { color: "var(--orange)", bg: "var(--orange-dim)", border: "var(--orange-border)" },
  Pro:        { color: "var(--green)",  bg: "var(--green-dim)",  border: "var(--green-border)"  },
  Starter:    { color: "var(--ink-soft)", bg: "var(--surface2)", border: "var(--border)"        },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [selected, setSelected] = useState<string[]>([]);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Add modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: "",
    email: "",
    role: "Viewer" as AccountRole,
    plan: "Starter" as AccountPlan,
  });

  // Edit modal
  const [editTarget, setEditTarget] = useState<Account | null>(null);
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    role: "Viewer" as AccountRole,
    plan: "Starter" as AccountPlan,
    status: "Active" as AccountStatus,
  });

  // ── Firestore real-time listener ──────────────────────────────────────────

  useEffect(() => {
    const q = query(collection(db, "accounts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: Account[] = snap.docs.map((d) => {
          const data = d.data();
          const createdAt = data.createdAt as Timestamp | null;
          return {
            id:        d.id,
            name:      data.name      as string,
            email:     data.email     as string,
            role:      (data.role     as AccountRole)   || "Viewer",
            status:    (data.status   as AccountStatus) || "Active",
            plan:      (data.plan     as AccountPlan)   || "Starter",
            joined:    createdAt ? fmt(createdAt.toDate()) : "—",
            createdAt: createdAt,
          };
        });
        setAccounts(docs);
        setLoading(false);
      },
      (err) => {
        console.error("Accounts snapshot error:", err);
        showToast("Failed to load accounts. Please refresh.", false);
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

  const filtered = accounts.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q);
    const matchRole = roleFilter === "All" || a.role === roleFilter;
    return matchSearch && matchRole;
  });

  const toggleSelect = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  // ── Add account ───────────────────────────────────────────────────────────

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccount.name || !newAccount.email) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "accounts"), {
        name:      newAccount.name.trim(),
        email:     newAccount.email.trim().toLowerCase(),
        role:      newAccount.role,
        plan:      newAccount.plan,
        status:    "Active" as AccountStatus,
        createdAt: serverTimestamp(),
      });
      setNewAccount({ name: "", email: "", role: "Viewer", plan: "Starter" });
      setIsAddOpen(false);
      showToast("Account created successfully", true);
    } catch (err) {
      console.error("Add account error:", err);
      showToast("Failed to create account. Please try again.", false);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit account ──────────────────────────────────────────────────────────

  const openEdit = (a: Account) => {
    setEditTarget(a);
    setEditData({ name: a.name, email: a.email, role: a.role, plan: a.plan, status: a.status });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, "accounts", editTarget.id), {
        name:   editData.name.trim(),
        email:  editData.email.trim().toLowerCase(),
        role:   editData.role,
        plan:   editData.plan,
        status: editData.status,
      });
      setEditTarget(null);
      showToast("Account updated successfully", true);
    } catch (err) {
      console.error("Edit account error:", err);
      showToast("Failed to update account.", false);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Suspend selected ──────────────────────────────────────────────────────

  const suspendSelected = async () => {
    try {
      await Promise.all(
        selected.map((id) =>
          updateDoc(doc(db, "accounts", id), { status: "Suspended" as AccountStatus })
        )
      );
      setSelected([]);
      showToast(`${selected.length} account(s) suspended`, true);
    } catch {
      showToast("Failed to suspend accounts.", false);
    }
  };

  // ── Delete selected ───────────────────────────────────────────────────────

  const deleteSelected = async () => {
    if (!confirm(`Delete ${selected.length} account(s)? This cannot be undone.`)) return;
    try {
      await Promise.all(selected.map((id) => deleteDoc(doc(db, "accounts", id))));
      setSelected([]);
      showToast(`${selected.length} account(s) deleted`, true);
    } catch {
      showToast("Failed to delete accounts.", false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <RoleGuard page="Accounts">
      <div className="font-mono text-ink">

        {/* Toast */}
        {toast && (
          <div
            className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl font-sans text-sm"
            style={{
              background:   toast.ok ? "var(--green-dim)" : "var(--red-dim)",
              borderColor:  toast.ok ? "var(--green-border)" : "var(--red)",
              color:        toast.ok ? "var(--green)" : "var(--red)",
            }}
          >
            {toast.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row flex-wrap justify-between items-start gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tighter text-ink">
              Accounts
            </h1>
            <div className="flex items-center gap-2 sm:gap-3 mt-2">
              <div className="h-px w-5 sm:w-7 bg-green rounded" />
              <p className="text-ink-muted text-xs sm:text-sm font-light">
                {accounts.length} total · {accounts.filter((a) => a.status === "Active").length} active
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-orange hover:opacity-90 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
          >
            + Add Account
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center mb-4 sm:mb-6">
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-surface border border-border text-ink px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm w-full sm:w-72 focus:border-orange outline-none transition-colors font-mono placeholder:text-ink-dim"
          />
          <div className="flex gap-2 flex-wrap">
            {["All", ...ROLES].map((r) => (
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
              <button
                onClick={suspendSelected}
                className="flex-1 sm:flex-none px-4 sm:px-5 py-2 text-xs sm:text-sm border border-border bg-surface2 hover:border-orange-border hover:text-orange rounded-xl transition-all"
              >
                Suspend ({selected.length})
              </button>
              <button
                onClick={deleteSelected}
                className="flex-1 sm:flex-none px-4 sm:px-5 py-2 text-xs sm:text-sm border border-red text-red hover:bg-red-dim rounded-xl transition-all"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-surface border border-border rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Table — Desktop */}
        {!loading && (
          <div className="hidden md:block bg-surface border border-border rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface2">
                  {["", "Name", "Role", "Plan", "Status", "Joined", ""].map((h, i) => (
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
                {filtered.map((a) => {
                  const sc = statusColor[a.status];
                  const pc = planColor[a.plan];
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
                        <button
                          onClick={() => openEdit(a)}
                          className="flex items-center gap-1.5 px-4 py-1.5 text-xs border border-border bg-surface2 hover:border-orange-border hover:text-orange rounded-lg transition-all"
                        >
                          <Pencil size={11} />
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
        )}

        {/* Cards — Mobile */}
        {!loading && (
          <div className="md:hidden space-y-3">
            {filtered.map((a) => {
              const sc = statusColor[a.status];
              const pc = planColor[a.plan];
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
                    <button
                      onClick={() => openEdit(a)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border bg-surface2 hover:border-orange-border hover:text-orange rounded-lg transition-all"
                    >
                      <Pencil size={11} />
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
        )}

        {/* ── Add Account Modal ── */}
        {isAddOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
              <h2 className="font-serif text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-ink">
                Add New Account
              </h2>
              <form onSubmit={handleAdd} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">
                    Full Name / Company
                  </label>
                  <input
                    type="text"
                    required
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none transition-colors"
                    placeholder="John Doe or Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={newAccount.email}
                    onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none transition-colors"
                    placeholder="name@company.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">
                      Role
                    </label>
                    <select
                      value={newAccount.role}
                      onChange={(e) => setNewAccount({ ...newAccount, role: e.target.value as AccountRole })}
                      className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none transition-colors"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">
                      Plan
                    </label>
                    <select
                      value={newAccount.plan}
                      onChange={(e) => setNewAccount({ ...newAccount, plan: e.target.value as AccountPlan })}
                      className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none transition-colors"
                    >
                      {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsAddOpen(false); setNewAccount({ name: "", email: "", role: "Viewer", plan: "Starter" }); }}
                    disabled={submitting}
                    className="px-5 sm:px-6 py-2.5 border border-border bg-surface2 hover:bg-surface rounded-xl text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 sm:px-8 py-2.5 bg-orange hover:opacity-90 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating…
                      </>
                    ) : "Add Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Edit Account Modal ── */}
        {editTarget && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
              <h2 className="font-serif text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-ink">
                Edit Account
              </h2>
              <form onSubmit={handleEdit} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">
                    Full Name / Company
                  </label>
                  <input
                    type="text"
                    required
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widests text-ink-muted mb-2">
                      Role
                    </label>
                    <select
                      value={editData.role}
                      onChange={(e) => setEditData({ ...editData, role: e.target.value as AccountRole })}
                      className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none transition-colors"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">
                      Plan
                    </label>
                    <select
                      value={editData.plan}
                      onChange={(e) => setEditData({ ...editData, plan: e.target.value as AccountPlan })}
                      className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none transition-colors"
                    >
                      {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">
                    Status
                  </label>
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value as AccountStatus })}
                    className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none transition-colors"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setEditTarget(null)}
                    disabled={submitting}
                    className="px-5 sm:px-6 py-2.5 border border-border bg-surface2 hover:bg-surface rounded-xl text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 sm:px-8 py-2.5 bg-orange hover:opacity-90 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving…
                      </>
                    ) : "Save Changes"}
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