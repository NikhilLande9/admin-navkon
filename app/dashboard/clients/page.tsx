// app/dashboard/clients/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import RoleGuard from "@/components/auth/RoleGuard";
import { useAuth } from "@/components/providers/AppProviders";
import {
  Contact, Plus, Trash2, Pencil, Check, X,
  Search, CheckCircle2, XCircle, Loader2,
} from "lucide-react";

type Status = "Active" | "Inactive";

type Client = {
  id: string; name: string; email: string;
  phone: string; company: string; status: Status;
  createdAt: { seconds: number } | null;
};

const STATUS_STYLE: Record<Status, { bg: string; text: string; border: string }> = {
  Active:   { bg: "var(--green-dim)",  text: "var(--green)",   border: "var(--green-border)" },
  Inactive: { bg: "var(--surface2)",   text: "var(--ink-dim)", border: "var(--border)"       },
};

// ✅ Fix: explicit Status type on the form shape so the select cast is valid
type ClientForm = { name: string; email: string; phone: string; company: string; status: Status };
const EMPTY: ClientForm = { name: "", email: "", phone: "", company: "", status: "Active" };

export default function ClientsPage() {
  const { user } = useAuth();
  const [clients,  setClients]  = useState<Client[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState<ClientForm>(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const q = query(collection(db, "clients"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setClients(snap.docs.map((d) => ({
        id: d.id, name: d.data().name || "", email: d.data().email || "",
        phone: d.data().phone || "", company: d.data().company || "",
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
        await updateDoc(doc(db, "clients", editId), { ...form });
        showToast("Client updated", true);
      } else {
        await addDoc(collection(db, "clients"), { ...form, createdBy: user?.email ?? "", createdAt: serverTimestamp() });
        showToast("Client added", true);
      }
      setForm(EMPTY); setShowForm(false); setEditId(null);
    } catch (err) { console.error(err); showToast("Failed to save client", false); }
    finally { setSaving(false); }
  };

  const handleEdit = (c: Client) => {
    setForm({ name: c.name, email: c.email, phone: c.phone, company: c.company, status: c.status });
    setEditId(c.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this client?")) return;
    setDeleting(id);
    try { await deleteDoc(doc(db, "clients", id)); showToast("Client deleted", true); }
    catch (err) { console.error(err); showToast("Failed to delete client", false); }
    finally { setDeleting(null); }
  };

  const filtered = clients.filter((c) =>
    [c.name, c.email, c.company].some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <RoleGuard page="Clients">
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
            <Contact size={24} className="text-orange" strokeWidth={1.75} />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tighter text-ink">Clients</h1>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-px w-6 sm:w-8 bg-orange rounded" />
            <p className="text-ink-muted text-xs sm:text-sm font-light">Manage client profiles and contact details</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim" />
            <input type="text" placeholder="Search by name, email or company…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-sans text-ink placeholder:text-ink-ghost focus:border-orange outline-none transition-colors" />
          </div>
          <button onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange hover:opacity-90 text-white rounded-xl text-xs font-mono transition-all shadow-lg shadow-orange/20 shrink-0">
            <Plus size={14} /> Add Client
          </button>
        </div>

        {showForm && (
          <div className="bg-surface border border-border rounded-2xl p-5 mb-5">
            <h2 className="font-serif text-base font-semibold text-ink mb-4">{editId ? "Edit Client" : "New Client"}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {(["name", "email", "phone", "company"] as const).map((field) => (
                <input key={field} type={field === "email" ? "email" : "text"}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm font-sans text-ink placeholder:text-ink-ghost focus:border-orange outline-none transition-colors" />
              ))}
              {/* ✅ Fix: cast to Status (the named union type) instead of inline literal union */}
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
              <Loader2 size={18} className="animate-spin text-orange" /> Loading clients…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-ink-ghost text-sm font-sans">
              {search ? "No clients match your search." : "No clients yet. Add one above."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: 600 }}>
                <thead>
                  <tr className="bg-surface2 border-b border-border">
                    {["Name", "Email", "Phone", "Company", "Status", ""].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left text-[10px] uppercase tracking-widest font-normal text-ink-dim">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => {
                    const s = STATUS_STYLE[c.status];
                    return (
                      <tr key={c.id} className={`border-b border-border last:border-none ${i % 2 === 0 ? "bg-surface" : "bg-surface2/40"}`}>
                        <td className="px-5 py-3.5 text-sm font-sans font-medium text-ink">{c.name}</td>
                        <td className="px-5 py-3.5 text-sm font-sans text-ink-muted">{c.email}</td>
                        <td className="px-5 py-3.5 text-sm font-sans text-ink-muted">{c.phone || "—"}</td>
                        <td className="px-5 py-3.5 text-sm font-sans text-ink-muted">{c.company || "—"}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border"
                            style={{ background: s.bg, color: s.text, borderColor: s.border }}>{c.status}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2 justify-end">
                            <button onClick={() => handleEdit(c)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:border-orange-border hover:text-orange text-ink-dim transition-all">
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:border-red hover:text-red text-ink-dim transition-all disabled:opacity-50">
                              {deleting === c.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
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
            {filtered.length} of {clients.length} client{clients.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </RoleGuard>
  );
}