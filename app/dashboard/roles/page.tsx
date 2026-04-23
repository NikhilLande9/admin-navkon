//app\dashboard\roles\page.tsx
"use client";

import React, { useState, useEffect } from "react";
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
  DEFAULT_ROLE_PERMISSIONS,
  SUPER_ADMIN_EMAIL,
} from "@/components/providers/AppProviders";
import type { RoleName, NavPage, RolePermissions } from "@/components/providers/AppProviders";
import RoleGuard from "@/components/auth/RoleGuard";
import {
  ShieldCheck,
  Users,
  LayoutGrid,
  LayoutDashboard,
  Receipt,
  Server,
  Settings,
  ChevronDown,
  Save,
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  Crown,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  UsersRound,
  Package,
  Contact,
  BarChart3,
  Headphones,
  ScrollText,
} from "lucide-react";

/* ── Types ── */

type UserRecord = {
  docId:     string;  // lowercased email — the Firestore doc key
  name:      string;
  email:     string;
  role:      RoleName;
  isAdmin:   boolean;
  createdAt?: { seconds: number } | null;
};

/* ── Colour helpers ── */

// A palette of colours we cycle through for dynamically-created roles
const PALETTE: { bg: string; text: string; border: string }[] = [
  { bg: "rgba(249,115,22,0.1)",  text: "#f97316", border: "rgba(249,115,22,0.25)"  }, // orange
  { bg: "rgba(34,197,94,0.1)",   text: "#22c55e", border: "rgba(34,197,94,0.25)"   }, // green
  { bg: "rgba(96,165,250,0.1)",  text: "#60a5fa", border: "rgba(96,165,250,0.25)"  }, // blue
  { bg: "rgba(168,85,247,0.1)",  text: "#a855f7", border: "rgba(168,85,247,0.25)"  }, // purple
  { bg: "rgba(236,72,153,0.1)",  text: "#ec4899", border: "rgba(236,72,153,0.25)"  }, // pink
  { bg: "rgba(234,179,8,0.1)",   text: "#eab308", border: "rgba(234,179,8,0.25)"   }, // yellow
  { bg: "rgba(20,184,166,0.1)",  text: "#14b8a6", border: "rgba(20,184,166,0.25)"  }, // teal
  { bg: "rgba(239,68,68,0.1)",   text: "#ef4444", border: "rgba(239,68,68,0.25)"   }, // red
];

// Stable colour per role name (hash so the same name always gets the same colour)
function roleColor(name: RoleName) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

const PAGE_ICONS: Record<NavPage, React.ElementType> = {
  Dashboard: LayoutDashboard,
  Accounts:  Users,
  Clients:   Contact,
  Team:      UsersRound,
  Products:  Package,
  Billing:   Receipt,
  Services:  Server,
  Reports:   BarChart3,
  Support:   Headphones,
  "Audit Log": ScrollText,
  Settings:  Settings,
  Roles:     ShieldCheck,
};

/* ══════════════════════════════════════════════════════════════════════════ */

export default function RolesPage() {
  const { user }  = useAuth();
  const { isAdmin, isSuperAdmin, allRolePermissions, allRoles, canAssignRole } = useRole();

  /* ── tab ── */
  const [activeTab, setActiveTab] = useState<"users" | "permissions">("users");

  /* ── users ── */
  const [users, setUsers]           = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [searchQuery, setSearchQuery]   = useState("");
  const [roleChanging, setRoleChanging] = useState<string | null>(null);

  /* ── permissions ── */
  const [permMatrix, setPermMatrix] = useState<RolePermissions>(DEFAULT_ROLE_PERMISSIONS);
  const [permSaving, setPermSaving] = useState(false);
  const [permSaved,  setPermSaved]  = useState(false);
  const [permDirty,  setPermDirty]  = useState(false);

  /* ── role management (Super Admin only) ── */
  const [newRoleName,   setNewRoleName]   = useState("");
  const [showRoleInput, setShowRoleInput] = useState(false);
  const [creatingRole,  setCreatingRole]  = useState(false);
  // rename: which role is being edited, and the draft value
  const [editingRole,   setEditingRole]   = useState<RoleName | null>(null);
  const [editDraft,     setEditDraft]     = useState("");
  // drag-and-drop ordering
  const [dragIndex,     setDragIndex]     = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  /* ── toast ── */
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Load users live ── */
  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setUsers(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            docId:     d.id,
            name:      data.name || data.displayName || data.email?.split("@")[0] || "Unknown",
            email:     data.email || d.id,
            role:      (data.role as RoleName) || "Guest",
            isAdmin:   Boolean(data.isAdmin),
            createdAt: data.createdAt || null,
          };
        })
      );
      setUsersLoading(false);
    });
  }, []);

  /* ── Sync perm matrix when Firestore updates (unless locally dirty) ── */
  useEffect(() => {
    if (allRolePermissions && !permDirty) setPermMatrix(allRolePermissions);
  }, [allRolePermissions, permDirty]);

  /* ════════════════ User actions ════════════════ */

  const handleRoleChange = async (docId: string, newRole: RoleName) => {
    setRoleChanging(docId);
    try {
      await updateDoc(doc(db, "users", docId), { role: newRole });
      showToast("Role updated", true);
    } catch (err) {
      console.error(err);
      showToast("Failed to update role", false);
    } finally {
      setRoleChanging(null);
    }
  };

  /**
   * Toggle the isAdmin flag on a user — Super Admin only.
   * The Super Admin themselves cannot be demoted.
   */
  const handleToggleAdmin = async (u: UserRecord) => {
    if (!isSuperAdmin) return;
    if (u.email === SUPER_ADMIN_EMAIL) return; // can't demote yourself
    try {
      await updateDoc(doc(db, "users", u.docId), { isAdmin: !u.isAdmin });
      showToast(u.isAdmin ? "Admin access revoked" : "Admin access granted", true);
    } catch (err) {
      console.error(err);
      showToast("Failed to update admin status", false);
    }
  };

  /* ════════════════ Permission matrix actions ════════════════ */

  const togglePermission = (role: RoleName, page: NavPage) => {
    // The Roles page is always gated by isAdmin, not by role permissions
    if (page === "Roles") return;

    setPermMatrix((prev) => {
      const cur = prev[role] ?? [];
      const has = cur.includes(page);
      return { ...prev, [role]: has ? cur.filter((p) => p !== page) : [...cur, page] };
    });
    setPermDirty(true);
    setPermSaved(false);
  };

  const savePermissions = async () => {
    setPermSaving(true);
    try {
      await setDoc(doc(db, "config", "rolePermissions"), permMatrix);
      setPermDirty(false);
      setPermSaved(true);
      showToast("Permissions saved", true);
      setTimeout(() => setPermSaved(false), 3000);
    } catch (err) {
      console.error(err);
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

  /* ════════════════ Role CRUD (Super Admin only) ════════════════ */

  const handleCreateRole = async () => {
    const name = newRoleName.trim();
    if (!name) return;
    if (allRoles.map((r) => r.toLowerCase()).includes(name.toLowerCase())) {
      showToast("A role with that name already exists", false);
      return;
    }
    setCreatingRole(true);
    try {
      const updatedPerms = { ...permMatrix, [name]: ["Dashboard"] as NavPage[] };
      const updatedOrder = [...allRoles, name]; // append to end
      await Promise.all([
        setDoc(doc(db, "config", "rolePermissions"), updatedPerms),
        setDoc(doc(db, "config", "roleOrder"), { order: updatedOrder }),
      ]);
      setPermMatrix(updatedPerms);
      setNewRoleName("");
      setShowRoleInput(false);
      showToast(`Role "${name}" created`, true);
    } catch (err) {
      console.error(err);
      showToast("Failed to create role", false);
    } finally {
      setCreatingRole(false);
    }
  };

  /** Persist a new role order after drag-and-drop */
  const reorderRoles = async (newOrder: RoleName[]) => {
    try {
      await setDoc(doc(db, "config", "roleOrder"), { order: newOrder });
    } catch (err) {
      console.error(err);
      showToast("Failed to save order", false);
    }
  };

  const handleRenameRole = async (oldName: RoleName) => {
    const newName = editDraft.trim();
    if (!newName || newName === oldName) { setEditingRole(null); return; }
    if (allRoles.map((r) => r.toLowerCase()).includes(newName.toLowerCase())) {
      showToast("A role with that name already exists", false);
      return;
    }
    try {
      // Rebuild the permission matrix with the new key, preserving order
      const updated: RolePermissions = {};
      for (const [k, v] of Object.entries(permMatrix)) {
        updated[k === oldName ? newName : k] = v;
      }
      // Update the order array in-place so display position is preserved
      const updatedOrder = allRoles.map((r) => (r === oldName ? newName : r));
      await Promise.all([
        setDoc(doc(db, "config", "rolePermissions"), updated),
        setDoc(doc(db, "config", "roleOrder"), { order: updatedOrder }),
      ]);
      setPermMatrix(updated);

      // Migrate users who held the old role name
      const affected = users.filter((u) => u.role === oldName);
      await Promise.all(
        affected.map((u) => updateDoc(doc(db, "users", u.docId), { role: newName }))
      );

      setEditingRole(null);
      showToast(`Renamed "${oldName}" → "${newName}"`, true);
    } catch (err) {
      console.error(err);
      showToast("Failed to rename role", false);
    }
  };

  const handleDeleteRole = async (name: RoleName) => {
    if (!confirm(`Delete role "${name}"? Affected users will be set to "Guest".`)) return;
    try {
      // Reassign affected users
      const affected = users.filter((u) => u.role === name);
      await Promise.all(
        affected.map((u) => updateDoc(doc(db, "users", u.docId), { role: "Guest" }))
      );
      // Remove from permission matrix
      const updatedPerms = { ...permMatrix };
      delete updatedPerms[name];
      // Remove from order array
      const updatedOrder = allRoles.filter((r) => r !== name);
      await Promise.all([
        setDoc(doc(db, "config", "rolePermissions"), updatedPerms),
        setDoc(doc(db, "config", "roleOrder"), { order: updatedOrder }),
      ]);
      setPermMatrix(updatedPerms);
      showToast(`Role "${name}" deleted`, true);
    } catch (err) {
      console.error(err);
      showToast("Failed to delete role", false);
    }
  };

  /* ════════════════ Derived data ════════════════ */

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /** A user row's role dropdown is locked only for the Super Admin themselves */
  const isUserRoleLocked = (u: UserRecord) =>
    u.email === SUPER_ADMIN_EMAIL || !isAdmin;

  /* ══════════════════════════════════════════════════════════════════════════ */

  return (
    <RoleGuard page="Roles">
      <div className="font-mono text-ink">

        {/* Toast — bottom-center on mobile, top-right on sm+ */}
        {toast && (
          <div
            className="fixed z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl font-sans text-sm
                       bottom-6 left-4 right-4
                       sm:bottom-auto sm:top-6 sm:left-auto sm:right-6 sm:w-auto"
            style={{
              background:  toast.ok ? "var(--green-dim)" : "var(--red-dim)",
              borderColor: toast.ok ? "var(--green-border)" : "var(--red)",
              color:       toast.ok ? "var(--green)" : "var(--red)",
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

        {/* Role summary cards */}
        {isSuperAdmin && allRoles.length > 1 && (
          <p className="text-[10px] font-mono text-ink-ghost mb-2 hidden sm:block">
            ↕ Drag cards to reorder roles
          </p>
        )}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 mb-6">
          {allRoles.map((r, idx) => {
            const count = users.filter((u) => u.role === r).length;
            const c = roleColor(r);
            const isDragging  = dragIndex === idx;
            const isDragOver  = dragOverIndex === idx;
            return (
              <div
                key={r}
                draggable={isSuperAdmin && editingRole !== r}
                onDragStart={() => { setDragIndex(idx); setDragOverIndex(idx); }}
                onDragEnter={() => setDragOverIndex(idx)}
                onDragOver={(e) => { e.preventDefault(); setDragOverIndex(idx); }}
                onDragEnd={() => {
                  if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
                    const next = [...allRoles];
                    const [moved] = next.splice(dragIndex, 1);
                    next.splice(dragOverIndex, 0, moved);
                    reorderRoles(next);
                  }
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-2 hover:border-orange/40 transition-all sm:min-w-30"
                style={{
                  opacity: isDragging ? 0.4 : 1,
                  outline: isDragOver && !isDragging ? "2px solid var(--orange)" : undefined,
                  cursor: isSuperAdmin && editingRole !== r ? "grab" : "default",
                  transition: "opacity 0.15s, outline 0.1s",
                }}
              >
                <div className="flex items-center gap-1">
                  {/* Role name — editable for Super Admin */}
                  {isSuperAdmin && editingRole === r ? (
                    <div className="flex items-center gap-1">
                      <input
                        autoFocus
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameRole(r);
                          if (e.key === "Escape") setEditingRole(null);
                        }}
                        className="bg-surface2 border border-orange rounded-lg px-2 py-0.5 text-[10px] font-mono w-20 outline-none"
                      />
                      <button onClick={() => handleRenameRole(r)} className="text-green hover:opacity-80">
                        <Check size={11} />
                      </button>
                      <button onClick={() => setEditingRole(null)} className="text-ink-ghost hover:text-red">
                        <X size={11} />
                      </button>
                    </div>
                  ) : (
                    <span
                      className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border"
                      style={{ background: c.bg, color: c.text, borderColor: c.border }}
                    >
                      {r}
                    </span>
                  )}

                  {/* Rename / delete actions (Super Admin, not editing) */}
                  {isSuperAdmin && editingRole !== r && (
                    <div className="flex gap-0.5 ml-0.5">
                      <button
                        onClick={() => { setEditingRole(r); setEditDraft(r); }}
                        title="Rename role"
                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-surface2 text-ink-ghost hover:text-orange transition-colors"
                      >
                        <Pencil size={9} />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(r)}
                        title="Delete role"
                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-dim text-ink-ghost hover:text-red transition-colors"
                      >
                        <Trash2 size={9} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="font-serif text-2xl font-bold text-ink">{count}</div>
                <div className="text-[10px] text-ink-ghost uppercase tracking-wider">
                  {count === 1 ? "user" : "users"}
                </div>
              </div>
            );
          })}

          {/* Create role — Super Admin only */}
          {isSuperAdmin && (
            showRoleInput ? (
              <div className="col-span-2 sm:col-span-1 bg-surface border border-orange/50 rounded-xl p-4 flex flex-col gap-2 sm:min-w-30">
                <input
                  autoFocus
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")  handleCreateRole();
                    if (e.key === "Escape") { setShowRoleInput(false); setNewRoleName(""); }
                  }}
                  placeholder="Role name…"
                  className="bg-surface2 border border-border rounded-lg px-3 py-1.5 text-xs font-mono focus:border-orange outline-none w-full"
                />
                <div className="flex gap-1.5">
                  <button
                    onClick={handleCreateRole}
                    disabled={creatingRole || !newRoleName.trim()}
                    className="flex-1 bg-orange text-white rounded-lg py-1.5 text-[10px] font-mono uppercase tracking-wider disabled:opacity-40 hover:opacity-90 transition-all"
                  >
                    {creatingRole ? "…" : "Create"}
                  </button>
                  <button
                    onClick={() => { setShowRoleInput(false); setNewRoleName(""); }}
                    className="px-2 rounded-lg border border-border text-ink-muted hover:border-red hover:text-red text-[10px] transition-all"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowRoleInput(true)}
                className="col-span-1 min-h-24 bg-surface border border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-orange/50 hover:bg-surface2 transition-all text-ink-ghost hover:text-orange sm:min-w-30"
              >
                <Plus size={18} strokeWidth={1.5} />
                <span className="text-[10px] font-mono uppercase tracking-wider">New Role</span>
              </button>
            )
          )}
        </div>

        {/* Tab bar */}
        <div className="bg-surface border border-border rounded-xl sm:rounded-2xl overflow-hidden shadow-sm">
          <div className="flex border-b border-border bg-surface2">
            {(["users", "permissions"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-5 sm:px-8 py-3 sm:py-4 text-[10px] sm:text-xs font-mono uppercase tracking-widest border-b-2 transition-all ${
                  activeTab === tab
                    ? "text-orange border-orange"
                    : "text-ink-muted border-transparent hover:text-ink-soft"
                }`}
              >
                {tab === "users" ? <Users size={14} /> : <LayoutGrid size={14} />}
                {tab === "users" ? "Users" : "Permissions"}
                {tab === "permissions" && permDirty && (
                  <span className="w-2 h-2 rounded-full bg-orange animate-pulse" />
                )}
              </button>
            ))}
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
                    const c = roleColor(u.role);
                    const isCurrentUser    = u.email === user?.email;
                    const isSuperAdminUser = u.email === SUPER_ADMIN_EMAIL;
                    const locked           = isUserRoleLocked(u);

                    return (
                      <div
                        key={u.docId}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-surface2 border border-border rounded-xl hover:border-orange/30 transition-all"
                      >
                        {/* Avatar */}
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 relative"
                          style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
                        >
                          {u.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                          {(u.isAdmin || isSuperAdminUser) && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange rounded-full flex items-center justify-center shadow border border-surface">
                              <Crown size={8} className="text-white" />
                            </span>
                          )}
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
                                <Crown size={9} /> Super Admin
                              </span>
                            )}
                            {u.isAdmin && !isSuperAdminUser && (
                              <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-dim text-orange border border-orange-border flex items-center gap-1">
                                <ShieldCheck size={9} /> Admin
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-ink-ghost mt-0.5 truncate">
                            {u.email}
                          </div>
                        </div>

                        {/* Controls — inline on desktop, own row on mobile */}
                        <div className="flex items-center gap-2 flex-wrap shrink-0">
                          {isSuperAdmin && !isSuperAdminUser && (
                            <button
                              onClick={() => handleToggleAdmin(u)}
                              title={u.isAdmin ? "Revoke admin access" : "Grant admin access"}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider border transition-all ${
                                u.isAdmin
                                  ? "bg-orange-dim text-orange border-orange-border hover:bg-red-dim hover:text-red hover:border-red"
                                  : "bg-surface border-border text-ink-ghost hover:border-orange hover:text-orange"
                              }`}
                            >
                              <Crown size={10} />
                              {u.isAdmin ? "Admin" : "Make Admin"}
                            </button>
                          )}

                          {/* Role label dropdown */}
                          {locked ? (
                            <span
                              className="text-[11px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-xl border flex items-center gap-1.5"
                              style={{ background: c.bg, color: c.text, borderColor: c.border }}
                            >
                              {isSuperAdminUser
                                ? <><Crown size={11} /> Super Admin · Locked</>
                                : <><ShieldCheck size={11} /> {u.role} · Locked</>
                              }
                            </span>
                          ) : (
                            <div className="relative">
                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.docId, e.target.value)}
                                disabled={roleChanging === u.docId}
                                className="appearance-none bg-surface border border-border rounded-xl pl-3 pr-8 py-2 text-xs font-mono focus:border-orange outline-none transition-colors cursor-pointer disabled:opacity-50"
                                style={{ color: c.text }}
                              >
                                {allRoles.map((r) => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                                {/* Always include Guest as a fallback even if not in allRoles */}
                                {!allRoles.includes("Guest") && (
                                  <option value="Guest">Guest</option>
                                )}
                              </select>
                              {roleChanging === u.docId ? (
                                <svg className="animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-orange" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                  Toggle which pages each role can access. Changes take effect for all users after saving.
                  <br />
                  <span className="text-ink-ghost text-[11px]">
                    The Roles page is always restricted to users with admin access.
                  </span>
                </p>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={resetPermissions}
                    className="flex items-center gap-2 px-4 py-2 border border-border bg-surface2 hover:border-orange-border text-ink-muted hover:text-orange rounded-xl text-xs font-mono transition-all"
                  >
                    <RotateCcw size={12} /> Reset
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
                    ) : permSaved ? <CheckCircle2 size={12} /> : <Save size={12} />}
                    {permSaving ? "Saving…" : permSaved ? "Saved!" : "Save Changes"}
                  </button>
                </div>
              </div>

              {/* Scroll hint — only shown on small screens */}
              <p className="text-[10px] font-mono text-ink-ghost mb-2 flex items-center gap-1 sm:hidden">
                <span>←</span> Scroll to see all roles <span>→</span>
              </p>

              <div className="overflow-x-auto rounded-xl border border-border -mx-4 sm:mx-0 px-4 sm:px-0">
                <div className="min-w-0">
                <table className="w-full" style={{ minWidth: `${Math.max(360, allRoles.length * 90 + 140)}px` }}>
                  <thead>
                    <tr className="bg-surface2 border-b border-border">
                      <th className="px-5 py-3.5 text-left text-[10px] uppercase tracking-widest font-normal text-ink-dim w-36">
                        Page
                      </th>
                      {allRoles.map((r) => {
                        const c = roleColor(r);
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
                            {(() => { const Icon = PAGE_ICONS[page]; return <Icon size={15} strokeWidth={1.75} className="text-ink-dim shrink-0" />; })()}
                            <span className="text-sm font-sans text-ink">{page}</span>
                            {page === "Roles" && (
                              <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-dim text-orange border border-orange-border">
                                Admin only
                              </span>
                            )}
                          </div>
                        </td>
                        {allRoles.map((r) => {
                          // Roles page is always locked — gated by isAdmin flag, not role perms
                          const isLocked  = page === "Roles";
                          const hasAccess = page === "Roles"
                            ? false
                            : (permMatrix[r] ?? []).includes(page);

                          return (
                            <td key={r} className="px-3 py-4 text-center">
                              <button
                                onClick={() => !isLocked && togglePermission(r, page)}
                                disabled={isLocked}
                                title={
                                  isLocked
                                    ? "Roles page is admin-access only"
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