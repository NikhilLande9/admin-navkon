//app\login\register\page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [isDark, setIsDark] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("navkon_theme");
    setIsDark(savedTheme !== "light");

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.emailVerified) {
        router.push("/dashboard");
      } else {
        setMounted(true);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const validatePassword = (pw: string) => {
    if (pw.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(pw)) return "Password must include at least one uppercase letter.";
    if (!/[0-9]/.test(pw)) return "Password must include at least one number.";
    return null;
  };

  const handleRegister = async () => {
    setError("");

    if (!name.trim()) return setError("Please enter your name.");
    if (!email.trim()) return setError("Please enter your email.");

    const pwError = validatePassword(password);
    if (pwError) return setError(pwError);

    if (password !== confirm) return setError("Passwords do not match.");

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // Set display name
      await updateProfile(user, { displayName: name.trim() });

      // Save user profile to Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: "admin",
        createdAt: serverTimestamp(),
        emailVerified: false,
      });

      // Send email verification
      await sendEmailVerification(user, {
        url: "http://localhost:3000/login",
        handleCodeInApp: false,
        });

      // NOTE: Do NOT sign out here.
      // We keep the user signed in so verify-email page can call
      // user.reload() and resend the verification email via auth.currentUser.
      // The user is effectively blocked from the dashboard until emailVerified === true.

      router.push("/login/verify-email?email=" + encodeURIComponent(email.trim()));
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else if (code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (code === "auth/weak-password") {
        setError("Password is too weak. Use at least 8 characters.");
      } else {
        setError("Registration failed. Please try again.");
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
    if (e.key === "Enter" && name && email && password && confirm && !isLoading) {
      handleRegister();
    }
  };

  const passwordStrength = () => {
    if (!password) return null;
    if (password.length < 6) return { label: "Weak", color: "text-red", width: "w-1/4" };
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password))
      return { label: "Fair", color: "text-yellow-500", width: "w-2/4" };
    return { label: "Strong", color: "text-green", width: "w-full" };
  };

  const strength = passwordStrength();

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
              Create Account
            </div>
          </div>

          <div className="space-y-4 sm:space-y-5">
            {/* Name */}
            <div>
              <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-ink-dim mb-2">
                Full Name
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="John Doe"
                disabled={isLoading}
                className="w-full bg-surface2 border border-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-mono focus:border-orange outline-none transition-colors"
              />
            </div>

            {/* Email */}
            <div>
              <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-ink-dim mb-2">
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

            {/* Password */}
            <div>
              <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-ink-dim mb-2">
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
              {/* Password Strength Indicator */}
              {strength && (
                <div className="mt-2">
                  <div className="h-1 w-full bg-surface2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strength.width} ${
                        strength.label === "Weak"
                          ? "bg-red"
                          : strength.label === "Fair"
                          ? "bg-yellow-500"
                          : "bg-green"
                      }`}
                    />
                  </div>
                  <div className={`font-mono text-[9px] mt-1 ${strength.color}`}>{strength.label}</div>
                </div>
              )}
              <div className="font-mono text-[9px] text-ink-ghost mt-1">
                Min 8 chars, 1 uppercase, 1 number
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-ink-dim mb-2">
                Confirm Password
              </div>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="••••••••"
                disabled={isLoading}
                className={`w-full bg-surface2 border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-mono outline-none transition-colors
                  ${confirm && confirm !== password ? "border-red focus:border-red" : "border-border focus:border-orange"}`}
              />
              {confirm && confirm !== password && (
                <div className="font-mono text-[9px] text-red mt-1">Passwords do not match</div>
              )}
            </div>

            {error && (
              <div className="bg-red/10 border border-red text-red text-[10px] sm:text-[11px] px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-sans">
                {error}
              </div>
            )}

            <button
              onClick={handleRegister}
              disabled={isLoading || !name || !email || !password || !confirm}
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
                  <span>Creating account...</span>
                </>
              ) : (
                "Create Account →"
              )}
            </button>

            <div className="text-center">
              <span className="font-mono text-[10px] sm:text-xs text-ink-muted">Already have an account? </span>
              <a href="/login" className="font-mono text-[10px] sm:text-xs text-orange hover:text-orange-mid transition-colors">
                Sign in →
              </a>
            </div>
          </div>

          <div className="text-center mt-6 sm:mt-8 font-mono text-[8px] sm:text-[9px] text-ink-ghost tracking-wider sm:tracking-widest">
            NAVKON LABS · INTERNAL PORTAL
          </div>
        </div>

        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-[10px] sm:text-xs text-ink-muted font-mono">
            A verification email will be sent after registration
          </p>
        </div>
      </div>
    </div>
  );
}