export default function ServicesPage() {
  return (
    <div className="bg-surface p-6 rounded shadow">
      <h2 className="text-xl font-semibold text-primary mb-4">
        Services Overview
      </h2>

      <p className="text-muted mb-6">
        Monitor and manage active services.
      </p>

      <div className="border border-muted rounded p-4">
        No services configured yet.
      </div>
    </div>
  );
}