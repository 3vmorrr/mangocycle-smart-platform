"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, Moon, Sun, User, LogOut, ChevronDown } from "lucide-react";
import { UserProfile } from "@/data/contracts/auth";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { authService } from "@/data/services";
import { cn } from "@/lib/utils/cn";

interface TopHeaderProps {
  currentUser?: UserProfile | null;
  onMenuClick: () => void;
  className?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentUser,
  onMenuClick,
  className,
}) => {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    // Check initial system / DOM dark preference
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    router.push("/login");
  };

  return (
    <header
      className={cn(
        "h-16 bg-surface/90 backdrop-blur-xs border-b border-border/80 sticky top-0 z-30 px-4 lg:px-6 flex items-center justify-between transition-colors",
        className
      )}
    >
      {/* Left: Mobile navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface focus-ring"
          aria-label="Open sidebar navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

      </div>

      {/* Right: Theme Toggle & User Info */}
      <div className="flex items-center gap-3">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg focus-ring transition-colors"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-accent" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="h-5 w-[1px] bg-border mx-1" aria-hidden="true" />

        {/* User profile dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 ps-1 p-1 rounded-lg hover:bg-surface-secondary transition-colors text-start"
            aria-expanded={isUserMenuOpen}
            aria-label="User profile options"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
              {currentUser?.fullName ? (
                currentUser.fullName.charAt(0).toUpperCase()
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div className="hidden sm:flex flex-col text-start">
              <span className="text-xs font-semibold text-text-primary truncate max-w-[140px]">
                {currentUser?.fullName || "MangoCycle User"}
              </span>
              <span className="text-[10px] text-text-secondary capitalize">
                {currentUser?.role || "viewer"}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-text-secondary hidden sm:block" />
          </button>

          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsUserMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute end-0 mt-1.5 w-64 rounded-xl bg-surface border border-border shadow-xl z-50 p-3 text-xs space-y-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="space-y-1 pb-2 border-b border-border">
                  <span className="font-bold text-text-primary block truncate">
                    {currentUser?.fullName || "MangoCycle User"}
                  </span>
                  <span className="text-[11px] text-text-secondary block truncate">
                    {currentUser?.email || ""}
                  </span>
                  <div className="pt-1.5 flex items-center gap-2">
                    <span className="text-[10px] text-text-secondary font-medium">Active Role:</span>
                    <StatusBadge status={currentUser?.role || "viewer"} size="sm" showDot={false} />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-danger hover:bg-danger/10 font-semibold transition-colors text-start"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
