"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type ThemeType =
  | "default"
  | "theme-dark"
  | "theme-navkon"
  | "theme-emerald";

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>("default");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as ThemeType | null;

    if (stored) {
      applyTheme(stored);
      setThemeState(stored);
    }
  }, []);

  const applyTheme = (theme: ThemeType) => {
    document.documentElement.className = theme;
    localStorage.setItem("theme", theme);
  };

  const setTheme = (theme: ThemeType) => {
    setThemeState(theme);
    applyTheme(theme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}