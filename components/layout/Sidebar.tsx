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
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col min-h-screen">
      <div className="p-6">
        {/* Brand Header with Canonical Rule of Three */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-0.75 h-6 bg-orange rounded-full" /> 
          <span className="font-serif text-2xl font-medium tracking-tight text-ink">
            Navkon
          </span>
        </div>

        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`px-4 py-2.5 rounded-xl text-sm font-sans font-medium transition-all duration-200 border border-transparent ${
                isActive(item.path)
                  ? "bg-orange text-white shadow-lg shadow-orange/15"
                  : "text-ink-muted hover:bg-surface2 hover:text-ink hover:border-border"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}