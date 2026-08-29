"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  FlaskConical,
  Microscope,
  Bot,
  Scan,
  Lightbulb,
  MessageSquare,
  Leaf,
  History,
  Radio,
  FileSpreadsheet,
  ShieldCheck,
  Users,
  Building2,
  GitCommit,
  ScrollText,
  Sliders,
  Settings,
  ChevronDown,
} from "lucide-react";
import { NAVIGATION_STRUCTURE, NavItem } from "@/lib/constants/navigation";
import { hasMinimumRole, UserRole } from "@/data/contracts/auth";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils/cn";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Boxes,
  FlaskConical,
  Microscope,
  Bot,
  Scan,
  Lightbulb,
  MessageSquare,
  Leaf,
  History,
  Radio,
  FileSpreadsheet,
  ShieldCheck,
  Users,
  Building2,
  GitCommit,
  ScrollText,
  Sliders,
  Settings,
};

interface SidebarProps {
  userRole?: UserRole;
  isCollapsed?: boolean;
  onNavigate?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  userRole = "viewer",
  isCollapsed = false,
  onNavigate,
  className,
}) => {
  const pathname = usePathname();

  const renderNavItem = (item: NavItem) => {
    // Check permission per 07-AUTH-AND-RBAC.md
    if (item.minRole && !hasMinimumRole(userRole, item.minRole)) {
      return null;
    }

    const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
    const isActive =
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href));
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.href} className="space-y-1">
        <Link
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "group flex items-center gap-3 px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-150 relative",
            isActive
              ? "bg-primary-light text-primary-dark font-semibold dark:bg-primary-dark/20 dark:text-primary-light"
              : "text-text-secondary hover:text-text-primary hover:bg-surface/80"
          )}
        >
          {isActive && (
            <span
              className="absolute inset-y-1.5 start-0 w-1 bg-primary rounded-e"
              aria-hidden="true"
            />
          )}
          <Icon
            className={cn(
              "w-4 h-4 shrink-0 transition-colors",
              isActive ? "text-primary" : "text-text-secondary group-hover:text-text-primary"
            )}
          />
          {!isCollapsed && (
            <span className="truncate flex-1">{item.name}</span>
          )}
          {!isCollapsed && item.badge && (
            <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-accent/20 text-accent">
              {item.badge}
            </span>
          )}
          {!isCollapsed && hasChildren && (
            <ChevronDown className="w-3.5 h-3.5 text-text-secondary/60 shrink-0" />
          )}
        </Link>

        {/* Sub-items if expanded */}
        {!isCollapsed && hasChildren && isActive && (
          <div className="ms-4 ps-3 border-s border-border/80 space-y-1 mt-1">
            {item.children!.map((child) => {
              if (child.minRole && !hasMinimumRole(userRole, child.minRole)) {
                return null;
              }
              const ChildIcon = ICON_MAP[child.iconName] || DotIcon;
              const isChildActive = pathname === child.href;

              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-1.5 text-xs rounded transition-colors",
                    isChildActive
                      ? "text-primary font-semibold bg-primary/5"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface"
                  )}
                >
                  <ChildIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{child.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-surface border-e border-border select-none transition-all duration-200",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-border/60 gap-3 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-lg shrink-0 shadow-xs">
          🥭
        </div>
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm text-text-primary tracking-tight truncate">
              MangoCycle
            </span>
            <span className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold">
              Smart Platform
            </span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAVIGATION_STRUCTURE.map((group) => {
          // Filter items based on minimum role
          const visibleItems = group.items.filter(
            (item) => !item.minRole || hasMinimumRole(userRole, item.minRole)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.groupName} className="space-y-1.5">
              {!isCollapsed && (
                <h4 className="px-3 text-[11px] font-semibold text-text-secondary/70 uppercase tracking-wider">
                  {group.groupName}
                </h4>
              )}
              <div className="space-y-0.5">{visibleItems.map(renderNavItem)}</div>
            </div>
          );
        })}
      </nav>

      {/* Role / Mode Indicator in Footer */}
      {!isCollapsed && (
        <div className="p-3.5 border-t border-border/60 bg-surface/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary font-medium">Role:</span>
            <StatusBadge status={userRole} size="sm" showDot={false} />
          </div>
        </div>
      )}
    </aside>
  );
};

function DotIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
