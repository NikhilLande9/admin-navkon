export default function BillingPage() {
  return (
    <div className="bg-surface p-6 rounded shadow">
      <h2 className="text-xl font-semibold text-primary mb-4">
        Billing & Payments
      </h2>

      <p className="text-muted mb-6">
        View invoices, transactions, and payment history.
      </p>

      <div className="border border-muted rounded p-4">
        No billing records available yet.
      </div>
    </div>
  );
}