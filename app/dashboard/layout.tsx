"use client";

// app/dashboard/layout.tsx
//
// Thin layout wrapper — auth guard + Sidebar + Topbar.
// Theme is owned by AppProviders (components/providers/AppProviders.tsx).
// Import useTheme from there, NOT from this file.

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  // ── Auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    const isLoggedIn =
      localStorage.getItem("isLoggedIn") ||
      sessionStorage.getItem("isLoggedIn");

    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [router]);

  // ── Layout ──────────────────────────────────────────────────────────────
  // All color values use CSS variables defined in globals.css.
  // Theme class (.theme-dark etc.) is applied to <html> by AppProviders.
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "var(--background)",
        color: "var(--foreground)",
        fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)",
        transition: "background 0.3s, color 0.3s",
        overflow: "hidden",
      }}
    >
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar />
        <main
          style={{
            flex: 1,
            padding: 24,
            background: "var(--background)",
            overflowY: "auto",
            transition: "background 0.3s",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}