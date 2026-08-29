import { AuthResult, ForgotPasswordInput, LoginInput, ResetPasswordInput, SessionInfo, UserProfile } from "@/data/contracts/auth";
import { apiRequest } from "./http";

export const supabaseAuthAdapter = {
  async login(input: LoginInput): Promise<AuthResult> {
    try {
      const data = await apiRequest<{ user: UserProfile }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Authentication failed." };
    }
  },
  async logout(): Promise<void> {
    await apiRequest("/api/auth/logout", { method: "POST" });
  },
  forgotPassword(input: ForgotPasswordInput): Promise<{ message: string }> {
    return apiRequest("/api/auth/forgot-password", { method: "POST", body: JSON.stringify(input) });
  },
  resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
    return apiRequest("/api/auth/reset-password", { method: "POST", body: JSON.stringify(input) });
  },
  getCurrentSession(): Promise<SessionInfo> {
    return apiRequest("/api/auth/session", { cache: "no-store" });
  },
  async getCurrentUser(): Promise<UserProfile | null> {
    return (await this.getCurrentSession()).user;
  },
};
