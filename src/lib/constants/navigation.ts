import { UserRole } from "@/data/contracts/auth";

export interface NavItem {
  name: string;
  href: string;
  iconName: string;
  badge?: string;
  minRole?: UserRole;
  children?: NavItem[];
}

export interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: 1,
  operator: 2,
  researcher: 3,
  admin: 4,
  super_admin: 5,
};

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0);
}

export const NAVIGATION_STRUCTURE: NavGroup[] = [
  {
    groupName: "Operations",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        iconName: "LayoutDashboard",
        minRole: "viewer",
      },
      {
        name: "Waste Batches",
        href: "/waste-batches",
        iconName: "Boxes",
        minRole: "viewer",
      },
      {
        name: "Products",
        href: "/products",
        iconName: "FlaskConical",
        minRole: "viewer",
      },
      {
        name: "Laboratory",
        href: "/laboratory",
        iconName: "Microscope",
        minRole: "viewer",
      },
    ],
  },
  {
    groupName: "MangoCycle AI",
    items: [
      {
        name: "AI Hub",
        href: "/ai",
        iconName: "Bot",
        minRole: "viewer",
        children: [
          { name: "Waste Analyzer", href: "/ai/waste-analyzer", iconName: "Scan", minRole: "operator" },
          { name: "Processing Advisor", href: "/ai/processing-advisor", iconName: "Lightbulb", minRole: "operator" },
          { name: "Ask MangoCycle", href: "/ai/ask", iconName: "MessageSquare", minRole: "viewer" },
          { name: "Sustainability Insights", href: "/ai/insights", iconName: "Leaf", minRole: "viewer" },
          { name: "Analysis History", href: "/ai/history", iconName: "History", minRole: "researcher" },
        ],
      },
    ],
  },
  {
    groupName: "Hardware & Reports",
    items: [
      {
        name: "IoT Devices",
        href: "/iot",
        iconName: "Radio",
        minRole: "viewer",
      },
      {
        name: "Reports",
        href: "/reports",
        iconName: "FileSpreadsheet",
        minRole: "viewer",
      },
    ],
  },
  {
    groupName: "Administration",
    items: [
      {
        name: "Admin Center",
        href: "/admin",
        iconName: "ShieldCheck",
        minRole: "admin",
        children: [
          { name: "User Management", href: "/admin/users", iconName: "Users", minRole: "admin" },
          { name: "Waste Sources", href: "/admin/sources", iconName: "Building2", minRole: "admin" },
          { name: "Processing Stages", href: "/admin/stages", iconName: "GitCommit", minRole: "admin" },
          { name: "Audit Logs", href: "/admin/audit-logs", iconName: "ScrollText", minRole: "admin" },
          { name: "AI Configuration", href: "/admin/ai-config", iconName: "Sliders", minRole: "admin" },
          { name: "System Settings", href: "/admin/settings", iconName: "Settings", minRole: "super_admin" },
        ],
      },
    ],
  },
];
