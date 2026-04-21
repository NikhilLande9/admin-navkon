"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/components/providers/AppProviders";
import type { NavPage } from "@/components/providers/AppProviders";

interface RoleGuardProps {
  page: NavPage;
  children: React.ReactNode;
}

/**
 * Wrap any dashboard page with <RoleGuard page="Billing"> to enforce
 * access control. Redirects to /dashboard if the user lacks permission.
 */
export default function RoleGuard({ page, children }: RoleGuardProps) {
  const router = useRouter();
  const { canAccess, roleLoading } = useRole();

  useEffect(() => {
    if (!roleLoading && !canAccess(page)) {
      router.replace("/dashboard");
    }
  }, [roleLoading, canAccess, page, router]);

  // While loading, render nothing (layout already shows skeleton)
  if (roleLoading) return null;

  // If no access, render nothing (redirect in progress)
  if (!canAccess(page)) return null;

  return <>{children}</>;
}