"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";

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
  // Remove all known theme classes
  Object.values(THEME_CLASS_MAP).forEach((cls) => { if (cls) html.classList.remove(cls); });
  const cls = THEME_CLASS_MAP[theme];
  if (cls) html.classList.add(cls);
}

export default function AppProviders({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
    const initial: ThemeName = saved === "light" || saved === "dark" ? saved : "dark";
    setThemeState(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next);
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, dark: theme === "dark", toggleTheme, setTheme }}>
      {/*
        Use opacity instead of visibility so layout doesn't collapse during SSR flash.
        Transition prevents the jarring pop-in.
      */}
      <div
        style={{
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.15s ease",
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}