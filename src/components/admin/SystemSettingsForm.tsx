"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Settings, Save, AlertCircle, CheckCircle2, ShieldAlert, FlaskConical } from "lucide-react";
import { systemSettingsSchema, SystemSettingsFormInput } from "@/lib/validators/admin";
import { adminService, authService } from "@/data/services";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { UserProfile } from "@/data/contracts/auth";
import { cn } from "@/lib/utils/cn";

export const SystemSettingsForm: React.FC = () => {
  const [currentActor, setCurrentActor] = useState<UserProfile | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SystemSettingsFormInput>({
    resolver: zodResolver(systemSettingsSchema),
  });

  const loadData = React.useCallback(async () => {
    try {
      const [settings, actor] = await Promise.all([
        adminService.getSystemSettings(),
        authService.getCurrentUser(),
      ]);
      setCurrentActor(actor);
      reset({
        platformName: settings.platformName,
        organizationName: settings.organizationName,
        contactEmail: settings.contactEmail,
        publicTraceabilityEnabled: settings.publicTraceabilityEnabled,
      });
    } catch {
      setFormError("Failed to load application settings.");
    }
  }, [reset]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onSubmit = async (data: SystemSettingsFormInput) => {
    setFormError(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      await adminService.updateSystemSettings(data);
      setSuccessMessage("Application settings updated and recorded in audit log.");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to update settings.");
    } finally {
      setIsLoading(false);
    }
  };

  const isSuperAdmin = currentActor?.role === "super_admin";

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          <span>Application & System Settings</span>
        </h1>
        <p className="text-xs text-text-secondary">
          Global platform configuration and scientific parameter controls per 07-AUTH-AND-RBAC.md §4.8
        </p>
      </div>

      {!isSuperAdmin && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Super Administrator Privilege Required</strong>
            <p className="text-[11px] leading-relaxed">
              You are currently viewing this page with the <code>{currentActor?.role}</code> role.
              Modifying application settings is restricted to Super Admin accounts. Form inputs are in read-only mode.
            </p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {formError && (
        <div className="p-3.5 rounded-xl border border-danger/30 bg-danger/10 text-xs text-danger flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* General Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Platform Identity & Organization</CardTitle>
            <CardDescription>
              Platform branding and public institutional contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="platformName" className="block text-xs font-semibold text-text-primary">
                  Platform Name <span className="text-danger">*</span>
                </label>
                <input
                  id="platformName"
                  type="text"
                  disabled={!isSuperAdmin}
                  {...register("platformName")}
                  className={cn(
                    "w-full px-3 py-2 text-xs rounded-lg border bg-surface text-text-primary focus:outline-none focus:ring-2 transition-all disabled:opacity-60",
                    errors.platformName
                      ? "border-danger focus:ring-danger/20"
                      : "border-border focus:ring-primary/20 focus:border-primary"
                  )}
                />
                {errors.platformName && (
                  <p className="text-[11px] text-danger mt-1">{errors.platformName.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="organizationName" className="block text-xs font-semibold text-text-primary">
                  Research Organization <span className="text-danger">*</span>
                </label>
                <input
                  id="organizationName"
                  type="text"
                  disabled={!isSuperAdmin}
                  {...register("organizationName")}
                  className={cn(
                    "w-full px-3 py-2 text-xs rounded-lg border bg-surface text-text-primary focus:outline-none focus:ring-2 transition-all disabled:opacity-60",
                    errors.organizationName
                      ? "border-danger focus:ring-danger/20"
                      : "border-border focus:ring-primary/20 focus:border-primary"
                  )}
                />
                {errors.organizationName && (
                  <p className="text-[11px] text-danger mt-1">{errors.organizationName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="contactEmail" className="block text-xs font-semibold text-text-primary">
                System Contact & Notification Email <span className="text-danger">*</span>
              </label>
              <input
                id="contactEmail"
                type="email"
                disabled={!isSuperAdmin}
                {...register("contactEmail")}
                className={cn(
                  "w-full px-3 py-2 text-xs rounded-lg border bg-surface text-text-primary focus:outline-none focus:ring-2 transition-all disabled:opacity-60",
                  errors.contactEmail
                    ? "border-danger focus:ring-danger/20"
                    : "border-border focus:ring-primary/20 focus:border-primary"
                )}
              />
              {errors.contactEmail && (
                <p className="text-[11px] text-danger mt-1">{errors.contactEmail.message}</p>
              )}
            </div>

            {/* Public Traceability Toggle */}
            <div className="flex items-center gap-3 pt-2">
              <input
                id="publicTraceabilityEnabled"
                type="checkbox"
                disabled={!isSuperAdmin}
                {...register("publicTraceabilityEnabled")}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer disabled:opacity-60"
              />
              <div>
                <label htmlFor="publicTraceabilityEnabled" className="text-xs font-semibold text-text-primary cursor-pointer">
                  Enable Public QR Traceability Pages
                </label>
                <p className="text-[11px] text-text-secondary">
                  Allows public consumers to scan QR codes and view safe origin batches at <code>/trace/waste/*</code> and <code>/trace/product/*</code>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scientific Calibration Governance Banner */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <FlaskConical className="w-4 h-4" />
              <span>Scientific Metric Calibration (Governed Status)</span>
            </div>
            <CardDescription>
              Authoritative parameter status per Phase F3.1 and F9.1 consistency agreements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-surface border border-border flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div>
                <strong className="text-text-primary block font-semibold">
                  Total Waste Processed Formula: <code>PENDING DEFINITION</code>
                </strong>
                <p className="text-[11px] text-text-secondary leading-relaxed pt-0.5">
                  The mathematical formula defining cumulative processed mass remains pending formal scientific validation. System displays <code>N/A (Pending Definition)</code> to prevent inaccurate biological yield reporting.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-surface border border-border flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div>
                <strong className="text-text-primary block font-semibold">
                  Biological Yield & Extraction Calibration: <code>PENDING DEFINITION</code>
                </strong>
                <p className="text-[11px] text-text-secondary leading-relaxed pt-0.5">
                  Downstream product-to-waste mass balance ratios are pending chemical extraction assay calibration from the laboratory team.
                </p>
              </div>
            </div>
          </CardContent>
          {isSuperAdmin && (
            <CardFooter className="pt-0 justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isLoading}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Settings
              </Button>
            </CardFooter>
          )}
        </Card>
      </form>
    </div>
  );
};
