//app\login\verify-email\page.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { sendEmailVerification, onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [error, setError] = useState("");
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("navkon_theme");
    setIsDark(savedTheme !== "light");
    setMounted(true);
  }, []);

  // Countdown for resend button
  useEffect(() => {
    if (resendCountdown > 0) {
      const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCountdown]);

  // Poll for email verification every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const user = auth.currentUser;
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          // Update Firestore
          await updateDoc(doc(db, "users", user.uid), { emailVerified: true });
          clearInterval(interval);
          router.push("/dashboard");
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  const handleCheckVerification = async () => {
    setError("");
    setIsChecking(true);

    try {
      const user = auth.currentUser;
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          await updateDoc(doc(db, "users", user.uid), { emailVerified: true });
          router.push("/dashboard");
        } else {
          setError("Email not verified yet. Please check your inbox and click the link.");
        }
      } else {
        // User might have been signed out — redirect to login
        router.push("/login");
      }
    } catch {
      setError("Failed to check verification status.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;
    setError("");
    setIsResending(true);
    setResendSuccess(false);

    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        setResendCountdown(60);
        setResendSuccess(true);
      } else {
        router.push("/login");
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/too-many-requests") {
        setError("Too many requests. Please wait before resending.");
      } else {
        setError("Failed to resend verification email.");
      }
    } finally {
      setIsResending(false);
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
              Verify Email
            </div>
          </div>

          <div className="space-y-6 text-center">
            {/* Animated Email Icon */}
            <div className="flex justify-center">
              <div className="relative w-16 h-16 rounded-2xl bg-orange/10 border border-orange/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                {/* Pulsing dot */}
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange rounded-full">
                  <span className="absolute inset-0 rounded-full bg-orange animate-ping opacity-75" />
                </span>
              </div>
            </div>

            <div>
              <div className="font-serif text-lg text-foreground mb-2">Verify your email</div>
              <p className="font-mono text-[11px] text-ink-muted leading-relaxed">
                We sent a verification link to{" "}
                {emailParam && <span className="text-orange block mt-1">{emailParam}</span>}
              </p>
            </div>

            <div className="p-3 bg-surface2 border border-border rounded-xl text-left">
              <div className="font-mono text-[10px] text-ink-muted space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-orange mt-px">1.</span>
                  <span>Open your email inbox</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange mt-px">2.</span>
                  <span>Click the verification link from Navkon</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange mt-px">3.</span>
                  <span>Return here — you&apos;ll be redirected automatically</span>
                </div>
              </div>
            </div>

            {/* Auto-checking indicator */}
            <div className="flex items-center justify-center gap-2 font-mono text-[10px] text-ink-dim">
              <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
              Checking automatically every 5 seconds...
            </div>

            {error && (
              <div className="bg-red/10 border border-red text-red text-[10px] px-3 py-2 rounded-xl font-sans">
                {error}
              </div>
            )}

            {resendSuccess && (
              <div className="bg-green/10 border border-green text-green text-[10px] px-3 py-2 rounded-xl font-sans">
                Verification email resent successfully!
              </div>
            )}

            {/* Manual Check Button */}
            <button
              onClick={handleCheckVerification}
              disabled={isChecking}
              className="w-full bg-orange hover:bg-orange-mid disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white font-medium py-3 rounded-xl text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange/20 active:scale-[0.98]"
            >
              {isChecking ? (
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
                  <span>Checking...</span>
                </>
              ) : (
                "I've Verified My Email →"
              )}
            </button>

            {/* Resend */}
            <button
              onClick={handleResend}
              disabled={isResending || resendCountdown > 0}
              className="w-full bg-surface2 hover:border-orange disabled:opacity-50 disabled:cursor-not-allowed border border-border transition-all text-ink-muted hover:text-orange font-mono py-2.5 rounded-xl text-xs tracking-wider active:scale-[0.98]"
            >
              {resendCountdown > 0
                ? `Resend in ${resendCountdown}s`
                : isResending
                ? "Sending..."
                : "Resend Verification Email"}
            </button>

            <a
              href="/login"
              className="block font-mono text-[10px] sm:text-xs text-ink-muted hover:text-orange transition-colors"
            >
              ← Back to Sign In
            </a>
          </div>

          <div className="text-center mt-6 sm:mt-8 font-mono text-[8px] sm:text-[9px] text-ink-ghost tracking-wider sm:tracking-widest">
            NAVKON LABS · INTERNAL PORTAL
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}