"use client";

import { useState } from "react";

type Invoice = {
  id: string;
  account: string;
  email: string;
  amount: string;
  date: string;
  due: string;
  status: "Paid" | "Pending" | "Overdue";
};

const allStatuses = ["All", "Paid", "Pending", "Overdue"];

export default function BillingPage() {
  const [invoiceList, setInvoiceList] = useState<Invoice[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);

  const [newInvoice, setNewInvoice] = useState({
    account: "",
    email: "",
    amount: "",
    dueDate: "",
  });

  const filtered = invoiceList.filter((inv) => {
    const matchStatus = statusFilter === "All" || inv.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      inv.account.toLowerCase().includes(q) ||
      inv.email.toLowerCase().includes(q) ||
      inv.id.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const markPaid = (id: string) => {
    setInvoiceList((list) =>
      list.map((inv) => (inv.id === id ? { ...inv, status: "Paid" } : inv))
    );
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.account || !newInvoice.email || !newInvoice.amount || !newInvoice.dueDate) return;

    const fmt = (d: Date) =>
      new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);

    const invoice: Invoice = {
      id: `#${String(1000 + invoiceList.length + 1)}`,
      account: newInvoice.account.trim(),
      email: newInvoice.email.trim().toLowerCase(),
      amount: `$${parseFloat(newInvoice.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      date: fmt(new Date()),
      due: fmt(new Date(newInvoice.dueDate)),
      status: "Pending",
    };

    setInvoiceList((prev) => [invoice, ...prev]);
    setNewInvoice({ account: "", email: "", amount: "", dueDate: "" });
    setIsNewInvoiceModalOpen(false);
  };

  const statusStyle: Record<string, { bg: string; text: string }> = {
    Paid:    { bg: "var(--green-dim)",  text: "var(--green)"  },
    Pending: { bg: "var(--orange-dim)", text: "var(--orange)" },
    Overdue: { bg: "var(--red-dim)",    text: "var(--red)"    },
  };

  const totalBilled  = invoiceList.reduce((s, i) => s + parseFloat(i.amount.replace(/[$,]/g, "")) || 0, 0);
  const collected    = invoiceList.filter(i => i.status === "Paid").reduce((s, i) => s + parseFloat(i.amount.replace(/[$,]/g, "")) || 0, 0);
  const pending      = invoiceList.filter(i => i.status === "Pending").reduce((s, i) => s + parseFloat(i.amount.replace(/[$,]/g, "")) || 0, 0);
  const overdue      = invoiceList.filter(i => i.status === "Overdue").reduce((s, i) => s + parseFloat(i.amount.replace(/[$,]/g, "")) || 0, 0);

  const summary = [
    { label: "Total Billed", value: `$${totalBilled.toLocaleString()}`, icon: "💳", color: "var(--ink-soft)", dimBg: "var(--surface2)", dimBorder: "var(--border)" },
    { label: "Collected",    value: `$${collected.toLocaleString()}`,   icon: "✅", color: "var(--green)",    dimBg: "var(--green-dim)", dimBorder: "var(--green-border)" },
    { label: "Pending",      value: `$${pending.toLocaleString()}`,     icon: "⏳", color: "var(--orange)",   dimBg: "var(--orange-dim)", dimBorder: "var(--orange-border)" },
    { label: "Overdue",      value: `$${overdue.toLocaleString()}`,     icon: "⚠️", color: "var(--red)",      dimBg: "var(--red-dim)", dimBorder: "var(--red)" },
  ];

  return (
    <div className="font-mono text-ink">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tighter text-ink">Billing</h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="h-px w-7 bg-green rounded" />
            <p className="text-ink-muted text-sm font-light">Invoices, transactions &amp; payment history</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="bg-orange hover:opacity-90 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2">
            ↓ Export CSV
          </button>
          <button
            onClick={() => setIsNewInvoiceModalOpen(true)}
            className="bg-orange hover:opacity-90 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
          >
            + New Invoice
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summary.map((s, i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-2xl p-6 flex items-center gap-5 hover:border-orange-border transition-colors"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 border"
              style={{ background: s.dimBg, borderColor: s.dimBorder }}
            >
              {s.icon}
            </div>
            <div>
              <div className="text-2xl font-semibold tracking-tighter font-serif" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-xs uppercase tracking-widest text-ink-muted mt-1">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <input
          type="text"
          placeholder="Search invoice, account, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-surface border border-border text-ink px-4 py-2.5 rounded-xl text-sm w-72 focus:border-orange outline-none transition-colors font-mono placeholder:text-ink-dim"
        />
        <div className="flex gap-2 flex-wrap">
          {allStatuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-5 py-2 text-sm font-medium rounded-xl border transition-all ${
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

      {/* Invoice Table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface2">
              {["Invoice", "Account", "Amount", "Issue Date", "Due Date", "Status", "Actions"].map((h) => (
                <th key={h} className="px-6 py-4 text-left text-xs uppercase tracking-widest font-normal text-ink-dim">
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
                  <td className="px-6 py-5">
                    <span className="font-medium text-orange text-base font-mono">{inv.id}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm text-ink">{inv.account}</div>
                    <div className="text-xs text-ink-muted mt-0.5">{inv.email}</div>
                  </td>
                  <td className="px-6 py-5 font-medium text-ink text-base">{inv.amount}</td>
                  <td className="px-6 py-5 text-sm text-ink-muted">{inv.date}</td>
                  <td
                    className="px-6 py-5 text-sm"
                    style={{ color: inv.status === "Overdue" ? "var(--red)" : "var(--ink-muted)" }}
                  >
                    {inv.due}
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className="inline-flex items-center gap-2 text-xs px-4 py-1 rounded-full border"
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

      {/* GST note */}
      <p className="mt-4 text-[10px] text-ink-ghost font-mono tracking-wide">
        Invoices are currently issued without GST. Applicable GST will be charged upon registration. Minimum billing: 1 hour; increments: 30 min.
      </p>

      {/* New Invoice Modal */}
      {isNewInvoiceModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-8">
            <h2 className="font-serif text-2xl font-bold mb-6 text-ink">Create New Invoice</h2>
            <form onSubmit={handleCreateInvoice} className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">Account / Company Name</label>
                <input
                  type="text" required value={newInvoice.account}
                  onChange={(e) => setNewInvoice({ ...newInvoice, account: e.target.value })}
                  className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none transition-colors"
                  placeholder="Beta Corp or John Doe"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">Email Address</label>
                <input
                  type="email" required value={newInvoice.email}
                  onChange={(e) => setNewInvoice({ ...newInvoice, email: e.target.value })}
                  className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none transition-colors"
                  placeholder="contact@company.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">Amount ($)</label>
                  <input
                    type="number" required step="0.01" value={newInvoice.amount}
                    onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none transition-colors"
                    placeholder="1250.00"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">Due Date</label>
                  <input
                    type="date" required value={newInvoice.dueDate}
                    onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button" onClick={() => setIsNewInvoiceModalOpen(false)}
                  className="px-6 py-2.5 border border-border bg-surface2 hover:bg-surface rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-orange hover:opacity-90 text-white rounded-xl text-sm font-medium transition-all"
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}