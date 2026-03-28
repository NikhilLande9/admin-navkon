"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [isDark, setIsDark] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Sync theme and auth
    const savedTheme = localStorage.getItem("navkon_theme");
    setIsDark(savedTheme !== "light");

    const isLoggedIn = localStorage.getItem("isLoggedIn") || sessionStorage.getItem("isLoggedIn");
    if (isLoggedIn) {
      router.push("/dashboard");
    } else {
      setMounted(true);
    }
  }, [router]);

  const handleLogin = async () => {
    setError("");
    setIsLoading(true);

    if (email.trim().toLowerCase() === "admin" && password === "123456") {
      if (remember) {
        localStorage.setItem("isLoggedIn", "true");
      } else {
        sessionStorage.setItem("isLoggedIn", "true");
      }
      setTimeout(() => router.push("/dashboard"), 600);
    } else {
      setTimeout(() => {
        setError("Invalid username or password.");
        setIsLoading(false);
      }, 400);
    }
  };

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem("navkon_theme", nextDark ? "dark" : "light");
  };

  if (!mounted) return null;

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 font-sans
      ${isDark ? 'bg-background text-foreground theme-dark' : 'bg-background text-foreground'}`}>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 px-4 py-2 bg-surface border border-border rounded-xl text-sm font-mono text-ink-muted hover:text-orange hover:border-orange transition-all z-50 active:scale-95"
      >
        {isDark ? "☀ Light" : "☾ Dark"}
      </button>

      <div className="relative z-10 w-full max-w-90 px-6">
        <div className={`bg-surface border border-border rounded-2xl p-10 shadow-xl transition-all
          ${isDark ? 'shadow-black/40' : 'shadow-slate-900/5'}`}>

          {/* Canonical v4 Accents */}
          <div className="flex justify-center mb-8">
            <div className="h-0.75 w-12 bg-linear-to-r from-orange to-green rounded-full" />
          </div>

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="font-serif text-3xl tracking-tighter mb-1">
              <span className="text-orange">Nav</span>
              <span className="text-green">kon</span>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[2px] text-ink-muted">
              Admin Console
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim mb-2">Username</div>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin"
                disabled={isLoading}
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm font-mono focus:border-orange outline-none transition-colors"
              />
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim mb-2">Password</div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm font-mono focus:border-orange outline-none transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red/10 border border-red text-red text-[11px] px-4 py-2.5 rounded-xl font-sans">
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={isLoading || !email || !password}
              className="w-full bg-orange hover:bg-orange-mid disabled:opacity-50 transition-all text-white font-medium py-3.5 rounded-xl text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange/20 active:scale-[0.98]"
            >
              {isLoading ? "Verifying..." : "Sign In →"}
            </button>
          </div>

          <div className="text-center mt-8 font-mono text-[9px] text-ink-ghost tracking-widest">
            NAVKON LABS · INTERNAL PORTAL
          </div>
        </div>
      </div>
    </div>
  );
}