// app/dashboard/team/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import RoleGuard from "@/components/auth/RoleGuard";
import { useAuth, useRole } from "@/components/providers/AppProviders";
import {
  UsersRound, Plus, Trash2, Pencil, Check, X,
  Search, CheckCircle2, XCircle, Loader2, Mail,
} from "lucide-react";

type Status = "Active" | "Inactive";

type TeamMember = {
  id: string; name: string; email: string;
  role: string; department: string; status: Status;
  createdAt: { seconds: number } | null;
};

const STATUS_STYLE: Record<Status, { bg: string; text: string; border: string }> = {
  Active:   { bg: "var(--green-dim)",  text: "var(--green)",   border: "var(--green-border)" },
  Inactive: { bg: "var(--surface2)",   text: "var(--ink-dim)", border: "var(--border)"       },
};

// ✅ Fix: explicit Status type so select cast is valid
type MemberForm = { name: string; email: string; role: string; department: string; status: Status };
const EMPTY: MemberForm = { name: "", email: "", role: "", department: "", status: "Active" };

export default function TeamPage() {
  const { user } = useAuth();
  const { allRoles } = useRole();
  const [members,  setMembers]  = useState<TeamMember[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState<MemberForm>(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const q = query(collection(db, "team"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setMembers(snap.docs.map((d) => ({
        id: d.id, name: d.data().name || "", email: d.data().email || "",
        role: d.data().role || "", department: d.data().department || "",
        status: (d.data().status as Status) || "Active", createdAt: d.data().createdAt || null,
      })));
      setLoading(false);
    });
  }, []);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) { showToast("Name and email are required", false); return; }
    setSaving(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "team", editId), { ...form });
        showToast("Member updated", true);
      } else {
        await addDoc(collection(db, "team"), { ...form, invitedBy: user?.email ?? "", createdAt: serverTimestamp() });
        showToast("Member added", true);
      }
      setForm(EMPTY); setShowForm(false); setEditId(null);
    } catch (err) { console.error(err); showToast("Failed to save", false); }
    finally { setSaving(false); }
  };

  const handleEdit = (m: TeamMember) => {
    setForm({ name: m.name, email: m.email, role: m.role, department: m.department, status: m.status });
    setEditId(m.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this team member?")) return;
    setDeleting(id);
    try { await deleteDoc(doc(db, "team", id)); showToast("Member removed", true); }
    catch (err) { console.error(err); showToast("Failed to remove member", false); }
    finally { setDeleting(null); }
  };

  const filtered = members.filter((m) =>
    [m.name, m.email, m.role, m.department].some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <RoleGuard page="Team">
      <div className="font-mono text-ink">

        {toast && (
          <div className="fixed z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl font-sans text-sm
                         bottom-6 left-4 right-4 sm:bottom-auto sm:top-6 sm:left-auto sm:right-6 sm:w-auto"
            style={{ background: toast.ok ? "var(--green-dim)" : "var(--red-dim)", borderColor: toast.ok ? "var(--green-border)" : "var(--red)", color: toast.ok ? "var(--green)" : "var(--red)" }}>
            {toast.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />} {toast.msg}
          </div>
        )}

        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-1">
            <UsersRound size={24} className="text-orange" strokeWidth={1.75} />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tighter text-ink">Team</h1>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-px w-6 sm:w-8 bg-orange rounded" />
            <p className="text-ink-muted text-xs sm:text-sm font-light">Manage staff, departments, and invites</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Members", value: members.length },
            { label: "Active",        value: members.filter((m) => m.status === "Active").length },
            { label: "Inactive",      value: members.filter((m) => m.status === "Inactive").length },
            { label: "Departments",   value: new Set(members.map((m) => m.department).filter(Boolean)).size },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface border border-border rounded-xl p-4">
              <div className="text-2xl font-serif font-bold text-ink">{value}</div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-ink-ghost mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim" />
            <input type="text" placeholder="Search by name, email, role or department…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-sans text-ink placeholder:text-ink-ghost focus:border-orange outline-none transition-colors" />
          </div>
          <button onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange hover:opacity-90 text-white rounded-xl text-xs font-mono transition-all shadow-lg shadow-orange/20 shrink-0">
            <Plus size={14} /> Add Member
          </button>
        </div>

        {showForm && (
          <div className="bg-surface border border-border rounded-2xl p-5 mb-5">
            <h2 className="font-serif text-base font-semibold text-ink mb-4">{editId ? "Edit Member" : "New Member"}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <input placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm font-sans text-ink placeholder:text-ink-ghost focus:border-orange outline-none transition-colors" />
              <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm font-sans text-ink placeholder:text-ink-ghost focus:border-orange outline-none transition-colors" />
              <input placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm font-sans text-ink placeholder:text-ink-ghost focus:border-orange outline-none transition-colors" />
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm font-sans text-ink focus:border-orange outline-none transition-colors">
                <option value="">Select Role</option>
                {allRoles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {/* ✅ Fix: cast to Status (the named union type) */}
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                className="px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm font-sans text-ink focus:border-orange outline-none transition-colors">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSubmit} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-orange hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-xs font-mono transition-all">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                {saving ? "Saving…" : editId ? "Update" : "Save"}
              </button>
              <button onClick={() => { setForm(EMPTY); setShowForm(false); setEditId(null); }}
                className="flex items-center gap-2 px-4 py-2 border border-border bg-surface2 hover:border-orange-border text-ink-muted hover:text-orange rounded-xl text-xs font-mono transition-all">
                <X size={13} /> Cancel
              </button>
            </div>
          </div>
        )}

        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-ink-muted text-sm font-sans">
              <Loader2 size={18} className="animate-spin text-orange" /> Loading team…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-ink-ghost text-sm font-sans">
              {search ? "No members match your search." : "No team members yet. Add one above."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: 600 }}>
                <thead>
                  <tr className="bg-surface2 border-b border-border">
                    {["Name", "Email", "Department", "Role", "Status", ""].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left text-[10px] uppercase tracking-widest font-normal text-ink-dim">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => {
                    const s = STATUS_STYLE[m.status];
                    return (
                      <tr key={m.id} className={`border-b border-border last:border-none ${i % 2 === 0 ? "bg-surface" : "bg-surface2/40"}`}>
                        <td className="px-5 py-3.5 text-sm font-sans font-medium text-ink">{m.name}</td>
                        <td className="px-5 py-3.5 text-sm font-sans text-ink-muted">
                          <a href={`mailto:${m.email}`} className="flex items-center gap-1.5 hover:text-orange transition-colors">
                            <Mail size={12} /> {m.email}
                          </a>
                        </td>
                        <td className="px-5 py-3.5 text-sm font-sans text-ink-muted">{m.department || "—"}</td>
                        <td className="px-5 py-3.5 text-sm font-mono text-ink-muted">{m.role || "—"}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border"
                            style={{ background: s.bg, color: s.text, borderColor: s.border }}>{m.status}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2 justify-end">
                            <button onClick={() => handleEdit(m)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:border-orange-border hover:text-orange text-ink-dim transition-all">
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => handleDelete(m.id)} disabled={deleting === m.id}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:border-red hover:text-red text-ink-dim transition-all disabled:opacity-50">
                              {deleting === m.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {!loading && (
          <p className="text-[10px] font-mono text-ink-ghost mt-3 text-right">
            {filtered.length} of {members.length} member{members.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </RoleGuard>
  );
}