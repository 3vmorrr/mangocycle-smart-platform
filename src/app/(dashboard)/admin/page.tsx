"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  Building2,
  GitCommit,
  ScrollText,
  Sliders,
  Settings,
  ArrowRight,
  Shield,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { UserProfile, UserRole, hasMinimumRole } from "@/data/contracts/auth";
import { authService, adminService } from "@/data/services";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userCount, setUserCount] = useState<number>(0);
  const [auditCount, setAuditCount] = useState<number>(0);

  useEffect(() => {
    Promise.all([
      authService.getCurrentUser(),
      adminService.getUsers({ pageSize: 1 }),
      adminService.getAuditLogs({ pageSize: 1 }),
    ]).then(([user, usersRes, logsRes]) => {
      setCurrentUser(user);
      setUserCount(usersRes.total);
      setAuditCount(logsRes.total);
    });
  }, []);

  const isSuperAdmin = currentUser?.role === "super_admin";

  const adminCards = [
    {
      title: "User Management",
      description: "Provision research accounts, assign RBAC roles, and manage active status.",
      href: "/admin/users",
      icon: Users,
      badge: `${userCount} Registered`,
      minRole: "admin",
    },
    {
      title: "Audit Trail",
      description: "Inspect recorded security, authentication, and state change prototype event logs.",
      href: "/admin/audit-logs",
      icon: ScrollText,
      badge: `${auditCount} Events`,
      minRole: "admin",
    },
    {
      title: "Waste Sources Registry",
      description: "Manage registered university farms, juice factories, and industrial suppliers.",
      href: "/admin/sources",
      icon: Building2,
      badge: "6 Active Sources",
      minRole: "admin",
    },
    {
      title: "Processing Stages",
      description: "Review canonical linear stage pipeline definitions and validation order.",
      href: "/admin/stages",
      icon: GitCommit,
      badge: "8 Stages",
      minRole: "admin",
    },
    {
      title: "AI Configuration",
      description: "Inference provider endpoints, vision models, and rate limit protections.",
      href: "/admin/ai-config",
      icon: Sliders,
      badge: "Configured",
      minRole: "admin",
    },
    {
      title: "System Settings",
      description: "Global platform metadata, contact info, and scientific governance parameters.",
      href: "/admin/settings",
      icon: Settings,
      badge: isSuperAdmin ? "Full Access" : "Super Admin Only",
      minRole: "super_admin",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span>Administration Center</span>
        </h1>
        <p className="text-xs text-text-secondary">
          Governance, security policies, user access control, and platform infrastructure per 07-AUTH-AND-RBAC.md
        </p>
      </div>

      {/* Security Context Banner */}
      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-xs text-text-primary">Current Session Identity:</strong>
              <span className="text-xs font-semibold text-primary">{currentUser?.fullName || "Staff Account"}</span>
              <StatusBadge status={currentUser?.role || "viewer"} size="sm" showDot={false} />
            </div>
            <p className="text-[11px] text-text-secondary pt-0.5 leading-relaxed">
              Frontend RBAC controls interface visibility. Authoritative enforcement is handled server-side via Supabase and database RLS.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Admin Submodules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminCards.map((card) => {
          const Icon = card.icon;
          const hasAccess = currentUser ? hasMinimumRole(currentUser.role, card.minRole as UserRole) : false;

          return (
            <Link
              key={card.href}
              href={card.href}
              className={`block group transition-transform ${hasAccess ? "hover:-translate-y-0.5" : "opacity-75"}`}
            >
              <Card className="h-full border-border/80 hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-secondary text-text-secondary border border-border">
                      {card.badge}
                    </span>
                  </div>
                  <CardTitle className="text-sm text-text-primary group-hover:text-primary transition-colors flex items-center justify-between">
                    <span>{card.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-primary" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-text-secondary pt-0">
                  <p className="leading-relaxed">{card.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
