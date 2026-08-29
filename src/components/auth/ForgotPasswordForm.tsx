"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { forgotPasswordSchema, ForgotPasswordFormInput } from "@/lib/validators/auth";
import { authService } from "@/data/services";
import { cn } from "@/lib/utils/cn";

export const ForgotPasswordForm: React.FC = () => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormInput) => {
    setIsLoading(true);
    try {
      const result = await authService.forgotPassword(data);
      setSuccessMessage(result.message);
    } catch {
      setSuccessMessage("If an account matches this email, password reset instructions have been generated.");
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
        <p className="text-xs text-text-secondary">Password Recovery Portal</p>
      </div>

      <Card>
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-base">Reset Your Password</CardTitle>
          <CardDescription>
            Enter your registered email address to receive password reset instructions
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {successMessage ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-xs text-text-primary space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Reset Request Accepted</span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  If the address belongs to an account, Supabase Auth will send a secure, time-limited recovery link.
                </p>
              </div>

              <Link href="/login" className="block">
                <Button variant="primary" size="md" className="w-full">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full"
                leftIcon={<Send className="w-4 h-4" />}
              >
                Send Reset Link
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="pt-0 border-t border-border/50 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};
