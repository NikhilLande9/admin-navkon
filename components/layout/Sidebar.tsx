"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const linkClass = (path: string) =>
    `block px-4 py-2 rounded ${
      pathname === path ? "bg-white text-black" : "hover:bg-gray-800"
    }`;

  return (
    <aside className="w-64 bg-black text-white p-6">
      <h2 className="text-xl font-bold mb-8">Navkon Admin</h2>

      <nav className="space-y-3">
        <Link href="/dashboard" className={linkClass("/dashboard")}>
          Dashboard
        </Link>
        <Link href="/dashboard/accounts" className={linkClass("/dashboard/accounts")}>
          Accounts
        </Link>
        <Link href="/dashboard/billing" className={linkClass("/dashboard/billing")}>
          Billing
        </Link>
        <Link href="/dashboard/services" className={linkClass("/dashboard/services")}>
          Services
        </Link>
      </nav>
    </aside>
  );
}