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
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);

  const [newInvoice, setNewInvoice] = useState({
    account: "",
    email: "",
    amount: "",
    dueDate: "",
  });

  const filtered = invoiceList.filter(
    (inv) => statusFilter === "All" || inv.status === statusFilter
  );

  const markPaid = (id: string) => {
    setInvoiceList((list) =>
      list.map((inv) => (inv.id === id ? { ...inv, status: "Paid" } : inv))
    );
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newInvoice.account || !newInvoice.email || !newInvoice.amount || !newInvoice.dueDate) {
      return;
    }

    const today = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date());

    const dueFormatted = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(newInvoice.dueDate));

    const invoice: Invoice = {
      id: `#${String(1000 + invoiceList.length + 1)}`,
      account: newInvoice.account.trim(),
      email: newInvoice.email.trim().toLowerCase(),
      amount: `$${parseFloat(newInvoice.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      date: today,
      due: dueFormatted,
      status: "Pending",
    };

    setInvoiceList((prev) => [invoice, ...prev]);
    setNewInvoice({ account: "", email: "", amount: "", dueDate: "" });
    setIsNewInvoiceModalOpen(false);
  };

  const statusStyle: Record<string, { bg: string; text: string }> = {
    Paid: { bg: "var(--green-dim)", text: "var(--green)" },
    Pending: { bg: "var(--orange-dim)", text: "var(--orange)" },
    Overdue: { bg: "var(--red-dim)", text: "var(--red)" },
  };

  // Calculate summary dynamically
  const totalBilled = invoiceList.reduce((sum, inv) => {
    const amt = parseFloat(inv.amount.replace(/[$,]/g, "")) || 0;
    return sum + amt;
  }, 0);

  const collected = invoiceList
    .filter((inv) => inv.status === "Paid")
    .reduce((sum, inv) => {
      const amt = parseFloat(inv.amount.replace(/[$,]/g, "")) || 0;
      return sum + amt;
    }, 0);

  const pending = invoiceList
    .filter((inv) => inv.status === "Pending")
    .reduce((sum, inv) => {
      const amt = parseFloat(inv.amount.replace(/[$,]/g, "")) || 0;
      return sum + amt;
    }, 0);

  const overdue = invoiceList
    .filter((inv) => inv.status === "Overdue")
    .reduce((sum, inv) => {
      const amt = parseFloat(inv.amount.replace(/[$,]/g, "")) || 0;
      return sum + amt;
    }, 0);

  const summary = [
    { label: "Total Billed", value: `$${totalBilled.toLocaleString()}`, icon: "💳", colorVar: "var(--ink-soft)" },
    { label: "Collected", value: `$${collected.toLocaleString()}`, icon: "✅", colorVar: "var(--green)" },
    { label: "Pending", value: `$${pending.toLocaleString()}`, icon: "⏳", colorVar: "var(--orange)" },
    { label: "Overdue", value: `$${overdue.toLocaleString()}`, icon: "⚠️", colorVar: "var(--red)" },
  ];

  return (
    <div className="font-mono text-ink">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tighter text-ink">
            Billing
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="h-0.5 w-7 bg-green rounded" />
            <p className="text-ink-muted text-sm font-light">
              Invoices, transactions & payment history
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="bg-orange hover:bg-orange/90 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2">
            ↓ Export CSV
          </button>
          <button
            onClick={() => setIsNewInvoiceModalOpen(true)}
            className="bg-orange hover:bg-orange/90 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
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
            className="bill-card bg-grad-card border border-border rounded-2xl p-6 flex items-center gap-5 hover:border-orange/50 transition-colors"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
              style={{
                background: i === 1 ? "var(--green-dim)" : i === 2 ? "var(--orange-dim)" : i === 3 ? "var(--red-dim)" : "var(--surface2)",
                border: `1px solid ${i === 1 ? "var(--green-border)" : i === 2 ? "var(--orange-border)" : i === 3 ? "var(--red-dim)" : "var(--border)"}`,
              }}
            >
              {s.icon}
            </div>
            <div>
              <div className="text-2xl font-semibold tracking-tighter font-serif text-ink" style={{ color: s.colorVar }}>
                {s.value}
              </div>
              <div className="text-xs uppercase tracking-widest text-ink-muted mt-1">
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
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

      {/* Invoice Table */}
      <div className="bg-grad-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface2">
              {["Invoice", "Account", "Amount", "Issue Date", "Due Date", "Status", "Actions"].map((h, i) => (
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
            {filtered.map((inv, i) => {
              const ss = statusStyle[inv.status];
              return (
                <tr
                  key={inv.id}
                  className="bill-row border-b border-border2 last:border-none hover:bg-surface2 transition-colors"
                >
                  <td className="px-6 py-5">
                    <span className="font-medium text-orange text-base font-mono">{inv.id}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm text-ink">{inv.account}</div>
                    <div className="text-xs text-ink-muted mt-0.5">{inv.email}</div>
                  </td>
                  <td className="px-6 py-5 font-medium text-ink text-base">{inv.amount}</td>
                  <td className="px-6 py-5 text-sm text-ink-muted">{inv.date}</td>
                  <td className="px-6 py-5 text-sm" style={{ color: inv.status === "Overdue" ? "var(--red)" : "var(--ink-muted)" }}>
                    {inv.due}
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className="inline-flex items-center gap-2 text-xs px-4 py-1 rounded-full border"
                      style={{
                        color: ss.text,
                        background: ss.bg,
                        border: `1px solid ${ss.text}40`,
                      }}
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
              : "No invoices match the selected filter."}
          </div>
        )}
      </div>

      {/* New Invoice Modal */}
      {isNewInvoiceModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-8">
            <h2 className="font-serif text-2xl font-bold mb-6 text-ink">Create New Invoice</h2>

            <form onSubmit={handleCreateInvoice} className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">
                  Account / Company Name
                </label>
                <input
                  type="text"
                  required
                  value={newInvoice.account}
                  onChange={(e) => setNewInvoice({ ...newInvoice, account: e.target.value })}
                  className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none"
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
                  className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none"
                  placeholder="contact@company.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-ink-muted mb-2">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none"
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
                    onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-orange outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsNewInvoiceModalOpen(false)}
                  className="px-6 py-2.5 border border-border bg-surface2 hover:bg-surface rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-orange hover:bg-orange/90 text-white rounded-xl text-sm font-medium transition-all"
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