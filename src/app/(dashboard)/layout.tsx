import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { requireDashboardUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await requireDashboardUser();
  return <AppShell currentUser={currentUser}>{children}</AppShell>;
}
