"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Accounts", path: "/dashboard/accounts" },
    { name: "Billing", path: "/dashboard/billing" },
    { name: "Services", path: "/dashboard/services" },
    { name: "Settings", path: "/dashboard/settings" },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-primary text-surface p-6 flex flex-col">
      <h2 className="text-xl font-bold mb-10">Navkon Admin</h2>

      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`px-4 py-2 rounded transition-all duration-200 ${
              isActive(item.path)
                ? "bg-accent text-white"
                : "hover:bg-surface/10"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}