"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import { auth } from "@/lib/firebase";

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
    const savedTheme = localStorage.getItem("navkon_theme");
    setIsDark(savedTheme !== "light");

    // Load the remember preference
    const savedRemember = localStorage.getItem("navkon_remember");
    setRemember(savedRemember === "true");

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        if (user.emailVerified) {
          // Fully verified — go to dashboard
          router.push("/dashboard");
        } else {
          // Stale unverified session (left over from a previous registration).
          // Sign it out silently and show the login form normally.
          await auth.signOut();
          setMounted(true);
        }
      } else {
        setMounted(true);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogin = async () => {
    setError("");
    setIsLoading(true);

    try {
      // Set persistence BEFORE signing in
      if (remember) {
        // browserLocalPersistence = session persists across browser restarts
        await setPersistence(auth, browserLocalPersistence);
        localStorage.setItem("navkon_remember", "true");
      } else {
        // browserSessionPersistence = session cleared when browser closes
        await setPersistence(auth, browserSessionPersistence);
        localStorage.removeItem("navkon_remember");
      }

      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setError("Please verify your email before signing in. Check your inbox.");
        await auth.signOut();
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential"
      ) {
        setError("Invalid email or password.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many failed attempts. Try again later or reset your password.");
      } else if (code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError("Sign in failed. Please try again.");
      }
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem("navkon_theme", nextDark ? "dark" : "light");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && email && password && !isLoading) {
      handleLogin();
    }
  };

  if (!mounted) return null;

  return (
    <div
      className={`min-h-screen flex items-center justify-center transition-colors duration-300 font-sans p-4 sm:p-6
      ${isDark ? "bg-background text-foreground theme-dark" : "bg-background text-foreground"}`}
    >
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 sm:top-6 sm:right-6 px-3 sm:px-4 py-1.5 sm:py-2 bg-surface border border-border rounded-lg sm:rounded-xl text-xs sm:text-sm font-mono text-ink-muted hover:text-orange hover:border-orange transition-all z-50 active:scale-95"
      >
        <span className="hidden xs:inline">{isDark ? "☀ Light" : "☾ Dark"}</span>
        <span className="xs:hidden">{isDark ? "☀" : "☾"}</span>
      </button>

      <div className="relative z-10 w-full max-w-md px-4 sm:px-6">
        <div
          className={`bg-surface border border-border rounded-xl sm:rounded-2xl p-6 sm:p-10 shadow-xl transition-all
          ${isDark ? "shadow-black/40" : "shadow-slate-900/5"}`}
        >
          {/* Accent Bar */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div
              className="h-1 w-10 sm:w-12 rounded-full"
              style={{ background: "linear-gradient(to right, var(--orange), var(--green))" }}
            />
          </div>

          {/* Logo */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="font-serif text-2xl sm:text-3xl tracking-tighter mb-1">
              <span className="text-orange">Nav</span>
              <span className="text-green">kon</span>
            </div>
            <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[1.5px] sm:tracking-[2px] text-ink-muted">
              Admin Console
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div>
              <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider sm:tracking-widest text-ink-dim mb-2">
                Email
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="you@example.com"
                disabled={isLoading}
                className="w-full bg-surface2 border border-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-mono focus:border-orange outline-none transition-colors"
              />
            </div>

            <div>
              <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider sm:tracking-widest text-ink-dim mb-2">
                Password
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full bg-surface2 border border-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-mono focus:border-orange outline-none transition-colors"
              />
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 accent-orange cursor-pointer"
                />
                <label
                  htmlFor="remember"
                  className="font-mono text-[10px] sm:text-xs text-ink-muted cursor-pointer select-none"
                >
                  Remember me
                </label>
              </div>
              <a
                href="/login/forgot-password"
                className="font-mono text-[10px] sm:text-xs text-orange hover:text-orange-mid transition-colors"
              >
                Forgot password?
              </a>
            </div>

            {error && (
              <div className="bg-red/10 border border-red text-red text-[10px] sm:text-[11px] px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-sans">
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={isLoading || !email || !password}
              className="w-full bg-orange hover:bg-orange-mid disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white font-medium py-3 sm:py-3.5 rounded-xl text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange/20 active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Verifying...</span>
                </>
              ) : (
                "Sign In →"
              )}
            </button>

            {/* Create Account Link */}
            <div className="text-center">
              <span className="font-mono text-[10px] sm:text-xs text-ink-muted">
                Don&apos;t have an account?{" "}
              </span>
              <a
                href="/login/register"
                className="font-mono text-[10px] sm:text-xs text-orange hover:text-orange-mid transition-colors"
              >
                Create one →
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 sm:mt-8 font-mono text-[8px] sm:text-[9px] text-ink-ghost tracking-wider sm:tracking-widest">
            NAVKON LABS · INTERNAL PORTAL
          </div>
        </div>

        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-[10px] sm:text-xs text-ink-muted font-mono">
            Secure access to Navkon administration portal
          </p>
        </div>
      </div>
    </div>
  );
}