# MangoCycle Smart Platform — Routes & Pages

> **Document Name:** Routes & Pages  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 02-MVP-SCOPE.md, 07-AUTH-AND-RBAC.md, 10-UI-UX-SPECIFICATION.md

---

## 1. Purpose

This document is the **authoritative source** for all application routes, page definitions, and their classifications (MVP tier, access level). All other documents must reference this file for route paths and page definitions.

---

## 2. Route Architecture

The application uses the **Next.js App Router** with the following route groups:

| Route Group | Purpose | Auth Required |
|---|---|---|
| `/` | Landing page | No |
| `/trace/*` | Public traceability pages | No |
| `/(auth)/*` | Login and password reset | No (redirect if authenticated) |
| `/(dashboard)/*` | All authenticated application pages | Yes |
| `/api/*` | API route handlers | Varies |

---

## 3. Complete Route Map

### 3.1 Public Routes

| Route | Page Name | Description | Priority | Min Role |
|---|---|---|---|---|
| `/` | Landing Page | Public marketing/information page | P0 | None |
| `/trace/waste/[batchCode]` | Waste Traceability Page | Public read-only waste batch info (QR target) | P0 | None |
| `/trace/product/[batchCode]` | Product Traceability Page | Public read-only product batch info (QR target) | P1 | None |

### 3.2 Authentication Routes

| Route | Page Name | Description | Priority | Min Role |
|---|---|---|---|---|
| `/login` | Login Page | Email/password login form | P0 | None |
| `/forgot-password` | Forgot Password Page | Password reset request | P0 | None |
| `/reset-password` | Reset Password Page | Set new password (from email link) | P0 | None |

### 3.3 Dashboard

| Route | Page Name | Description | Priority | Min Role |
|---|---|---|---|---|
| `/dashboard` | Dashboard | Main operational dashboard with KPIs and charts | P0 | `viewer` |

### 3.4 Waste Management

| Route | Page Name | Description | Priority | Min Role |
|---|---|---|---|---|
| `/waste-batches` | Waste Batches List | Filterable/sortable list of all Waste Batches | P0 | `viewer` |
| `/waste-batches/new` | Create Waste Batch | Form to create a new Waste Batch | P0 | `operator` |
| `/waste-batches/[id]` | Waste Batch Details | Full detail view with processing timeline and QR | P0 | `viewer` |
| `/waste-batches/[id]/edit` | Edit Waste Batch | Edit form for an existing Waste Batch | P0 | `operator` |

### 3.5 Product Management

| Route | Page Name | Description | Priority | Min Role |
|---|---|---|---|---|
| `/products` | Product Batches List | Filterable/sortable list of all Product Batches | P1 | `viewer` |
| `/products/new` | Create Product Batch | Form to create a new Product Batch and link Waste Batches | P1 | `researcher` |
| `/products/[id]` | Product Batch Details | Full detail view with linked waste, lab status, QR | P1 | `viewer` |
| `/products/[id]/edit` | Edit Product Batch | Edit form including waste batch linking | P1 | `researcher` |

### 3.6 Laboratory

| Route | Page Name | Description | Priority | Min Role |
|---|---|---|---|---|
| `/laboratory` | Laboratory Tests List | Filterable list of all laboratory tests | P1 | `viewer` |
| `/laboratory/new` | Create Laboratory Test | Form to create a test record with file uploads | P1 | `researcher` |
| `/laboratory/[id]` | Laboratory Test Details | Full test details with attachments | P1 | `viewer` |
| `/laboratory/[id]/edit` | Edit Laboratory Test | Edit test record | P1 | `researcher` |

### 3.7 MangoCycle AI

| Route | Page Name | Description | Priority | Min Role |
|---|---|---|---|---|
| `/ai` | MangoCycle AI Hub | Overview of all AI features | P2 | `viewer` |
| `/ai/waste-analyzer` | AI Waste Visual Analyzer | Image upload and AI visual assessment | P2 | `operator` |
| `/ai/processing-advisor` | AI Processing Advisor | Batch-based processing recommendations | P2 | `operator` |
| `/ai/ask` | Ask MangoCycle | Natural-language data query interface | P2 | `viewer` |
| `/ai/insights` | AI Sustainability Insights | AI-generated sustainability narrative | P2 | `viewer` |
| `/ai/history` | AI Analysis History | Browse past AI interactions | P2 | `researcher` |

### 3.8 IoT

| Route | Page Name | Description | Priority | Min Role |
|---|---|---|---|---|
| `/iot` | IoT Devices | List of registered Smart Bins | P4 | `viewer` |
| `/iot/[id]` | Smart Bin Details | Device details and weight reading history | P4 | `viewer` |

### 3.9 Reports

| Route | Page Name | Description | Priority | Min Role |
|---|---|---|---|---|
| `/reports` | Reports Dashboard | Overview and list of available/generated reports | P3 | `viewer` |
| `/reports/generate` | Generate Report | Select report type and parameters | P3 | `researcher` |
| `/reports/[id]` | View Report | View a generated report | P3 | `viewer` |

### 3.10 Administration

| Route | Page Name | Description | Priority | Min Role |
|---|---|---|---|---|
| `/admin` | Admin Overview | Admin dashboard or navigation | P0 | `admin` |
| `/admin/users` | User Management | List, create, edit user accounts and roles | P0 | `admin` |
| `/admin/sources` | Waste Sources | Manage waste source registry | P1 | `admin` |
| `/admin/stages` | Processing Stages | Configure processing stage definitions | P1 | `admin` |
| `/admin/audit-logs` | Audit Logs | Browse audit trail | P1 | `admin` |
| `/admin/ai-config` | AI Configuration | AI provider settings, rate limits | P2 | `admin` |
| `/admin/settings` | System Settings | Application-wide settings | P1 | `super_admin` |

### 3.11 API Routes

| Route | Method | Description | Priority | Auth |
|---|---|---|---|---|
| `/api/iot/weight` | POST | IoT weight data ingestion | P4 | API Key |

---

## 4. Navigation Structure

### 4.1 Main Sidebar Navigation

```
📊 Dashboard                    → /dashboard
📦 Waste Batches               → /waste-batches
🏭 Products                    → /products
🔬 Laboratory                  → /laboratory
🤖 MangoCycle AI               → /ai
   ├── Waste Analyzer          → /ai/waste-analyzer
   ├── Processing Advisor      → /ai/processing-advisor
   ├── Ask MangoCycle          → /ai/ask
   ├── Insights                → /ai/insights
   └── History                 → /ai/history
📡 IoT Devices                 → /iot
📋 Reports                     → /reports
⚙️ Administration              → /admin
   ├── Users                   → /admin/users
   ├── Sources                 → /admin/sources
   ├── Stages                  → /admin/stages
   ├── Audit Logs              → /admin/audit-logs
   ├── AI Config               → /admin/ai-config
   └── Settings                → /admin/settings
```

### 4.2 Navigation Visibility Rules

| Nav Item | Visible To |
|---|---|
| Dashboard | All authenticated users |
| Waste Batches | All authenticated users |
| Products | All authenticated users |
| Laboratory | All authenticated users |
| MangoCycle AI | All authenticated users |
| IoT Devices | All authenticated users (hidden if IoT module not enabled) |
| Reports | All authenticated users |
| Administration | `admin` and `super_admin` only |

---

## 5. Page Classification Summary

### By Priority

| Priority | Count | Pages |
|---|---|---|
| **P0** | 13 | Landing, Login, Forgot/Reset Password, Dashboard, Waste CRUD (4), Admin Overview, User Management, Audit Logs (via P1) |
| **P1** | 12 | Product CRUD (4), Laboratory CRUD (4), Waste/Product Traceability, Sources, Stages, Settings |
| **P2** | 6 | AI Hub, Waste Analyzer, Processing Advisor, Ask MangoCycle, Insights, AI History |
| **P3** | 3 | Reports Dashboard, Generate Report, View Report |
| **P4** | 2 | IoT Devices, Smart Bin Details |

### By Access Level

| Access | Pages |
|---|---|
| **Public** | Landing, Waste Traceability, Product Traceability |
| **No Auth (redirect)** | Login, Forgot Password, Reset Password |
| **viewer+** | Dashboard, all list/detail views, Ask MangoCycle, Insights, Reports (view) |
| **operator+** | Waste CRUD (write), AI Analyzer, AI Advisor |
| **researcher+** | Product CRUD (write), Lab CRUD (write), Reports (generate), AI History |
| **admin+** | All admin pages except Settings |
| **super_admin** | System Settings |

---

## 6. Error Pages

| Route | Description |
|---|---|
| `/not-found` (404) | Custom 404 page |
| `/error` (500) | Custom error page (no internal details exposed) |
| `/unauthorized` (403) | Shown when user lacks required role |

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [GOVERNANCE.md](./GOVERNANCE.md) | Canonical page names |
| [02-MVP-SCOPE.md](./02-MVP-SCOPE.md) | Priority tier classifications |
| [07-AUTH-AND-RBAC.md](./07-AUTH-AND-RBAC.md) | Role requirements per route |
| [08-SECURITY.md](./08-SECURITY.md) | Public/private boundary enforcement |
| [10-UI-UX-SPECIFICATION.md](./10-UI-UX-SPECIFICATION.md) | Page layout and design specs |
| [03-SYSTEM-ARCHITECTURE.md](./03-SYSTEM-ARCHITECTURE.md) | App Router structure |
