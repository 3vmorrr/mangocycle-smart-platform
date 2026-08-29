"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { resetPasswordSchema, ResetPasswordFormInput } from "@/lib/validators/auth";
import { authService } from "@/data/services";
import { cn } from "@/lib/utils/cn";

export const ResetPasswordForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormInput) => {
    setFormError(null);
    setIsLoading(true);
    try {
      const result = await authService.resetPassword(data);
      setSuccessMessage(result.message);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="text-center space-y-1">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl mx-auto shadow-xs">
          🥭
        </div>
        <h1 className="font-bold text-xl text-text-primary">MangoCycle Smart Platform</h1>
        <p className="text-xs text-text-secondary">Create New Password</p>
      </div>

      <Card>
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-base">Set New Password</CardTitle>
          <CardDescription>
            Enter and confirm your new password (minimum 8 characters)
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {successMessage ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-xs text-text-primary space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Password Updated</span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Your password was updated by Supabase Auth and existing sessions were invalidated. Sign in again to continue.
                </p>
              </div>

              <Link href="/login" className="block">
                <Button variant="primary" size="md" className="w-full">
                  Sign In with New Password
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Password Field */}
              <div className="space-y-1">
                <label htmlFor="password" className="block text-xs font-semibold text-text-primary">
                  New Password <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password")}
                    className={cn(
                      "w-full ps-9 pe-10 py-2 text-xs rounded-lg border bg-surface text-text-primary focus:outline-none focus:ring-2 transition-all",
                      errors.password
                        ? "border-danger focus:ring-danger/20"
                        : "border-border focus:ring-primary/20 focus:border-primary"
                    )}
                  />
                  <Lock className="w-4 h-4 text-text-secondary absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-0.5"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] text-danger mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.password.message}</span>
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1">
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-text-primary">
                  Confirm New Password <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                    className={cn(
                      "w-full ps-9 pe-10 py-2 text-xs rounded-lg border bg-surface text-text-primary focus:outline-none focus:ring-2 transition-all",
                      errors.confirmPassword
                        ? "border-danger focus:ring-danger/20"
                        : "border-border focus:ring-primary/20 focus:border-primary"
                    )}
                  />
                  <Lock className="w-4 h-4 text-text-secondary absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-0.5"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-[11px] text-danger mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.confirmPassword.message}</span>
                  </p>
                )}
              </div>

              {formError && (
                <div className="p-3 rounded-lg border border-danger/30 bg-danger/10 text-xs text-danger flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full"
              >
                Update Password
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="pt-0 border-t border-border/50 justify-center">
          <Link
            href="/login"
            className="text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            ← Return to Sign In
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};
