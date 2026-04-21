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

export type RoleName = "Admin" | "Accountant" | "Support" | "Intern" | "Guest";

export type NavPage =
  | "Dashboard"
  | "Accounts"
  | "Billing"
  | "Services"
  | "Settings"
  | "Roles";

export const ALL_PAGES: NavPage[] = [
  "Dashboard",
  "Accounts",
  "Billing",
  "Services",
  "Settings",
  "Roles",
];

export const ALL_ROLES: RoleName[] = [
  "Admin",
  "Accountant",
  "Support",
  "Intern",
  "Guest",
];

// Default permissions per role (used only to seed Firestore on first load)
export const DEFAULT_ROLE_PERMISSIONS: Record<RoleName, NavPage[]> = {
  Admin:      ["Dashboard", "Accounts", "Billing", "Services", "Settings", "Roles"],
  Accountant: ["Dashboard", "Billing"],
  Support:    ["Dashboard", "Accounts", "Services"],
  Intern:     ["Dashboard"],
  Guest:      ["Dashboard"],
};

export type RolePermissions = Record<RoleName, NavPage[]>;

/* ── Super Admin ──────────────────────────────────────────────────────────── */

/**
 * The Super Admin email is hard-coded and cannot be changed from the UI.
 * Super Admins have all Admin capabilities plus:
 *   - Can assign / revoke the "Admin" role for other users
 *   - Cannot be demoted or deleted by any other user
 */
export const SUPER_ADMIN_EMAIL = "nikhillande9@gmail.com";

/* ── Theme ────────────────────────────────────────────────────────────────── */

export type ThemeName = "light" | "dark";

const THEME_CLASS_MAP: Record<ThemeName, string> = {
  light: "",
  dark: "theme-dark",
};

const STORAGE_KEY = "navkon_theme";

interface ThemeContextType {
  theme: ThemeName;
  dark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within AppProviders");
  return ctx;
}

function applyTheme(theme: ThemeName) {
  const html = document.documentElement;
  Object.values(THEME_CLASS_MAP).forEach((cls) => {
    if (cls) html.classList.remove(cls);
  });
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
  role: RoleName | null;
  roleLoading: boolean;
  permissions: NavPage[];
  allRolePermissions: RolePermissions | null;
  /** True if the user has Admin or Super Admin role */
  isAdmin: boolean;
  /** True ONLY for nikhillande9@gmail.com — can manage other Admins */
  isSuperAdmin: boolean;
  canAccess: (page: NavPage) => boolean;
  /**
   * Returns whether the current user can change `targetRole`.
   * - Super Admin can change any role including Admin
   * - Regular Admin can change any role EXCEPT Admin
   * - Others cannot change roles at all
   */
  canChangeRole: (targetRole: RoleName) => boolean;
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
  const [theme, setThemeState] = useState<ThemeName>("dark");
  const [mounted, setMounted] = useState(false);

  // Auth
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Role
  const [role, setRole] = useState<RoleName | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [allRolePermissions, setAllRolePermissions] =
    useState<RolePermissions | null>(null);

  /* Theme init */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
    const initial: ThemeName =
      saved === "light" || saved === "dark" ? saved : "dark";
    setThemeState(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  /* Auth listener */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      if (!firebaseUser) {
        setRole(null);
        setRoleLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  /* Role listener — live-syncs from users/{uid} */
  useEffect(() => {
    if (!user) return;

    setRoleLoading(true);
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        // Super Admin email is always forced to Admin regardless of Firestore value
        if (user.email === SUPER_ADMIN_EMAIL) {
          setRole("Admin");
        } else {
          setRole((data.role as RoleName) || "Guest");
        }
      } else {
        // No user doc yet — Super Admin still gets Admin
        setRole(user.email === SUPER_ADMIN_EMAIL ? "Admin" : "Guest");
      }
      setRoleLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  /* Role permissions listener — live-syncs from config/rolePermissions */
  useEffect(() => {
    const permRef = doc(db, "config", "rolePermissions");
    const unsubscribe = onSnapshot(permRef, (snap) => {
      if (snap.exists()) {
        setAllRolePermissions(snap.data() as RolePermissions);
      } else {
        setAllRolePermissions(DEFAULT_ROLE_PERMISSIONS);
      }
    });
    return () => unsubscribe();
  }, []);

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  const isAdmin = isSuperAdmin || role === "Admin";

  const permissions: NavPage[] = isAdmin
    ? ALL_PAGES
    : allRolePermissions && role
    ? allRolePermissions[role] ?? ["Dashboard"]
    : ["Dashboard"];

  const canAccess = useCallback(
    (page: NavPage) => permissions.includes(page),
    [permissions]
  );

  /**
   * Super Admin can change anyone's role.
   * Regular Admin can change any role EXCEPT "Admin" (to prevent privilege escalation).
   */
  const canChangeRole = useCallback(
    (targetRole: RoleName): boolean => {
      if (!isAdmin) return false;
      if (isSuperAdmin) return true;
      // Regular Admin cannot assign or remove the Admin role
      return targetRole !== "Admin";
    },
    [isAdmin, isSuperAdmin]
  );

  /* Theme helpers */
  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next);
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading: authLoading, logout }}>
      <ThemeContext.Provider
        value={{ theme, dark: theme === "dark", toggleTheme, setTheme }}
      >
        <RoleContext.Provider
          value={{
            role,
            roleLoading,
            permissions,
            allRolePermissions,
            isAdmin,
            isSuperAdmin,
            canAccess,
            canChangeRole,
          }}
        >
          <div
            style={{
              opacity: mounted ? 1 : 0,
              transition: "opacity 0.15s ease",
            }}
          >
            {children}
          </div>
        </RoleContext.Provider>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}