"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";

export type ThemeName = "light" | "dark" | "navkon" | "emerald";

const THEME_CLASS_MAP: Record<ThemeName, string> = {
  light: "",
  dark: "theme-dark",
  navkon: "theme-navkon",
  emerald: "theme-emerald",
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
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within AppProviders");
  }
  return context;
}

function applyTheme(theme: ThemeName) {
  const html = document.documentElement;
  // Remove all theme classes
  Object.values(THEME_CLASS_MAP).forEach((cls) => {
    if (cls) html.classList.remove(cls);
  });
  // Add new one
  const className = THEME_CLASS_MAP[theme];
  if (className) html.classList.add(className);
}

export default function AppProviders({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("dark");
  const [mounted, setMounted] = useState(false);

  // Load saved theme
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
    const initialTheme: ThemeName = saved && saved in THEME_CLASS_MAP ? saved : "dark";

    setThemeState(initialTheme);
    applyTheme(initialTheme);
    setMounted(true);
  }, []);

  const setTheme = useCallback((newTheme: ThemeName) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, dark: theme === "dark", toggleTheme, setTheme }}>
      {/* Prevent hydration mismatch flash */}
      <div style={{ visibility: mounted ? "visible" : "hidden" }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}