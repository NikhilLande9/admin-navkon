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

  // Form state for new invoice
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

  // Calculate summary on the fly
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
    <div style={{ fontFamily: "'DM Mono', 'Courier New', monospace", color: "var(--ink)" }}>
      <style>{`
        .bill-card {
          background: var(--grad-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px 24px;
          transition: border-color 0.2s;
        }
        .bill-row { transition: background 0.15s; }
        .bill-row:hover { background: var(--surface2) !important; }

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

        .pay-btn {
          background: transparent;
          border: 1px solid var(--green-border);
          color: var(--green);
          padding: 4px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 11px;
          font-family: inherit;
          transition: all 0.15s;
        }
        .pay-btn:hover { background: var(--green-dim); }

        .dl-btn {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--ink-muted);
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 11px;
          font-family: inherit;
          transition: all 0.15s;
        }
        .dl-btn:hover { border-color: var(--orange-border); color: var(--orange); }

        .export-btn, .add-btn {
          background: var(--orange);
          border: none;
          color: #fff;
          padding: 8px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-family: inherit;
          font-weight: 500;
          transition: opacity 0.15s;
        }
        .export-btn:hover, .add-btn:hover { opacity: 0.85; }

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
          max-width: 460px;
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
            Billing
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            <div style={{ height: 2, width: 28, background: "var(--green)", borderRadius: 1 }} />
            <p style={{ color: "var(--ink-muted)", fontSize: 13, margin: 0, fontWeight: 300 }}>
              Invoices, transactions & payment history
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="export-btn">↓ Export CSV</button>
          <button className="add-btn" onClick={() => setIsNewInvoiceModalOpen(true)}>
            + New Invoice
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {summary.map((s, i) => (
          <div key={i} className="bill-card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: i === 1 ? "var(--green-dim)" : i === 2 ? "var(--orange-dim)" : i === 3 ? "var(--red-dim)" : "var(--surface2)",
              border: `1px solid ${i === 1 ? "var(--green-border)" : i === 2 ? "var(--orange-border)" : i === 3 ? "var(--red-dim)" : "var(--border)"}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>
              {s.icon}
            </div>
            <div>
              <div style={{ 
                fontSize: 20, 
                fontWeight: 500, 
                color: s.colorVar, 
                fontFamily: "'Syne', sans-serif", 
                letterSpacing: "-0.5px" 
              }}>
                {s.value}
              </div>
              <div style={{ 
                fontSize: 10, 
                color: "var(--ink-muted)", 
                textTransform: "uppercase", 
                letterSpacing: "0.8px", 
                marginTop: 2 
              }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {allStatuses.map((s) => (
          <button 
            key={s} 
            className={`filter-btn ${statusFilter === s ? "active" : ""}`} 
            onClick={() => setStatusFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Invoice Table */}
      <div style={{ 
        background: "var(--grad-card)", 
        border: "1px solid var(--border)", 
        borderRadius: 12, 
        overflow: "hidden" 
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Invoice", "Account", "Amount", "Issue Date", "Due Date", "Status", "Actions"].map((h, i) => (
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
            {filtered.map((inv, i) => {
              const ss = statusStyle[inv.status];
              return (
                <tr 
                  key={inv.id} 
                  className="bill-row" 
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border2)" : "none" }}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontSize: 13, color: "var(--orange)", fontWeight: 500 }}>{inv.id}</span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: 13, color: "var(--ink)" }}>{inv.account}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>{inv.email}</div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 14, color: "var(--ink)", fontWeight: 500 }}>
                    {inv.amount}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--ink-muted)" }}>
                    {inv.date}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: inv.status === "Overdue" ? "var(--red)" : "var(--ink-muted)" }}>
                    {inv.due}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      fontSize: 11, 
                      color: ss.text, 
                      background: ss.bg,
                      padding: "3px 10px", 
                      borderRadius: 20,
                      border: `1px solid ${ss.text}40`,
                    }}>
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {inv.status !== "Paid" && (
                        <button className="pay-btn" onClick={() => markPaid(inv.id)}>
                          Mark Paid
                        </button>
                      )}
                      <button className="dl-btn">PDF</button>
                    </div>
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
            {invoiceList.length === 0 
              ? "No invoices yet. Click '+ New Invoice' to create one." 
              : "No invoices match the selected filter."}
          </div>
        )}
      </div>

      {/* New Invoice Modal */}
      {isNewInvoiceModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2 style={{ 
              margin: "0 0 24px 0", 
              fontFamily: "'Syne', sans-serif", 
              fontSize: 22, 
              fontWeight: 700 
            }}>
              Create New Invoice
            </h2>

            <form onSubmit={handleCreateInvoice}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "var(--ink-muted)" }}>
                  Account / Company Name
                </label>
                <input
                  type="text"
                  required
                  value={newInvoice.account}
                  onChange={(e) => setNewInvoice({ ...newInvoice, account: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    background: "var(--surface)",
                    color: "var(--ink)",
                    fontSize: 14,
                  }}
                  placeholder="Beta Corp or John Doe"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "var(--ink-muted)" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newInvoice.email}
                  onChange={(e) => setNewInvoice({ ...newInvoice, email: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    background: "var(--surface)",
                    color: "var(--ink)",
                    fontSize: 14,
                  }}
                  placeholder="contact@company.com"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "var(--ink-muted)" }}>
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      background: "var(--surface)",
                      color: "var(--ink)",
                      fontSize: 14,
                    }}
                    placeholder="1250.00"
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "var(--ink-muted)" }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newInvoice.dueDate}
                    onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      background: "var(--surface)",
                      color: "var(--ink)",
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setIsNewInvoiceModalOpen(false)}
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
                  className="add-btn"
                  style={{ padding: "10px 28px" }}
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