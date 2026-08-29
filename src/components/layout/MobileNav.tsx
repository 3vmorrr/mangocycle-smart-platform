"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { UserRole } from "@/data/contracts/auth";
import { cn } from "@/lib/utils/cn";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: UserRole;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  userRole = "viewer",
}) => {
  // Prevent body scrolling when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 start-0 z-50 w-72 max-w-[85vw] bg-surface shadow-xl flex flex-col transform transition-transform duration-200 ease-in-out"
        )}
      >
        <button
          onClick={onClose}
          className="absolute top-4 end-4 p-1.5 text-text-secondary hover:text-text-primary rounded-md focus-ring"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>

        <Sidebar userRole={userRole} onNavigate={onClose} className="w-full border-e-0" />
      </div>
    </div>
  );
};
