"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, UserPlus, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createUserSchema, CreateUserFormInput } from "@/lib/validators/admin";
import { USER_ROLES, ROLE_DISPLAY_NAMES, UserProfile } from "@/data/contracts/auth";
import { adminService } from "@/data/services";
import { cn } from "@/lib/utils/cn";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
  currentActor: UserProfile | null;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onUserCreated,
  currentActor,
}) => {
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      fullName: "",
      role: "viewer",
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: CreateUserFormInput) => {
    setFormError(null);
    setIsLoading(true);
    try {
      await adminService.createUser(data);
      reset();
      onUserCreated();
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setIsLoading(false);
    }
  };

  // Only Super Admin can assign super_admin role
  const availableRoles = currentActor?.role === "super_admin"
    ? USER_ROLES
    : USER_ROLES.filter((r) => r !== "super_admin");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-surface border border-border shadow-2xl p-6 z-10 space-y-4 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-primary">Create User Account</h3>
              <p className="text-[11px] text-text-secondary">
                Admin-provisioned account registration per 07-AUTH-AND-RBAC.md §2.2
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

        <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 text-[11px] text-text-secondary flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>
            No public registration exists for this research platform. Accounts must be provisioned by authorized administrators.
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1">
            <label htmlFor="fullName" className="block text-xs font-semibold text-text-primary">
              Full Name <span className="text-danger">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              placeholder="e.g. Dr. Areej Al-Ghamdi"
              {...register("fullName")}
              className={cn(
                "w-full px-3 py-2 text-xs rounded-lg border bg-surface text-text-primary focus:outline-none focus:ring-2 transition-all",
                errors.fullName
                  ? "border-danger focus:ring-danger/20"
                  : "border-border focus:ring-primary/20 focus:border-primary"
              )}
            />
            {errors.fullName && (
              <p className="text-[11px] text-danger mt-1">{errors.fullName.message}</p>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <label htmlFor="email" className="block text-xs font-semibold text-text-primary">
              Email Address <span className="text-danger">*</span>
            </label>
            <input
              id="email"
              type="email"
              placeholder="e.g. researcher@mangocycle.local"
              {...register("email")}
              className={cn(
                "w-full px-3 py-2 text-xs rounded-lg border bg-surface text-text-primary focus:outline-none focus:ring-2 transition-all",
                errors.email
                  ? "border-danger focus:ring-danger/20"
                  : "border-border focus:ring-primary/20 focus:border-primary"
              )}
            />
            {errors.email && (
              <p className="text-[11px] text-danger mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Initial Role */}
          <div className="space-y-1">
            <label htmlFor="role" className="block text-xs font-semibold text-text-primary">
              Assigned Platform Role <span className="text-danger">*</span>
            </label>
            <select
              id="role"
              {...register("role")}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {ROLE_DISPLAY_NAMES[role]} {role === "viewer" ? "(Default)" : ""}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="text-[11px] text-danger mt-1">{errors.role.message}</p>
            )}
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
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            >
              Create Account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
