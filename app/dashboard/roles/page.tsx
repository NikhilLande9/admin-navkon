//app\dashboard\roles\page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  collection,
  doc,
  updateDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AppProviders";
import { useRole } from "@/components/providers/AppProviders";
import {
  ALL_PAGES,
  ALL_ROLES,
  DEFAULT_ROLE_PERMISSIONS,
  SUPER_ADMIN_EMAIL,
} from "@/components/providers/AppProviders";
import type { RoleName, NavPage, RolePermissions } from "@/components/providers/AppProviders";
import RoleGuard from "@/components/auth/RoleGuard";
import {
  ShieldCheck,
  Users,
  LayoutGrid,
  ChevronDown,
  Save,
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  Crown,
} from "lucide-react";

type UserRecord = {
  uid: string;
  name: string;
  email: string;
  role: RoleName;
  createdAt?: { seconds: number } | null;
};

const ROLE_COLORS: Record<RoleName, { bg: string; text: string; border: string }> = {
  Admin:      { bg: "var(--orange-dim)",      text: "var(--orange)",    border: "var(--orange-border)"  },
  Accountant: { bg: "var(--green-dim)",        text: "var(--green)",     border: "var(--green-border)"   },
  Support:    { bg: "rgba(96,165,250,0.1)",    text: "#60a5fa",          border: "rgba(96,165,250,0.25)" },
  Intern:     { bg: "rgba(168,85,247,0.1)",    text: "#a855f7",          border: "rgba(168,85,247,0.25)" },
  Guest:      { bg: "var(--surface2)",         text: "var(--ink-muted)", border: "var(--border)"         },
};

const PAGE_ICONS: Record<NavPage, string> = {
  Dashboard: "⊞",
  Accounts:  "👥",
  Billing:   "🧾",
  Services:  "⚙️",
  Settings:  "⚙",
  Roles:     "🛡",
};

export default function RolesPage() {
  const { user } = useAuth();
  const { isAdmin, isSuperAdmin, allRolePermissions, canChangeRole } = useRole();

  const [activeTab, setActiveTab] = useState<"users" | "permissions">("users");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [permMatrix, setPermMatrix] = useState<RolePermissions>(DEFAULT_ROLE_PERMISSIONS);
  const [permSaving, setPermSaving] = useState(false);
  const [permSaved, setPermSaved] = useState(false);
  const [permDirty, setPermDirty] = useState(false);

  const [roleChanging, setRoleChanging] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  /* Load users — live */
  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list: UserRecord[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          name: data.name || data.displayName || data.email?.split("@")[0] || "Unknown",
          email: data.email || "",
          role: (data.role as RoleName) || "Guest",
          createdAt: data.createdAt || null,
        };
      });
      setUsers(list);
      setUsersLoading(false);
    });
    return () => unsub();
  }, []);

  /* Sync permission matrix from Firestore (only when not locally dirty) */
  useEffect(() => {
    if (allRolePermissions && !permDirty) {
      setPermMatrix(allRolePermissions);
    }
  }, [allRolePermissions, permDirty]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  /* Change a user's role */
  const handleRoleChange = async (uid: string, newRole: RoleName) => {
    if (!canChangeRole(newRole)) {
      showToast("You don't have permission to assign this role", false);
      return;
    }
    setRoleChanging(uid);
    try {
      await updateDoc(doc(db, "users", uid), { role: newRole });
      showToast("Role updated successfully", true);
    } catch {
      showToast("Failed to update role", false);
    } finally {
      setRoleChanging(null);
    }
  };

  /* Toggle a page permission for a role */
  const togglePermission = (role: RoleName, page: NavPage) => {
    if (role === "Admin") return;
    if (page === "Roles") return;

    setPermMatrix((prev) => {
      const current = prev[role] || [];
      const has = current.includes(page);
      return {
        ...prev,
        [role]: has ? current.filter((p) => p !== page) : [...current, page],
      };
    });
    setPermDirty(true);
    setPermSaved(false);
  };

  /* Save permission matrix to Firestore */
  const savePermissions = async () => {
    setPermSaving(true);
    try {
      await setDoc(doc(db, "config", "rolePermissions"), permMatrix);
      setPermDirty(false);
      setPermSaved(true);
      showToast("Permissions saved", true);
      setTimeout(() => setPermSaved(false), 3000);
    } catch {
      showToast("Failed to save permissions", false);
    } finally {
      setPermSaving(false);
    }
  };

  const resetPermissions = () => {
    setPermMatrix(DEFAULT_ROLE_PERMISSIONS);
    setPermDirty(true);
    setPermSaved(false);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * Determine if a user row's role selector should be locked.
   * Locked when:
   *   - It's the Super Admin account (always locked)
   *   - The target user has Admin role and the current user is NOT Super Admin
   *   - The current user is not an admin at all
   */
  const isUserRoleLocked = (targetUser: UserRecord): boolean => {
    if (targetUser.email === SUPER_ADMIN_EMAIL) return true;
    if (targetUser.role === "Admin" && !isSuperAdmin) return true;
    if (!isAdmin) return true;
    return false;
  };

  /**
   * Which roles can be assigned to this target user by the current user.
   * Regular Admins cannot assign the Admin role.
   */
  const assignableRoles = (targetUser: UserRecord): RoleName[] => {
    if (isSuperAdmin) return ALL_ROLES;
    // Regular Admin: exclude Admin role from the dropdown options
    return ALL_ROLES.filter((r) => r !== "Admin");
  };

  return (
    <RoleGuard page="Roles">
      <div className="font-mono text-ink">
        {/* Toast */}
        {toast && (
          <div
            className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl font-sans text-sm transition-all"
            style={{
              background: toast.ok ? "var(--green-dim)" : "var(--red-dim)",
              borderColor: toast.ok ? "var(--green-border)" : "var(--red)",
              color: toast.ok ? "var(--green)" : "var(--red)",
            }}
          >
            {toast.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-1">
            <ShieldCheck size={24} className="text-orange" strokeWidth={1.75} />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tighter text-ink">
              Roles & Access
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 mt-2">
            <div className="h-px w-6 sm:w-8 bg-orange rounded" />
            <p className="text-ink-muted text-xs sm:text-sm font-light">
              Manage user roles and control page-level access per role
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {ALL_ROLES.map((r) => {
            const count = users.filter((u) => u.role === r).length;
            const c = ROLE_COLORS[r];
            return (
              <div
                key={r}
                className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-2 hover:border-orange/40 transition-all"
              >
                <span
                  className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border self-start"
                  style={{ background: c.bg, color: c.text, borderColor: c.border }}
                >
                  {r}
                </span>
                <div className="font-serif text-2xl font-bold text-ink">{count}</div>
                <div className="text-[10px] text-ink-ghost uppercase tracking-wider">
                  {count === 1 ? "user" : "users"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tab Bar */}
        <div className="bg-surface border border-border rounded-xl sm:rounded-2xl overflow-hidden shadow-sm">
          <div className="flex border-b border-border bg-surface2">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-5 sm:px-8 py-3 sm:py-4 text-[10px] sm:text-xs font-mono uppercase tracking-widest border-b-2 transition-all ${
                activeTab === "users"
                  ? "text-orange border-orange"
                  : "text-ink-muted border-transparent hover:text-ink-soft"
              }`}
            >
              <Users size={14} />
              Users
            </button>
            <button
              onClick={() => setActiveTab("permissions")}
              className={`flex items-center gap-2 px-5 sm:px-8 py-3 sm:py-4 text-[10px] sm:text-xs font-mono uppercase tracking-widest border-b-2 transition-all ${
                activeTab === "permissions"
                  ? "text-orange border-orange"
                  : "text-ink-muted border-transparent hover:text-ink-soft"
              }`}
            >
              <LayoutGrid size={14} />
              Permissions
              {permDirty && (
                <span className="w-2 h-2 rounded-full bg-orange animate-pulse" />
              )}
            </button>
          </div>

          {/* ── USERS TAB ── */}
          {activeTab === "users" && (
            <div className="p-4 sm:p-6">
              <div className="relative mb-5">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-dim" />
                <input
                  type="text"
                  placeholder="Search by name, email or role…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface2 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm font-mono focus:border-orange outline-none transition-colors"
                />
              </div>

              {usersLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 bg-surface2 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-16 text-center text-ink-ghost text-sm">No users found.</div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((u) => {
                    const c = ROLE_COLORS[u.role] ?? ROLE_COLORS["Guest"];
                    const isCurrentUser = u.email === user?.email;
                    const isSuperAdminUser = u.email === SUPER_ADMIN_EMAIL;
                    const locked = isUserRoleLocked(u);

                    return (
                      <div
                        key={u.uid}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-surface2 border border-border rounded-xl hover:border-orange/30 transition-all"
                      >
                        {/* Avatar */}
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0"
                          style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
                        >
                          {u.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-sans font-medium text-ink">{u.name}</span>
                            {isCurrentUser && (
                              <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-dim text-green border border-green-border">
                                You
                              </span>
                            )}
                            {isSuperAdminUser && (
                              <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-dim text-orange border border-orange-border flex items-center gap-1">
                                <Crown size={9} />
                                Super Admin
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-ink-ghost mt-0.5 truncate">
                            {u.email}
                          </div>
                        </div>

                        {/* Role Selector */}
                        <div className="shrink-0">
                          {locked ? (
                            <span
                              className="text-[11px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-xl border flex items-center gap-1.5"
                              style={{ background: c.bg, color: c.text, borderColor: c.border }}
                            >
                              {isSuperAdminUser ? <Crown size={11} /> : <ShieldCheck size={11} />}
                              {isSuperAdminUser ? "Super Admin · Locked" : `${u.role} · Locked`}
                            </span>
                          ) : (
                            <div className="relative">
                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.uid, e.target.value as RoleName)}
                                disabled={roleChanging === u.uid}
                                className="appearance-none bg-surface border border-border rounded-xl pl-3 pr-8 py-2 text-xs font-mono focus:border-orange outline-none transition-colors cursor-pointer disabled:opacity-50"
                                style={{ color: c.text }}
                              >
                                {assignableRoles(u).map((r) => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                              {roleChanging === u.uid ? (
                                <svg
                                  className="animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-orange"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-dim pointer-events-none" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── PERMISSIONS TAB ── */}
          {activeTab === "permissions" && (
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <p className="text-xs text-ink-muted font-sans leading-relaxed">
                  Toggle which pages each role can access. Changes take effect immediately after saving.
                  <br />
                  <span className="text-ink-ghost text-[11px]">
                    Admin always has full access. The Roles page is Admin-only.
                  </span>
                </p>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={resetPermissions}
                    className="flex items-center gap-2 px-4 py-2 border border-border bg-surface2 hover:border-orange-border text-ink-muted hover:text-orange rounded-xl text-xs font-mono transition-all"
                  >
                    <RotateCcw size={12} />
                    Reset
                  </button>
                  <button
                    onClick={savePermissions}
                    disabled={permSaving || !permDirty}
                    className="flex items-center gap-2 px-5 py-2 bg-orange hover:opacity-90 disabled:opacity-40 text-white rounded-xl text-xs font-mono transition-all shadow-lg shadow-orange/20"
                  >
                    {permSaving ? (
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : permSaved ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <Save size={12} />
                    )}
                    {permSaving ? "Saving…" : permSaved ? "Saved!" : "Save Changes"}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-140">
                  <thead>
                    <tr className="bg-surface2 border-b border-border">
                      <th className="px-5 py-3.5 text-left text-[10px] uppercase tracking-widest font-normal text-ink-dim w-36">
                        Page
                      </th>
                      {ALL_ROLES.map((r) => {
                        const c = ROLE_COLORS[r];
                        return (
                          <th
                            key={r}
                            className="px-3 py-3.5 text-center text-[10px] uppercase tracking-widest font-normal"
                            style={{ color: c.text }}
                          >
                            {r}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {ALL_PAGES.map((page, pi) => (
                      <tr
                        key={page}
                        className={`border-b border-border last:border-none ${
                          pi % 2 === 0 ? "bg-surface" : "bg-surface2/50"
                        }`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <span className="text-base">{PAGE_ICONS[page]}</span>
                            <span className="text-sm font-sans text-ink">{page}</span>
                            {page === "Roles" && (
                              <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-dim text-orange border border-orange-border">
                                Admin only
                              </span>
                            )}
                          </div>
                        </td>
                        {ALL_ROLES.map((r) => {
                          const isLocked = r === "Admin" || page === "Roles";
                          const hasAccess =
                            r === "Admin"
                              ? true
                              : page === "Roles"
                              ? false
                              : (permMatrix[r] || []).includes(page);

                          return (
                            <td key={r} className="px-3 py-4 text-center">
                              <button
                                onClick={() => !isLocked && togglePermission(r, page)}
                                disabled={isLocked}
                                title={
                                  isLocked
                                    ? r === "Admin"
                                      ? "Admin always has full access"
                                      : "Roles page is Admin-only"
                                    : hasAccess
                                    ? `Remove ${page} from ${r}`
                                    : `Grant ${page} to ${r}`
                                }
                                className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all ${
                                  isLocked
                                    ? "opacity-40 cursor-not-allowed"
                                    : "hover:scale-110 cursor-pointer"
                                }`}
                                style={{
                                  background: hasAccess ? "var(--green-dim)" : "var(--surface2)",
                                  border: `1px solid ${hasAccess ? "var(--green-border)" : "var(--border)"}`,
                                }}
                              >
                                {hasAccess ? (
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                ) : (
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--ink-dim)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-[10px] font-mono text-ink-ghost mt-4 text-center">
                Changes are local until you hit <span className="text-orange">Save Changes</span>. All users see updates in real-time after saving.
              </p>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}