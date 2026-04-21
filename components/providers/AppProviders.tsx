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
import { auth } from "@/lib/firebase";

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
  Object.values(THEME_CLASS_MAP).forEach((cls) => { if (cls) html.classList.remove(cls); });
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

/* ── Provider ─────────────────────────────────────────────────────────────── */

export default function AppProviders({ children }: { children: ReactNode }) {
  // Theme
  const [theme, setThemeState] = useState<ThemeName>("dark");
  const [mounted, setMounted] = useState(false);

  // Auth
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

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
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
      <ThemeContext.Provider value={{ theme, dark: theme === "dark", toggleTheme, setTheme }}>
        <div
          style={{
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.15s ease",
          }}
        >
          {children}
        </div>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}