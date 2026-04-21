"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Receipt,
  Server,
  Settings,
  X,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/components/providers/AppProviders";

const navItems = [
  { name: "Dashboard", path: "/dashboard",          icon: LayoutDashboard },
  { name: "Accounts",  path: "/dashboard/accounts", icon: Users           },
  { name: "Billing",   path: "/dashboard/billing",  icon: Receipt         },
  { name: "Services",  path: "/dashboard/services", icon: Server          },
  { name: "Settings",  path: "/dashboard/settings", icon: Settings        },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (path: string) => {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(path);
  };

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push("/login");
    } catch {
      setLoggingOut(false);
    }
  };

  // Derive display name & initials from Firebase user
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Admin";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 flex-1">
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div style={{ width: "3px", height: "24px" }} className="bg-orange rounded-full" />
            <span className="font-serif text-2xl font-medium tracking-tight">
              <span className="text-orange">Nav</span><span className="text-green">kon</span>
            </span>
          </div>
          {/* Close button - mobile only */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface2 transition-colors"
            aria-label="Close menu"
          >
            <X size={20} className="text-ink-muted" />
          </button>
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

      {/* Footer: user info + logout */}
      <div className="p-4 border-t border-border">
        {/* User row */}
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-orange-dim border border-orange-border flex items-center justify-center text-xs font-bold text-orange font-mono shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-sans font-medium text-ink truncate">{displayName}</div>
            <div className="text-[10px] font-mono text-ink-ghost truncate">{user?.email}</div>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-sans font-medium text-ink-muted border border-transparent hover:bg-red-dim hover:text-red hover:border-red transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut size={16} strokeWidth={1.75} className="shrink-0" />
          {loggingOut ? "Signing out…" : "Sign Out"}
        </button>

        <div className="mt-3 px-2 text-[9px] font-mono uppercase tracking-widest text-ink-ghost opacity-60">
          UDYAM-MH-33-0750188
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-surface border-r border-border flex-col min-h-screen shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Menu Button - Fixed position */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-orange text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95"
        aria-label="Open menu"
        style={{ boxShadow: "0 8px 24px rgba(249,115,22,0.4)" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 w-70 bg-surface border-r border-border flex flex-col z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  );
}