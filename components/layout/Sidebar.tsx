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
  ShieldCheck,
  Crown,
  PanelLeftClose,
  PanelLeftOpen,
  UsersRound,
  Package,
  Contact,
  BarChart3,
  Headphones,
  ScrollText,
} from "lucide-react";
import { useAuth } from "@/components/providers/AppProviders";
import { useRole } from "@/components/providers/AppProviders";
import { SUPER_ADMIN_EMAIL } from "@/components/providers/AppProviders";
import type { NavPage, RoleName } from "@/components/providers/AppProviders";

const ALL_NAV_ITEMS: { name: NavPage; path: string; icon: React.ElementType }[] = [
  { name: "Dashboard", path: "/dashboard",           icon: LayoutDashboard },
  { name: "Accounts",  path: "/dashboard/accounts",  icon: Users           },
  { name: "Clients",   path: "/dashboard/clients",   icon: Contact         },
  { name: "Team",      path: "/dashboard/team",      icon: UsersRound      },
  { name: "Products",  path: "/dashboard/products",  icon: Package         },
  { name: "Billing",   path: "/dashboard/billing",   icon: Receipt         },
  { name: "Services",  path: "/dashboard/services",  icon: Server          },
  { name: "Reports",   path: "/dashboard/reports",   icon: BarChart3       },
  { name: "Support",   path: "/dashboard/support",   icon: Headphones      },
  { name: "Audit Log", path: "/dashboard/audit-log", icon: ScrollText      },
  { name: "Settings",  path: "/dashboard/settings",  icon: Settings        },
  { name: "Roles",     path: "/dashboard/roles",     icon: ShieldCheck     },
];

const ROLE_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  "Super Admin": { bg: "var(--orange-dim)",  text: "var(--orange)",    border: "var(--orange-border)" },
  Admin:         { bg: "var(--orange-dim)",  text: "var(--orange)",    border: "var(--orange-border)" },
  Accountant:    { bg: "var(--green-dim)",   text: "var(--green)",     border: "var(--green-border)"  },
  Support:       { bg: "rgba(96,165,250,0.1)", text: "#60a5fa",        border: "rgba(96,165,250,0.25)" },
  Intern:        { bg: "rgba(168,85,247,0.1)", text: "#a855f7",        border: "rgba(168,85,247,0.25)" },
  Guest:         { bg: "var(--surface2)",    text: "var(--ink-dim)",   border: "var(--border)"        },
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { permissions, roleLoading, role, isAdmin, isSuperAdmin } = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Persist collapsed state across navigations
  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);
  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar_collapsed", String(!prev));
      return !prev;
    });
  };

  // Filter nav items based on role permissions
  const navItems = ALL_NAV_ITEMS.filter((item) =>
    permissions.includes(item.name)
  );

  const isActive = (path: string) => {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(path);
  };

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
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

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Admin";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Determine displayed role label (Super Admin gets a special label)
  const isSuperAdminUser = user?.email === SUPER_ADMIN_EMAIL;
  const displayRole = isSuperAdminUser ? "Super Admin" : (role ?? "Guest");
  const badge = ROLE_BADGE[displayRole] ?? ROLE_BADGE["Guest"];

  // Label shown on the Roles nav link
  const rolesLinkLabel = isSuperAdminUser ? "Super Admin" : isAdmin ? "Admin" : "";

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      <div className={`${collapsed && !mobile ? "px-3 pt-5 pb-2" : "p-6"} flex-1 transition-all duration-300`}>
        {/* Brand Header */}
        <div className={`flex items-center mb-10 ${collapsed && !mobile ? "justify-center" : "justify-between"}`}>
          {(!collapsed || mobile) && (
            <div className="flex items-center gap-3">
              <div style={{ width: "3px", height: "24px" }} className="bg-orange rounded-full" />
              <span className="font-serif text-2xl font-medium tracking-tight">
                <span className="text-orange">Nav</span>
                <span className="text-green">kon</span>
              </span>
            </div>
          )}
          {collapsed && !mobile && (
            <div style={{ width: "3px", height: "24px" }} className="bg-orange rounded-full" />
          )}
          {mobile && (
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface2 transition-colors"
              aria-label="Close menu"
            >
              <X size={20} className="text-ink-muted" />
            </button>
          )}
        </div>

        <nav className="flex flex-col gap-1">
          {roleLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`h-10 rounded-xl bg-surface2 animate-pulse mb-1 ${collapsed && !mobile ? "w-10 mx-auto" : ""}`}
                style={{ opacity: 1 - i * 0.2 }}
              />
            ))
          ) : (
            navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              const isCollapsed = collapsed && !mobile;
              return (
                <div key={item.path} className="relative group">
                  <Link
                    href={item.path}
                    className={`flex items-center gap-3 rounded-xl text-sm font-sans font-medium transition-all duration-200 border ${
                      isCollapsed ? "px-0 py-2.5 justify-center w-10 mx-auto" : "px-4 py-2.5"
                    } ${
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
                    {!isCollapsed && (
                      <>
                        {item.name}
                        {item.name === "Roles" && rolesLinkLabel && (
                          <span
                            className="ml-auto text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1"
                            style={{
                              background: "var(--orange-dim)",
                              color: active ? "white" : "var(--orange)",
                              border: "1px solid var(--orange-border)",
                            }}
                          >
                            {isSuperAdminUser && <Crown size={8} />}
                            {rolesLinkLabel}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                  {/* Tooltip when collapsed */}
                  {isCollapsed && (
                    <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <div className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs font-sans text-ink whitespace-nowrap shadow-lg">
                        {item.name}
                        {item.name === "Roles" && rolesLinkLabel && (
                          <span className="ml-1.5 text-orange">· {rolesLinkLabel}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </nav>
      </div>

      {/* Collapse toggle — desktop only, sits just above the footer divider */}
      {!mobile && (
        <div className="px-3 pb-2">
          <button
            onClick={toggleCollapsed}
            className={`w-full flex items-center gap-2 rounded-xl text-[10px] font-mono uppercase tracking-wider text-ink-ghost hover:text-ink hover:bg-surface2 transition-all py-2 ${
              collapsed ? "justify-center px-0" : "px-3"
            }`}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed
              ? <PanelLeftOpen size={14} strokeWidth={1.75} />
              : <><PanelLeftClose size={14} strokeWidth={1.75} /><span>‹ Collapse ›</span></>
            }
          </button>
        </div>
      )}

      {/* Footer: user info + logout */}
      <div className={`border-t border-border ${collapsed && !mobile ? "p-2" : "p-4"} transition-all duration-300`}>
        {(!collapsed || mobile) ? (
          <>
            {/* User row */}
            <div className="flex items-center gap-3 px-2 py-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-orange-dim border border-orange-border flex items-center justify-center text-xs font-bold text-orange font-mono shrink-0 relative">
                {initials}
                {isSuperAdminUser && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-orange rounded-full flex items-center justify-center shadow">
                    <Crown size={8} className="text-white" />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-sans font-medium text-ink truncate">{displayName}</div>
                <div className="text-[10px] font-mono text-ink-ghost truncate">{user?.email}</div>
              </div>
            </div>
            {/* Role badge */}
            <div className="px-2 mb-2">
              <span
                className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border"
                style={{ background: badge.bg, color: badge.text, borderColor: badge.border }}
              >
                {isSuperAdminUser && <Crown size={8} />}
                {displayRole}
              </span>
            </div>
            {/* Logout */}
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
          </>
        ) : (
          /* Collapsed footer — avatar + logout icon only, with tooltips */
          <div className="flex flex-col items-center gap-2">
            <div className="relative group">
              <div className="w-8 h-8 rounded-full bg-orange-dim border border-orange-border flex items-center justify-center text-xs font-bold text-orange font-mono relative cursor-default">
                {initials}
                {isSuperAdminUser && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-orange rounded-full flex items-center justify-center shadow">
                    <Crown size={7} className="text-white" />
                  </span>
                )}
              </div>
              <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50
                              opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <div className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs font-sans text-ink whitespace-nowrap shadow-lg">
                  <div className="font-medium">{displayName}</div>
                  <div className="text-[10px] text-ink-ghost">{displayRole}</div>
                </div>
              </div>
            </div>
            <div className="relative group">
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-ink-muted hover:bg-red-dim hover:text-red border border-transparent hover:border-red transition-all disabled:opacity-50"
              >
                <LogOut size={15} strokeWidth={1.75} />
              </button>
              <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50
                              opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <div className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs font-sans text-ink whitespace-nowrap shadow-lg">
                  Sign Out
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex bg-surface border-r border-border flex-col min-h-screen shrink-0 transition-all duration-300 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <SidebarContent mobile={false} />
      </aside>

      {/* Mobile FAB */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-orange text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95"
        aria-label="Open menu"
        style={{ boxShadow: "0 8px 24px rgba(249,115,22,0.4)" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
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
        <SidebarContent mobile={true} />
      </aside>
    </>
  );
}