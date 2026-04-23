"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

/* ── Types ────────────────────────────────────────────────────────────────── */

/** Role names are fully dynamic strings.
 *  "Guest" is the only reserved fallback — it is never stored in Firestore,
 *  just used client-side when a user has no role or no user doc. */
export type RoleName = string;

export type NavPage =
  | "Dashboard"
  | "Accounts"
  | "Clients"
  | "Team"
  | "Products"
  | "Billing"
  | "Services"
  | "Reports"
  | "Support"
  | "Audit Log"
  | "Settings"
  | "Roles";

export const ALL_PAGES: NavPage[] = [
  "Dashboard",
  "Accounts",
  "Clients",
  "Team",
  "Products",
  "Billing",
  "Services",
  "Reports",
  "Support",
  "Audit Log",
  "Settings",
  "Roles",
];

/**
 * Seeded into config/rolePermissions on first load only if that doc doesn't
 * exist yet. Super Admins can rename, delete, or reconfigure any of these.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, NavPage[]> = {
  Accountant: ["Dashboard", "Billing", "Reports"],
  Support:    ["Dashboard", "Accounts", "Clients", "Services", "Support"],
  Intern:     ["Dashboard", "Clients"],
  Guest:      ["Dashboard"],
};

export type RolePermissions = Record<RoleName, NavPage[]>;

/* ── Super Admin ──────────────────────────────────────────────────────────── */

/**
 * The one truly hardcoded identity in the entire system.
 *
 * Privileges:
 *   - Always treated as admin, regardless of Firestore data
 *   - Cannot be demoted or have their isAdmin flag cleared by anyone
 *   - Only user who can grant/revoke the isAdmin flag on other users
 *   - Can create, rename, and delete any role
 */
export const SUPER_ADMIN_EMAIL = "nikhillande9@gmail.com";

/* ── Theme ────────────────────────────────────────────────────────────────── */

export type ThemeName = "light" | "dark";

const THEME_CLASS_MAP: Record<ThemeName, string> = {
  light: "",
  dark:  "theme-dark",
};
const STORAGE_KEY = "navkon_theme";

interface ThemeContextType {
  theme: ThemeName;
  dark: boolean;
  toggleTheme: () => void;
  setTheme: (t: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within AppProviders");
  return ctx;
}

function applyTheme(theme: ThemeName) {
  const html = document.documentElement;
  Object.values(THEME_CLASS_MAP).forEach((cls) => cls && html.classList.remove(cls));
  const cls = THEME_CLASS_MAP[theme];
  if (cls) html.classList.add(cls);
}

/* ── Auth ─────────────────────────────────────────────────────────────────── */

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AppProviders");
  return ctx;
}

/* ── Role ─────────────────────────────────────────────────────────────────── */

interface RoleContextType {
  /** Display label for the current user's role — a free-form string */
  role: RoleName | null;
  roleLoading: boolean;
  /** Pages the current user is permitted to visit */
  permissions: NavPage[];
  /** Live map of every role → its allowed pages */
  allRolePermissions: RolePermissions | null;
  /** All role names that exist, sorted alphabetically, derived from allRolePermissions */
  allRoles: RoleName[];
  /**
   * True when the user has admin privileges.
   * Sourced from users/{email}.isAdmin == true  OR  the hardcoded Super Admin email.
   * Deliberately decoupled from any role label — roles can be renamed/deleted freely.
   */
  isAdmin: boolean;
  /** True ONLY for SUPER_ADMIN_EMAIL */
  isSuperAdmin: boolean;
  canAccess: (page: NavPage) => boolean;
  /** Any admin can assign any role. Only Super Admin can toggle the isAdmin flag. */
  canAssignRole: (targetRole: RoleName) => boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within AppProviders");
  return ctx;
}

/* ── Provider ─────────────────────────────────────────────────────────────── */

export default function AppProviders({ children }: { children: ReactNode }) {
  // Theme
  const [theme, setThemeState]   = useState<ThemeName>("dark");
  const [mounted, setMounted]     = useState(false);

  // Auth
  const [user, setUser]           = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Role
  const [role, setRole]           = useState<RoleName | null>(null);
  const [isAdminFlag, setIsAdminFlag] = useState(false); // from users/{email}.isAdmin
  const [roleLoading, setRoleLoading] = useState(true);
  const [allRolePermissions, setAllRolePermissions] = useState<RolePermissions | null>(null);
  const [allRoles, setAllRoles]   = useState<RoleName[]>([]);

  /* Theme init */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
    const initial: ThemeName = saved === "light" || saved === "dark" ? saved : "dark";
    setThemeState(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  /* Auth listener */
  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      if (!firebaseUser) {
        setRole(null);
        setIsAdminFlag(false);
        setRoleLoading(false);
      }
    });
  }, []);

  /* User doc listener — reads users/{lowercased-email}
   *
   * Two fields are consumed:
   *   role    : free-form display label
   *   isAdmin : boolean privilege flag — completely independent of role name
   *
   * Super Admin is always admin regardless of what their doc says.
   */
  useEffect(() => {
    if (!user?.email) return;
    setRoleLoading(true);

    const emailKey = user.email.toLowerCase();
    const unsubscribe = onSnapshot(doc(db, "users", emailKey), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRole((data.role as RoleName) || "Guest");
        setIsAdminFlag(
          user.email === SUPER_ADMIN_EMAIL ? true : Boolean(data.isAdmin)
        );
      } else {
        setRole("Guest");
        setIsAdminFlag(user.email === SUPER_ADMIN_EMAIL);
      }
      setRoleLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  /* Role-permissions listener — config/rolePermissions */
  useEffect(() => {
    return onSnapshot(doc(db, "config", "rolePermissions"), (snap) => {
      if (snap.exists()) {
        setAllRolePermissions(snap.data() as RolePermissions);
      } else {
        setAllRolePermissions(DEFAULT_ROLE_PERMISSIONS);
      }
    });
  }, []);

  /* Role-order listener — config/roleOrder
   *
   * Stores { order: string[] } — the canonical display order of roles.
   * Creation appends, drag-and-drop reorders, rename updates in-place,
   * delete removes. Falls back to alphabetical sort of permission keys
   * only when the order doc doesn't exist yet (first-ever load).
   */
  useEffect(() => {
    return onSnapshot(doc(db, "config", "roleOrder"), (snap) => {
      if (snap.exists()) {
        const order = (snap.data().order as string[]) ?? [];
        setAllRoles(order);
      } else if (allRolePermissions) {
        // Fallback: derive from permission keys alphabetically until order doc is created
        setAllRoles(Object.keys(allRolePermissions).sort());
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;
  const isAdmin      = isSuperAdmin || isAdminFlag;

  /* Admins always get every page; the Roles page is gated by isAdmin,
   * not by a role name, so renaming whatever role an admin holds never
   * locks them out. */
  const permissions: NavPage[] = isAdmin
    ? ALL_PAGES
    : allRolePermissions && role
      ? (allRolePermissions[role] ?? ["Dashboard"])
      : ["Dashboard"];

  const canAccess = useCallback(
    (page: NavPage) => permissions.includes(page),
    [permissions]
  );

  /* Any admin can assign any role label. Granting the isAdmin flag
   * is handled separately in the Roles page and is Super-Admin-only. */
  const canAssignRole = useCallback(
    (_: RoleName): boolean => isAdmin,
    [isAdmin]
  );

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next);
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleTheme = useCallback(
    () => setTheme(theme === "dark" ? "light" : "dark"),
    [theme, setTheme]
  );

  const logout = useCallback(async () => { await signOut(auth); }, []);

  return (
    <AuthContext.Provider value={{ user, loading: authLoading, logout }}>
      <ThemeContext.Provider value={{ theme, dark: theme === "dark", toggleTheme, setTheme }}>
        <RoleContext.Provider
          value={{
            role, roleLoading, permissions,
            allRolePermissions, allRoles,
            isAdmin, isSuperAdmin,
            canAccess, canAssignRole,
          }}
        >
          <div style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.15s ease" }}>
            {children}
          </div>
        </RoleContext.Provider>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}