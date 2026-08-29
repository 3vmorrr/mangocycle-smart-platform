"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { loginSchema, LoginFormInput } from "@/lib/validators/auth";
import { authService } from "@/data/services";
import { cn } from "@/lib/utils/cn";

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormInput) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const result = await authService.login(data);
      if (result.success) {
        router.push("/dashboard");
      } else {
        setAuthError(result.error || "Authentication failed.");
      }
    } catch {
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-4">
      {/* Brand Header */}
      <div className="text-center space-y-1">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl mx-auto shadow-xs">
          🥭
        </div>
        <h1 className="font-bold text-xl text-text-primary">MangoCycle Smart Platform</h1>
        <p className="text-xs text-text-secondary">
          Circular Bio-Valorization & Traceability Workspace
        </p>
      </div>

      <Card>
        <CardHeader className="text-center pb-2">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-1.5">
            <Lock className="w-4 h-4" />
          </div>
          <CardTitle className="text-base">Authentication Portal</CardTitle>
          <CardDescription>
            Sign in to access operational dashboards, batch registries, and research tools
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            {/* Email Field */}
            <div className="space-y-1">
              <label htmlFor="email" className="block text-xs font-semibold text-text-primary">
                Email Address <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="name@mangocycle.local"
                  {...register("email")}
                  className={cn(
                    "w-full ps-9 pe-3 py-2 text-xs rounded-lg border bg-surface text-text-primary focus:outline-none focus:ring-2 transition-all",
                    errors.email
                      ? "border-danger focus:ring-danger/20"
                      : "border-border focus:ring-primary/20 focus:border-primary"
                  )}
                />
                <Mail className="w-4 h-4 text-text-secondary absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {errors.email && (
                <p className="text-[11px] text-danger mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-semibold text-text-primary">
                  Password <span className="text-danger">*</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
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

            {authError && (
              <div className="p-3 rounded-lg border border-danger/30 bg-danger/10 text-xs text-danger flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full"
              leftIcon={<LogIn className="w-4 h-4" />}
            >
              Sign In to Platform
            </Button>
          </form>

        </CardContent>

        <CardFooter className="pt-0 border-t border-border/50 justify-center">
          <Link
            href="/"
            className="text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            ← Return to Public Landing Page
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};
