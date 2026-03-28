import type { Metadata } from "next";
import { DM_Mono, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import AppProviders from "@/components/providers/AppProviders";

// ── Navkon Brand Fonts ────────────────────────────────────────────────────
const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Navkon Admin",
  description: "Enterprise Admin Dashboard · Navkon Labs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmMono.variable} ${dmSerif.variable} antialiased`}>
        {/*
          AppProviders is a "use client" component that:
          - Reads navkon_theme from localStorage on mount
          - Applies the correct theme class to <html> (e.g. "theme-dark")
          - Exposes ThemeContext ({ dark, toggleTheme }) to the entire tree
        */}
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}