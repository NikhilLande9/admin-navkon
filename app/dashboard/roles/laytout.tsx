//app\dashboard\roles\laytout.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/components/providers/AppProviders";

export default function RolesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAdmin, roleLoading } = useRole();

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [isAdmin, roleLoading, router]);

  if (roleLoading || !isAdmin) return null;

  return <>{children}</>;
}