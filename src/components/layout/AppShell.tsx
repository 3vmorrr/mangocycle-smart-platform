"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import { MobileNav } from "./MobileNav";
import { UserProfile } from "@/data/contracts/auth";

interface AppShellProps {
  children: React.ReactNode;
  currentUser: UserProfile;
}

export const AppShell: React.FC<AppShellProps> = ({ children, currentUser }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-text-primary">
      {/* Desktop Sidebar */}
      <Sidebar
        userRole={currentUser.role}
        className="hidden lg:flex shrink-0"
      />

      {/* Mobile Drawer */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        userRole={currentUser.role}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopHeader
          currentUser={currentUser}
          onMenuClick={() => setIsMobileNavOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
};
