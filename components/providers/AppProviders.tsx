"use client";

import { ThemeProvider } from "@/components/providers/Theme";

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ThemeProvider>{children}</ThemeProvider>;
}