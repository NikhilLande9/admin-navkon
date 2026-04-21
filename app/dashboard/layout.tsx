"use client";

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

  // Auth guard
  useEffect(() => {
    const isLoggedIn =
      localStorage.getItem("isLoggedIn") ||
      sessionStorage.getItem("isLoggedIn");

    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-mono">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-3 sm:p-4 md:p-6 bg-background overflow-y-auto pb-24 lg:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}