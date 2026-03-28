"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [dark, setDark] = useState(true);

  // Load theme preference even on login page
  useEffect(() => {
    const savedTheme = localStorage.getItem("navkon_theme");
    setDark(savedTheme !== "light");

    // If already logged in, skip login
    const loggedIn =
      localStorage.getItem("isLoggedIn") ||
      sessionStorage.getItem("isLoggedIn");
    if (loggedIn) router.push("/dashboard");
  }, [router]);

  const DARK_VARS = `
    --bg: #0a0e18; --surface: #141824; --surface2: #1a1f2e;
    --border: #2a3040; --ink: #e2e8f0; --ink-soft: #94a3b8;
    --ink-muted: #64748b; --ink-dim: #475569;
    --orange: #F97316; --orange-dim: #F9731618; --orange-border: #F9731640;
    --green: #10B981; --green-dim: #10B98115; --green-border: #10B98135;
    --red: #f87171;
  `;
  const LIGHT_VARS = `
    --bg: #faf8f5; --surface: #ffffff; --surface2: #f2ede6;
    --border: #e4ddd5; --ink: #0F172A; --ink-soft: #475569;
    --ink-muted: #64748b; --ink-dim: #94A3B4;
    --orange: #F97316; --orange-dim: #FFEDD5; --orange-border: #F9731650;
    --green: #10B981; --green-dim: #D1FAE5; --green-border: #10B98150;
    --red: #b84040;
  `;

  const handleLogin = () => {
    setError("");
    // Credentials: username "admin", password "123456"
    // Accept email field value as username (trimmed, case-insensitive)
    const user = email.trim().toLowerCase();
    const pass = password.trim();

    if (user === "admin" && pass === "123456") {
      if (remember) {
        localStorage.setItem("isLoggedIn", "true");
        sessionStorage.removeItem("isLoggedIn");
      } else {
        sessionStorage.setItem("isLoggedIn", "true");
        localStorage.removeItem("isLoggedIn");
      }
      router.push("/dashboard");
    } else {
      setError("Invalid username or password.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=DM+Serif+Display&family=Syne:wght@700;800&display=swap');
        :root { ${dark ? DARK_VARS : LIGHT_VARS} }
        * { box-sizing: border-box; }
        body { margin: 0; background: var(--bg); transition: background 0.3s; }
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 9999;
          opacity: ${dark ? "0.025" : "0.04"};
        }
        .login-input {
          width: 100%;
          background: var(--surface2);
          border: 1px solid var(--border);
          color: var(--ink);
          padding: 11px 16px;
          border-radius: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
          margin-bottom: 12px;
        }
        .login-input:focus { border-color: var(--orange-border); }
        .login-input::placeholder { color: var(--ink-dim); }
        .login-btn {
          width: 100%;
          background: var(--orange);
          border: none;
          color: #fff;
          padding: 12px;
          border-radius: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.15s;
          letter-spacing: 0.5px;
        }
        .login-btn:hover { opacity: 0.88; }
        .theme-toggle {
          position: fixed;
          top: 20px;
          right: 20px;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--ink-soft);
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          transition: all 0.15s;
          z-index: 1000;
        }
        .theme-toggle:hover { border-color: var(--orange-border); color: var(--orange); }
        .check-custom {
          width: 15px; height: 15px;
          border: 1px solid var(--border);
          border-radius: 3px;
          background: var(--surface2);
          cursor: pointer;
          accent-color: var(--orange);
          flex-shrink: 0;
        }
      `}</style>

      {/* Theme toggle on login screen too */}
      <button
        className="theme-toggle"
        onClick={() => {
          const next = !dark;
          setDark(next);
          localStorage.setItem("navkon_theme", next ? "dark" : "light");
        }}
      >
        {dark ? "☀ Light" : "☾ Dark"}
      </button>

      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        fontFamily: "'DM Mono', monospace",
        transition: "background 0.3s",
      }}>

        {/* Decorative lines */}
        <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "10%", left: "-10%", width: "40%", height: "1px", background: `linear-gradient(90deg, transparent, var(--green), transparent)`, opacity: 0.3 }} />
          <div style={{ position: "absolute", bottom: "20%", right: "-5%", width: "30%", height: "1px", background: `linear-gradient(90deg, transparent, var(--orange), transparent)`, opacity: 0.3 }} />
        </div>

        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "40px 36px",
          width: 360,
          boxShadow: dark ? "0 24px 60px #00000060" : "0 12px 40px #0f172a18",
          position: "relative",
        }}>
          {/* Top accent line */}
          <div style={{ position: "absolute", top: 0, left: 24, right: 24, height: 2, background: `linear-gradient(90deg, var(--orange), var(--green))`, borderRadius: "0 0 2px 2px" }} />

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 26,
              letterSpacing: "-0.5px",
              marginBottom: 4,
            }}>
              <span style={{ color: "var(--orange)" }}>Nav</span><span style={{ color: "var(--green)" }}>kon</span>
            </div>
            <div style={{ fontSize: 10, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "2px" }}>Admin Console</div>
          </div>

          {/* Green rule */}
          <div style={{ height: 1, background: "var(--green)", opacity: 0.35, marginBottom: 28, borderRadius: 1 }} />

          <div style={{ fontSize: 10, color: "var(--ink-dim)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 6 }}>Username</div>
          <input
            className="login-input"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="admin"
            autoComplete="username"
          />

          <div style={{ fontSize: 10, color: "var(--ink-dim)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 6 }}>Password</div>
          <input
            className="login-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="••••••••"
            autoComplete="current-password"
          />

          {/* Remember Me — FIXED: properly persists to localStorage */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, marginTop: 4 }}>
            <input
              type="checkbox"
              className="check-custom"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              id="rememberMe"
            />
            <label htmlFor="rememberMe" style={{ fontSize: 12, color: "var(--ink-muted)", cursor: "pointer", userSelect: "none" }}>
              Stay signed in
            </label>
          </div>

          {error && (
            <div style={{
              background: "var(--red-dim, #f8717115)",
              border: "1px solid var(--red)",
              color: "var(--red)",
              fontSize: 12,
              padding: "10px 14px",
              borderRadius: 6,
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <button className="login-btn" onClick={handleLogin}>
            Sign In →
          </button>

          <div style={{ textAlign: "center", marginTop: 20, fontSize: 10, color: "var(--ink-ghost, #334155)" }}>
            Navkon Labs · Internal Portal
          </div>
        </div>
      </div>
    </>
  );
}