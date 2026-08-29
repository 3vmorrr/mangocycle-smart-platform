"use client";

import React, { useState } from "react";
import { X, ShieldCheck, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { UserRole, USER_ROLES, ROLE_DISPLAY_NAMES, UserProfile } from "@/data/contracts/auth";
import { adminService } from "@/data/services";
import { canAssignRole } from "@/lib/permissions";

interface RoleAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: UserProfile | null;
  currentActor: UserProfile | null;
  onRoleUpdated: () => void;
}

export const RoleAssignmentModal: React.FC<RoleAssignmentModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  currentActor,
  onRoleUpdated,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(targetUser?.role || "viewer");
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !targetUser) return null;

  const isSelf = currentActor?.id === targetUser.id;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (isSelf) {
      setFormError("Self-promotion or modifying your own role is not permitted per 07-AUTH-AND-RBAC.md §5.");
      return;
    }

    if (!canAssignRole(currentActor, selectedRole, targetUser.id)) {
      setFormError("You do not have sufficient privileges to assign this role level.");
      return;
    }

    setIsLoading(true);
    try {
      await adminService.updateUser(targetUser.id, { role: selectedRole });
      onRoleUpdated();
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to update user role.");
    } finally {
      setIsLoading(false);
    }
  };

  const availableRoles = USER_ROLES.filter((role) => {
    if (role === "super_admin") {
      return currentActor?.role === "super_admin";
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-2xl bg-surface border border-border shadow-2xl p-6 z-10 space-y-4 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-primary">Assign Platform Role</h3>
              <p className="text-[11px] text-text-secondary">
                Modify role permissions for {targetUser.fullName || targetUser.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSelf && (
          <div className="p-3 rounded-xl border border-danger/30 bg-danger/10 text-xs text-danger flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Role Escalation Rule:</strong> You cannot modify your own assigned role. Another administrator must make this change.
            </span>
          </div>
        )}

        <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 text-[11px] text-text-secondary flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>
            Role modifications are captured in the platform audit log with before/after state snapshots.
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="roleSelect" className="block text-xs font-semibold text-text-primary">
              Target Role Level <span className="text-danger">*</span>
            </label>
            <select
              id="roleSelect"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              disabled={isSelf}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
            >
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {ROLE_DISPLAY_NAMES[role]} ({role})
                </option>
              ))}
            </select>
          </div>

          {formError && (
            <div className="p-3 rounded-lg border border-danger/30 bg-danger/10 text-xs text-danger flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
              disabled={isSelf}
              leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
            >
              Update Role
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
