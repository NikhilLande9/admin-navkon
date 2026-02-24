export default function Dashboard() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-black text-white p-5">
        <h2 className="text-xl font-bold mb-8">Navkon Admin</h2>
        <ul className="space-y-4">
          <li>Dashboard</li>
          <li>Accounts</li>
          <li>Billing</li>
          <li>Services</li>
        </ul>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 bg-white shadow flex items-center justify-between px-6">
          <h1 className="font-semibold">Dashboard</h1>
          <button
            onClick={() => {
              localStorage.removeItem("isLoggedIn");
              window.location.href = "/login";
            }}
            className="text-red-500"
          >
            Logout
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 bg-gray-100">
          <div className="bg-white p-6 rounded shadow">
            Welcome to Navkon Admin Panel 🚀
          </div>
        </main>
      </div>
    </div>
  );
}