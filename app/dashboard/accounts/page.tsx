export default function AccountsPage() {
  return (
    <div className="bg-surface p-6 rounded shadow">
      <h2 className="text-xl font-semibold text-primary mb-4">
        Accounts Management
      </h2>

      <p className="text-muted mb-6">
        Manage users, roles, and account details.
      </p>

      <div className="border border-muted rounded p-4">
        No accounts available yet.
      </div>
    </div>
  );
}