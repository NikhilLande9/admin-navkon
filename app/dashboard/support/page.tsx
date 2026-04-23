// app/dashboard/support/page.tsx
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
  LifeBuoy, Plus, Trash2, Pencil, Check, X,
  Search, CheckCircle2, XCircle, Loader2, MessageSquare,
} from "lucide-react";

type TicketStatus   = "Open" | "In Progress" | "Resolved" | "Closed";
type TicketPriority = "Low" | "Medium" | "High" | "Urgent";

type Ticket = {
  id: string; subject: string; requester: string; email: string;
  priority: TicketPriority; status: TicketStatus;
  description: string; assignee: string;
  createdAt: { seconds: number } | null;
};

const STATUS_STYLE: Record<TicketStatus, { bg: string; text: string; border: string }> = {
  Open:        { bg: "var(--blue-dim)",  text: "var(--blue)",    border: "var(--blue-border)"  },
  "In Progress":{ bg: "var(--surface2)", text: "var(--orange)",  border: "var(--orange)"       },
  Resolved:    { bg: "var(--green-dim)", text: "var(--green)",   border: "var(--green-border)" },
  Closed:      { bg: "var(--surface2)",  text: "var(--ink-dim)", border: "var(--border)"       },
};

const PRIORITY_STYLE: Record<TicketPriority, { text: string }> = {
  Low:    { text: "var(--ink-dim)" },
  Medium: { text: "var(--blue)"   },
  High:   { text: "var(--orange)" },
  Urgent: { text: "var(--red)"    },
};

type TicketForm = {
  subject: string; requester: string; email: string;
  priority: TicketPriority; status: TicketStatus;
  description: string; assignee: string;
};
const EMPTY: TicketForm = {
  subject: "", requester: "", email: "", priority: "Medium",
  status: "Open", description: "", assignee: "",
};

export default function SupportPage() {
  const { user } = useAuth();
  const [tickets,  setTickets]  = useState<Ticket[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState<TicketForm>(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const q = query(collection(db, "support"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setTickets(snap.docs.map((d) => ({
        id: d.id,
        subject:     d.data().subject     || "",
        requester:   d.data().requester   || "",
        email:       d.data().email       || "",
        priority:    (d.data().priority as TicketPriority) || "Medium",
        status:      (d.data().status   as TicketStatus)   || "Open",
        description: d.data().description || "",
        assignee:    d.data().assignee    || "",
        createdAt:   d.data().createdAt   || null,
      })));
      setLoading(false);
    });
  }, []);

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.requester.trim()) {
      showToast("Subject and requester name are required", false); return;
    }
    setSaving(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "support", editId), { ...form });
        showToast("Ticket updated", true);
      } else {
        await addDoc(collection(db, "support"), {
          ...form, createdBy: user?.email ?? "", createdAt: serverTimestamp(),
        });
        showToast("Ticket created", true);
      }
      setForm(EMPTY); setShowForm(false); setEditId(null);
    } catch (err) { console.error(err); showToast("Failed to save ticket", false); }
    finally { setSaving(false); }
  };

  const handleEdit = (t: Ticket) => {
    setForm({
      subject: t.subject, requester: t.requester, email: t.email,
      priority: t.priority, status: t.status, description: t.description, assignee: t.assignee,
    });
    setEditId(t.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ticket?")) return;
    setDeleting(id);
    try { await deleteDoc(doc(db, "support", id)); showToast("Ticket deleted", true); }
    catch (err) { console.error(err); showToast("Failed to delete ticket", false); }
    finally { setDeleting(null); }
  };

  // Quick status cycle
  const cycleStatus = async (t: Ticket) => {
    const cycle: TicketStatus[] = ["Open", "In Progress", "Resolved", "Closed"];
    const next = cycle[(cycle.indexOf(t.status) + 1) % cycle.length];
    try { await updateDoc(doc(db, "support", t.id), { status: next }); }
    catch (err) { console.error(err); }
  };

  const filtered = tickets.filter((t) =>
    [t.subject, t.requester, t.email, t.assignee].some((v) =>
      v.toLowerCase().includes(search.toLowerCase())
    )
  );

  const statuses:   TicketStatus[]   = ["Open", "In Progress", "Resolved", "Closed"];
  const priorities: TicketPriority[] = ["Low", "Medium", "High", "Urgent"];

  return (
    <RoleGuard page="Support">
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
            <LifeBuoy size={24} className="text-orange" strokeWidth={1.75} />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tighter text-ink">Support</h1>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-px w-6 sm:w-8 bg-orange rounded" />
            <p className="text-ink-muted text-xs sm:text-sm font-light">Track support tickets and helpdesk requests</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {statuses.map((s) => {
            const st = STATUS_STYLE[s];
            return (
              <div key={s} className="bg-surface border border-border rounded-xl p-4">
                <div className="text-2xl font-serif font-bold text-ink">
                  {tickets.filter((t) => t.status === s).length}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: st.text }}>{s}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim" />
            <input type="text" placeholder="Search by subject, requester or assignee…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-sans text-ink placeholder:text-ink-ghost focus:border-orange outline-none transition-colors" />
          </div>
          <button onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange hover:opacity-90 text-white rounded-xl text-xs font-mono transition-all shadow-lg shadow-orange/20 shrink-0">
            <Plus size={14} /> New Ticket
          </button>
        </div>

        {showForm && (
          <div className="bg-surface border border-border rounded-2xl p-5 mb-5">
            <h2 className="font-serif text-base font-semibold text-ink mb-4">{editId ? "Edit Ticket" : "New Ticket"}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <input placeholder="Subject" value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm font-sans text-ink placeholder:text-ink-ghost focus:border-orange outline-none transition-colors sm:col-span-2" />
              <input placeholder="Requester Name" value={form.requester}
                onChange={(e) => setForm({ ...form, requester: e.target.value })}
                className="px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm font-sans text-ink placeholder:text-ink-ghost focus:border-orange outline-none transition-colors" />
              <input type="email" placeholder="Requester Email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm font-sans text-ink placeholder:text-ink-ghost focus:border-orange outline-none transition-colors" />
              <input placeholder="Assignee (optional)" value={form.assignee}
                onChange={(e) => setForm({ ...form, assignee: e.target.value })}
                className="px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm font-sans text-ink placeholder:text-ink-ghost focus:border-orange outline-none transition-colors" />
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TicketPriority })}
                className="px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm font-sans text-ink focus:border-orange outline-none transition-colors">
                {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TicketStatus })}
                className="px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm font-sans text-ink focus:border-orange outline-none transition-colors">
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <textarea placeholder="Description (optional)" value={form.description} rows={3}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm font-sans text-ink placeholder:text-ink-ghost focus:border-orange outline-none transition-colors resize-none sm:col-span-2" />
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
              <Loader2 size={18} className="animate-spin text-orange" /> Loading tickets…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-ink-ghost text-sm font-sans">
              {search ? "No tickets match your search." : "No support tickets yet. Create one above."}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((t) => {
                const st = STATUS_STYLE[t.status];
                const pr = PRIORITY_STYLE[t.priority];
                const isOpen = expanded === t.id;
                return (
                  <div key={t.id} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <button onClick={() => setExpanded(isOpen ? null : t.id)}
                        className="mt-0.5 shrink-0 text-ink-dim hover:text-orange transition-colors">
                        <MessageSquare size={15} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-sans font-medium text-ink truncate">{t.subject}</span>
                          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border"
                            style={{ background: st.bg, color: st.text, borderColor: st.border }}>{t.status}</span>
                          <span className="text-[10px] font-mono" style={{ color: pr.text }}>{t.priority}</span>
                        </div>
                        <div className="text-xs font-sans text-ink-muted mt-0.5">
                          {t.requester}{t.email ? ` · ${t.email}` : ""}{t.assignee ? ` · Assigned: ${t.assignee}` : ""}
                        </div>
                        {isOpen && t.description && (
                          <p className="text-xs font-sans text-ink-muted mt-2 leading-relaxed whitespace-pre-wrap">
                            {t.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => cycleStatus(t)}
                          title="Advance status"
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:border-orange-border hover:text-orange text-ink-dim transition-all text-[10px] font-mono">
                          ↻
                        </button>
                        <button onClick={() => handleEdit(t)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:border-orange-border hover:text-orange text-ink-dim transition-all">
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => handleDelete(t.id)} disabled={deleting === t.id}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:border-red hover:text-red text-ink-dim transition-all disabled:opacity-50">
                          {deleting === t.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {!loading && (
          <p className="text-[10px] font-mono text-ink-ghost mt-3 text-right">
            {filtered.length} of {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </RoleGuard>
  );
}