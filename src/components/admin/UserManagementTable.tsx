"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  ShieldCheck,
  UserX,
  UserCheck,
  Calendar,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { UserProfile, UserRole } from "@/data/contracts/auth";
import { adminService, authService } from "@/data/services";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { UserFormModal } from "./UserFormModal";
import { RoleAssignmentModal } from "./RoleAssignmentModal";
import { canDeactivateUser } from "@/lib/permissions";

export const UserManagementTable: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentActor, setCurrentActor] = useState<UserProfile | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [roleModalUser, setRoleModalUser] = useState<UserProfile | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const [userRes, actor] = await Promise.all([
        adminService.getUsers({
          search: search.trim() || undefined,
          role: roleFilter,
          isActive: statusFilter === "all" ? "all" : statusFilter === "active",
        }),
        authService.getCurrentUser(),
      ]);
      setUsers(userRes.items);
      setCurrentActor(actor);
    } catch {
      setActionError("Failed to load user directory.");
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleActive = async (targetUser: UserProfile) => {
    setActionError(null);
    if (!canDeactivateUser(currentActor, targetUser)) {
      setActionError("You do not have permission to modify the active status of this account.");
      return;
    }

    try {
      if (targetUser.isActive) {
        await adminService.deactivateUser(targetUser.id);
      } else {
        await adminService.reactivateUser(targetUser.id);
      }
      loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <span>User Management & RBAC</span>
          </h1>
          <p className="text-xs text-text-secondary">
            Directory of registered researchers, operators, and platform administrators
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Create User Account
        </Button>
      </div>

      {/* Security Architecture Reminder */}
      <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs text-text-secondary flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-text-primary block font-semibold">
            University Research Governance & Role Ceiling
          </strong>
          <p className="text-[11px] leading-relaxed">
            Public self-registration is permanently disabled. Administrators provision authorized research staff.
            Super Admin privileges are strictly restricted to project leads per <code>07-AUTH-AND-RBAC.md §5</code>.
          </p>
        </div>
      </div>

      {actionError && (
        <div className="p-3 rounded-lg border border-danger/30 bg-danger/10 text-xs text-danger flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full ps-9 pe-3 py-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <Search className="w-4 h-4 text-text-secondary absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
                className="w-full ps-9 pe-3 py-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="all">All Roles (Any)</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="researcher">Researcher</option>
                <option value="operator">Operator</option>
                <option value="viewer">Viewer</option>
              </select>
              <Filter className="w-4 h-4 text-text-secondary absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
                className="w-full ps-9 pe-3 py-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="all">All Account Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Deactivated Only</option>
              </select>
              <Filter className="w-4 h-4 text-text-secondary absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">User Directory</CardTitle>
              <CardDescription>
                Showing {users.length} registered platform account(s)
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="border-y border-border bg-surface-secondary/50 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Platform Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-text-secondary">
                      Loading user accounts...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-text-secondary">
                      No matching user accounts found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const isSelf = currentActor?.id === user.id;
                    const canDeactivate = canDeactivateUser(currentActor, user);

                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-surface-secondary/40 transition-colors ${
                          !user.isActive ? "opacity-60 bg-surface-secondary/20" : ""
                        }`}
                      >
                        {/* Name & Email */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                              {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-text-primary truncate flex items-center gap-1.5">
                                <span>{user.fullName || "Unnamed User"}</span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-primary/10 text-primary font-bold">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-text-secondary truncate block">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3 px-4">
                          <StatusBadge status={user.role} size="sm" showDot={false} />
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {user.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Deactivated
                            </span>
                          )}
                        </td>

                        {/* Created Date */}
                        <td className="py-3 px-4 text-text-secondary whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-text-secondary/70" />
                            <span>{user.createdAt.split("T")[0]}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-end whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Change Role Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRoleModalUser(user)}
                              disabled={isSelf}
                              leftIcon={<ShieldCheck className="w-3 h-3" />}
                              title={
                                isSelf
                                  ? "Cannot modify own role"
                                  : `Change role for ${user.fullName || user.email}`
                              }
                            >
                              Role
                            </Button>

                            {/* Deactivate / Reactivate */}
                            {user.isActive ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleActive(user)}
                                disabled={!canDeactivate}
                                className="text-danger hover:bg-danger/10 hover:border-danger/30"
                                leftIcon={<UserX className="w-3 h-3" />}
                                title={
                                  !canDeactivate
                                    ? "Cannot deactivate this account"
                                    : "Deactivate account"
                                }
                              >
                                Deactivate
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleActive(user)}
                                className="text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-950/30"
                                leftIcon={<UserCheck className="w-3 h-3" />}
                              >
                                Activate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <UserFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={loadData}
        currentActor={currentActor}
      />

      <RoleAssignmentModal
        isOpen={!!roleModalUser}
        onClose={() => setRoleModalUser(null)}
        targetUser={roleModalUser}
        currentActor={currentActor}
        onRoleUpdated={loadData}
      />
    </div>
  );
};
