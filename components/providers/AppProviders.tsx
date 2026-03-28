"use client";

// components/providers/AppProviders.tsx
//
// This is the single source of truth for theming.
// It reads localStorage on mount, applies the theme class to <html>,
// and provides ThemeContext to the entire app tree.
//
// All other components (Topbar, Settings, etc.) consume useTheme() from here.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

// ── Theme types ───────────────────────────────────────────────────────────
export type ThemeName = "light" | "dark" | "navkon" | "emerald";

const THEME_CLASS_MAP: Record<ThemeName, string> = {
  light:   "",            // default :root — no extra class
  dark:    "theme-dark",
  navkon:  "theme-navkon",
  emerald: "theme-emerald",
};

const STORAGE_KEY = "navkon_theme";

// ── Context ───────────────────────────────────────────────────────────────
interface ThemeCtx {
  theme: ThemeName;
  dark: boolean;           // convenience boolean (true when theme === "dark")
  toggleTheme: () => void; // cycles light ↔ dark
  setTheme: (t: ThemeName) => void;
}

export const ThemeContext = createContext<ThemeCtx>({
  theme: "dark",
  dark: true,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

// ── Helper: apply class to <html> ─────────────────────────────────────────
function applyThemeClass(theme: ThemeName) {
  const html = document.documentElement;
  // Remove all existing theme classes
  Object.values(THEME_CLASS_MAP).forEach((cls) => {
    if (cls) html.classList.remove(cls);
  });
  // Apply the new one (if any)
  const cls = THEME_CLASS_MAP[theme];
  if (cls) html.classList.add(cls);
}

// ── Provider ──────────────────────────────────────────────────────────────
export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  // Default to "dark" until localStorage is read on the client
  const [theme, setThemeState] = useState<ThemeName>("dark");
  const [mounted, setMounted] = useState(false);

  // Read persisted theme on first mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
    const initial: ThemeName =
      saved && saved in THEME_CLASS_MAP ? saved : "dark";
    setThemeState(initial);
    applyThemeClass(initial);
    setMounted(true);
  }, []);

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next);
    applyThemeClass(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: ThemeName = prev === "dark" ? "light" : "dark";
      applyThemeClass(next);
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  // Avoid flash of wrong theme during SSR hydration
  // Children still render (for SEO / streaming), but theme class is applied
  // synchronously on the client before paint via the useEffect above.

  return (
    <ThemeContext.Provider
      value={{
        theme,
        dark: theme === "dark",
        toggleTheme,
        setTheme,
      }}
    >
      {/*
        Suppress the very brief unstyled flash on first load.
        Once mounted, the correct theme class is on <html>.
      */}
      <div style={{ visibility: mounted ? "visible" : "hidden" }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}