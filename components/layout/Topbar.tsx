"use client";

export default function Topbar() {
  return (
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
  );
}