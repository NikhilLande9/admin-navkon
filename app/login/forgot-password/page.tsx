"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const savedTheme = localStorage.getItem("navkon_theme");
    setIsDark(savedTheme !== "light");
    setMounted(true);
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleReset = async () => {
    setError("");
    if (!email.trim()) return setError("Please enter your email address.");

    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email.trim(), {
        url: `${window.location.origin}/login`, // Redirect after password reset
        handleCodeInApp: false,
      });
      setSuccess(true);
      setCountdown(60); // 60s before resend
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/user-not-found" || code === "auth/invalid-email") {
        // Don't reveal if email exists — security best practice
        setSuccess(true);
        setCountdown(60);
      } else if (code === "auth/too-many-requests") {
        setError("Too many requests. Please wait before trying again.");
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError("");
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim(), {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });
      setCountdown(60);
    } catch {
      setError("Failed to resend. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem("navkon_theme", nextDark ? "dark" : "light");
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
              Reset Password
            </div>
          </div>

          {!success ? (
            <div className="space-y-4 sm:space-y-6">
              <p className="font-mono text-[11px] sm:text-xs text-ink-muted text-center leading-relaxed">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>

              <div>
                <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-ink-dim mb-2">
                  Email Address
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && email && !isLoading && handleReset()}
                  placeholder="you@example.com"
                  disabled={isLoading}
                  className="w-full bg-surface2 border border-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-mono focus:border-orange outline-none transition-colors"
                />
              </div>

              {error && (
                <div className="bg-red/10 border border-red text-red text-[10px] sm:text-[11px] px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-sans">
                  {error}
                </div>
              )}

              <button
                onClick={handleReset}
                disabled={isLoading || !email}
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
                    <span>Sending...</span>
                  </>
                ) : (
                  "Send Reset Link →"
                )}
              </button>

              <div className="text-center">
                <a
                  href="/login"
                  className="font-mono text-[10px] sm:text-xs text-ink-muted hover:text-orange transition-colors"
                >
                  ← Back to Sign In
                </a>
              </div>
            </div>
          ) : (
            /* Success State */
            <div className="space-y-6 text-center">
              {/* Email Icon */}
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-2xl bg-orange/10 border border-orange/20 flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-orange"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>

              <div>
                <div className="font-serif text-lg text-foreground mb-2">Check your inbox</div>
                <p className="font-mono text-[11px] text-ink-muted leading-relaxed">
                  If an account exists for{" "}
                  <span className="text-orange">{email}</span>, a password reset link has been sent.
                </p>
              </div>

              <div className="p-3 bg-surface2 border border-border rounded-xl">
                <div className="font-mono text-[10px] text-ink-muted space-y-1">
                  <div>• Check your spam/junk folder</div>
                  <div>• Link expires in 1 hour</div>
                  <div>• You&apos;ll be redirected to login after reset</div>
                </div>
              </div>

              {error && (
                <div className="bg-red/10 border border-red text-red text-[10px] px-3 py-2 rounded-xl font-sans">
                  {error}
                </div>
              )}

              <button
                onClick={handleResend}
                disabled={isLoading || countdown > 0}
                className="w-full bg-surface2 hover:border-orange disabled:opacity-50 disabled:cursor-not-allowed border border-border transition-all text-ink-muted hover:text-orange font-mono py-2.5 rounded-xl text-xs tracking-wider active:scale-[0.98]"
              >
                {countdown > 0 ? `Resend in ${countdown}s` : isLoading ? "Sending..." : "Resend Email"}
              </button>

              <a
                href="/login"
                className="block font-mono text-[10px] sm:text-xs text-orange hover:text-orange-mid transition-colors"
              >
                ← Back to Sign In
              </a>
            </div>
          )}

          <div className="text-center mt-6 sm:mt-8 font-mono text-[8px] sm:text-[9px] text-ink-ghost tracking-wider sm:tracking-widest">
            NAVKON LABS · INTERNAL PORTAL
          </div>
        </div>
      </div>
    </div>
  );
}