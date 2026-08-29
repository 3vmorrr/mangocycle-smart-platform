import React from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center items-center p-4">
      <LoginForm />
    </div>
  );
}
