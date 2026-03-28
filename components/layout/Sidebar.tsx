"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Receipt,
  Server,
  Settings,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", path: "/dashboard",          icon: LayoutDashboard },
  { name: "Accounts",  path: "/dashboard/accounts", icon: Users           },
  { name: "Billing",   path: "/dashboard/billing",  icon: Receipt         },
  { name: "Services",  path: "/dashboard/services", icon: Server          },
  { name: "Settings",  path: "/dashboard/settings", icon: Settings        },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col min-h-screen shrink-0">
      <div className="p-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-10">
          <div style={{ width: "3px", height: "24px" }} className="bg-orange rounded-full" />
          <span className="font-serif text-2xl font-medium tracking-tight">
            <span className="text-orange">Nav</span><span className="text-green">kon</span>
          </span>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-sans font-medium transition-all duration-200 border ${
                  active
                    ? "bg-orange text-white border-transparent"
                    : "text-ink-muted border-transparent hover:bg-surface2 hover:text-ink hover:border-border"
                }`}
                style={active ? { boxShadow: "0 4px 12px rgba(249,115,22,0.25)" } : {}}
              >
                <Icon
                  size={16}
                  strokeWidth={active ? 2.5 : 1.75}
                  className={active ? "text-white" : "text-ink-dim"}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="mt-auto p-6 border-t border-border">
        <div className="text-[9px] font-mono uppercase tracking-widest text-ink-ghost leading-relaxed">
          <div>Navkon Labs</div>
          <div className="opacity-60">UDYAM-MH-33-0750188</div>
        </div>
      </div>
    </aside>
  );
}