//app\dashboard\billing\page.tsx
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
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import RoleGuard from "@/components/auth/RoleGuard";
import { CheckCircle2, XCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type InvoiceStatus = "Paid" | "Pending" | "Overdue";

type Invoice = {
  id: string;
  displayId: string;
  account: string;
  email: string;
  amountCents: number;
  date: string;
  due: string;
  dueRaw: Date;
  dateRaw: Date;
  status: InvoiceStatus;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALL_STATUSES = ["All", "Paid", "Pending", "Overdue"] as const;

const fmt = (d: Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);

const fmtUSD = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const [invoiceList, setInvoiceList] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newInvoice, setNewInvoice] = useState({
    account: "",
    email: "",
    amount: "",
    dueDate: "",
  });

  // ── Firestore real-time listener ──────────────────────────────────────────

  useEffect(() => {
    const q = query(collection(db, "invoices"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: Invoice[] = snap.docs.map((d) => {
          const data = d.data();
          const dateRaw = (data.date as Timestamp).toDate();
          const dueRaw  = (data.due  as Timestamp).toDate();
          return {
            id:          d.id,
            displayId:   data.displayId  as string,
            account:     data.account    as string,
            email:       data.email      as string,
            amountCents: data.amountCents as number,
            date:        fmt(dateRaw),
            due:         fmt(dueRaw),
            dateRaw,
            dueRaw,
            status:      data.status as InvoiceStatus,
          };
        });
        setInvoiceList(docs);
        setLoading(false);
      },
      (err) => {
        console.error("Billing snapshot error:", err);
        setError("Failed to load invoices. Please refresh.");
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

  // ── Create invoice ────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.account || !newInvoice.email || !newInvoice.amount || !newInvoice.dueDate) return;

    setSubmitting(true);
    try {
      // Generate sequential display ID based on total count
      const countSnap = await getDocs(collection(db, "invoices"));
      const nextNum   = 1001 + countSnap.size;
      const displayId = `#${nextNum}`;

      const amountCents = Math.round(parseFloat(newInvoice.amount) * 100);
      const dueDate     = new Date(newInvoice.dueDate);
      // Correct for timezone offset so "2025-08-01" doesn't become Jul 31
      dueDate.setMinutes(dueDate.getMinutes() + dueDate.getTimezoneOffset());

      await addDoc(collection(db, "invoices"), {
        displayId,
        account:     newInvoice.account.trim(),
        email:       newInvoice.email.trim().toLowerCase(),
        amountCents,
        date:        Timestamp.fromDate(new Date()),
        due:         Timestamp.fromDate(dueDate),
        status:      "Pending" as InvoiceStatus,
        createdAt:   serverTimestamp(),
      });

      setNewInvoice({ account: "", email: "", amount: "", dueDate: "" });
      setIsModalOpen(false);
      showToast("Invoice created successfully", true);
    } catch (err) {
      console.error("Failed to create invoice:", err);
      showToast("Could not create invoice. Please try again.", false);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Mark Paid ─────────────────────────────────────────────────────────────

  const markPaid = async (id: string) => {
    try {
      await updateDoc(doc(db, "invoices", id), { status: "Paid" as InvoiceStatus });
      showToast("Invoice marked as paid", true);
    } catch {
      showToast("Could not update invoice status.", false);
    }
  };

  // ── Export CSV ────────────────────────────────────────────────────────────

  const exportCSV = () => {
    const rows = [
      ["Invoice", "Account", "Email", "Amount", "Issue Date", "Due Date", "Status"],
      ...filtered.map((inv) => [
        inv.displayId,
        inv.account,
        inv.email,
        (inv.amountCents / 100).toFixed(2),
        inv.dateRaw.toISOString().split("T")[0],
        inv.dueRaw.toISOString().split("T")[0],
        inv.status,
      ]),
    ];
    const csv  = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `invoices-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const filtered = invoiceList.filter((inv) => {
    const matchStatus = statusFilter === "All" || inv.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      inv.account.toLowerCase().includes(q) ||
      inv.email.toLowerCase().includes(q) ||
      inv.displayId.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const sum = (status?: InvoiceStatus) =>
    invoiceList
      .filter((i) => !status || i.status === status)
      .reduce((s, i) => s + i.amountCents, 0);

  const summary = [
    { label: "Total Billed", value: fmtUSD(sum()),            icon: "💳", color: "var(--ink-soft)",  dimBg: "var(--surface2)",   dimBorder: "var(--border)"        },
    { label: "Collected",    value: fmtUSD(sum("Paid")),      icon: "✅", color: "var(--green)",     dimBg: "var(--green-dim)",  dimBorder: "var(--green-border)"  },
    { label: "Pending",      value: fmtUSD(sum("Pending")),   icon: "⏳", color: "var(--orange)",    dimBg: "var(--orange-dim)", dimBorder: "var(--orange-border)" },
    { label: "Overdue",      value: fmtUSD(sum("Overdue")),   icon: "⚠️", color: "var(--red)",       dimBg: "var(--red-dim)",    dimBorder: "var(--red)"           },
  ];

  const statusStyle: Record<InvoiceStatus, { bg: string; text: string }> = {
    Paid:    { bg: "var(--green-dim)",  text: "var(--green)"  },
    Pending: { bg: "var(--orange-dim)", text: "var(--orange)" },
    Overdue: { bg: "var(--red-dim)",    text: "var(--red)"    },
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <RoleGuard page="Billing">
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

        {/* Error banner */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-dim border border-red text-red text-sm flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-4 text-red hover:opacity-70">✕</button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row flex-wrap justify-between items-start gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tighter text-ink">
              Billing
            </h1>
            <div className="flex items-center gap-2 sm:gap-3 mt-2">
              <div className="h-px w-5 sm:w-7 bg-green rounded" />
              <p className="text-ink-muted text-xs sm:text-sm font-light">
                Invoices, transactions &amp; payment history
              </p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={exportCSV}
              disabled={filtered.length === 0}
              className="flex-1 sm:flex-none border border-border bg-surface2 hover:border-orange-border hover:text-orange disabled:opacity-40 disabled:cursor-not-allowed px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all"
            >
              ↓ Export CSV
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none bg-orange hover:opacity-90 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all"
            >
              + New Invoice
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {summary.map((s, i) => (
            <div
              key={i}
              className="bg-surface border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 hover:border-orange-border transition-colors"
            >
              <div
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-xl sm:text-2xl shrink-0 border"
                style={{ background: s.dimBg, borderColor: s.dimBorder }}
              >
                {s.icon}
              </div>
              <div>
                <div
                  className="text-xl sm:text-2xl font-semibold tracking-tighter font-serif"
                  style={{ color: s.color }}
                >
                  {loading ? (
                    <span className="inline-block w-16 h-6 bg-surface2 rounded animate-pulse" />
                  ) : s.value}
                </div>
                <div className="text-[10px] sm:text-xs uppercase tracking-widest text-ink-muted mt-1">
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center mb-4 sm:mb-6">
          <input
            type="text"
            placeholder="Search invoice, account, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-surface border border-border text-ink px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm w-full sm:w-72 focus:border-orange outline-none transition-colors font-mono placeholder:text-ink-dim"
          />
          <div className="flex gap-2 flex-wrap">
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-xl border transition-all ${
                  statusFilter === s
                    ? "bg-orange-dim border-orange text-orange"
                    : "bg-transparent border-border text-ink-muted hover:border-orange-border hover:text-orange"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-surface border border-border rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Invoice Table — Desktop */}
        {!loading && (
          <div className="hidden md:block bg-surface border border-border rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface2">
                  {["Invoice", "Account", "Amount", "Issue Date", "Due Date", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-left text-[10px] uppercase tracking-widest text-ink-muted font-mono font-normal"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const ss = statusStyle[inv.status];
                  return (
                    <tr key={inv.id} className="border-b border-border last:border-none hover:bg-surface2 transition-colors">
                      <td className="px-6 py-5 font-medium text-orange font-mono">{inv.displayId}</td>
                      <td className="px-6 py-5">
                        <div className="text-sm text-ink">{inv.account}</div>
                        <div className="text-xs text-ink-muted mt-0.5">{inv.email}</div>
                      </td>
                      <td className="px-6 py-5 font-semibold text-ink font-mono">{fmtUSD(inv.amountCents)}</td>
                      <td className="px-6 py-5 text-ink-muted text-sm">{inv.date}</td>
                      <td
                        className="px-6 py-5 text-sm"
                        style={{ color: inv.status === "Overdue" ? "var(--red)" : "var(--ink-muted)" }}
                      >
                        {inv.due}
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className="inline-flex items-center gap-1.5 text-[10px] px-3 py-1 rounded-full border font-mono uppercase tracking-wider"
                          style={{ color: ss.text, background: ss.bg, borderColor: `${ss.text}40` }}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex gap-2">
                          {inv.status !== "Paid" && (
                            <button
                              onClick={() => markPaid(inv.id)}
                              className="px-4 py-1.5 text-xs border border-green-border text-green hover:bg-green-dim rounded-lg transition-all"
                            >
                              Mark Paid
                            </button>
                          )}
                          <button className="px-4 py-1.5 text-xs border border-border hover:border-orange-border hover:text-orange rounded-lg transition-all">
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-20 text-center text-ink-ghost text-sm">
                {invoiceList.length === 0
                  ? "No invoices yet. Click '+ New Invoice' to create one."
                  : "No invoices match your search or filter."}
              </div>
            )}
          </div>
        )}

        {/* Invoice Cards — Mobile */}
        {!loading && (
          <div className="md:hidden space-y-3">
            {filtered.map((inv) => {
              const ss = statusStyle[inv.status];
              return (
                <div key={inv.id} className="bg-surface border border-border rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-medium text-orange text-base font-mono">{inv.displayId}</span>
                    <span
                      className="inline-flex items-center gap-1.5 text-[10px] px-3 py-1 rounded-full border"
                      style={{ color: ss.text, background: ss.bg, borderColor: `${ss.text}40` }}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <div className="mb-3">
                    <div className="text-sm text-ink font-medium">{inv.account}</div>
                    <div className="text-xs text-ink-muted mt-0.5">{inv.email}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3 pb-3 border-b border-border">
                    <div>
                      <div className="text-ink-ghost uppercase tracking-wider text-[10px]">Amount</div>
                      <div className="text-ink font-medium text-base">{fmtUSD(inv.amountCents)}</div>
                    </div>
                    <div>
                      <div className="text-ink-ghost uppercase tracking-wider text-[10px]">Issue Date</div>
                      <div className="text-ink-muted">{inv.date}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-ink-ghost uppercase tracking-wider text-[10px]">Due Date</div>
                      <div style={{ color: inv.status === "Overdue" ? "var(--red)" : "var(--ink-muted)" }}>
                        {inv.due}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {inv.status !== "Paid" && (
                      <button
                        onClick={() => markPaid(inv.id)}
                        className="flex-1 px-3 py-2 text-xs border border-green-border text-green hover:bg-green-dim rounded-lg transition-all"
                      >
                        Mark Paid
                      </button>
                    )}
                    <button className="flex-1 px-3 py-2 text-xs border border-border hover:border-orange-border hover:text-orange rounded-lg transition-all">
                      PDF
                    </button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-12 text-center text-ink-ghost text-sm bg-surface border border-border rounded-xl">
                {invoiceList.length === 0
                  ? "No invoices yet. Click '+ New Invoice' to create one."
                  : "No invoices match your search or filter."}
              </div>
            )}
          </div>
        )}

        <p className="mt-3 sm:mt-4 text-[9px] sm:text-[10px] text-ink-ghost font-mono tracking-wide">
          Invoices are currently issued without GST. Applicable GST will be charged upon registration. Minimum billing: 1 hour; increments: 30 min.
        </p>

        {/* New Invoice Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
              <h2 className="font-serif text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-ink">
                Create New Invoice
              </h2>
              <form onSubmit={handleCreate} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">
                    Account / Company Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newInvoice.account}
                    onChange={(e) => setNewInvoice({ ...newInvoice, account: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none transition-colors"
                    placeholder="Beta Corp or John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={newInvoice.email}
                    onChange={(e) => setNewInvoice({ ...newInvoice, email: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none transition-colors"
                    placeholder="contact@company.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={newInvoice.amount}
                      onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                      className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none transition-colors"
                      placeholder="1250.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      required
                      value={newInvoice.dueDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                      className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsModalOpen(false); setNewInvoice({ account: "", email: "", amount: "", dueDate: "" }); }}
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
                    ) : "Create Invoice"}
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