# MangoCycle Smart Platform — MVP Scope

> **Document Name:** MVP Scope & Prioritization  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 00-PROJECT-OVERVIEW.md, 01-PRODUCT-REQUIREMENTS.md, 33-DEVELOPMENT-ROADMAP.md

---

## 1. Purpose

This document is the **authoritative source** for what is in scope for the MVP, what is deferred, and the priority ordering of all features. All other documents must reference this file for scope classification.

---

## 2. MVP Objective

Build a functional, demonstrable prototype of the MangoCycle Smart Platform within a very short development timeline for a university competition presentation. The prototype must support the complete demo scenario defined in [32-DEMO-PLAN.md](./32-DEMO-PLAN.md).

---

## 3. Priority Tier Definitions

| Tier | Name | Definition | Build When |
|---|---|---|---|
| **P0** | Critical MVP | Required for a minimal viable competition demo | First |
| **P1** | High Priority | Completes the full traceability story (waste → product) | Immediately after P0 |
| **P2** | Medium Priority | AI-assisted features that differentiate the platform | After P1 |
| **P3** | Lower Priority | Reports, analytics, and advanced operational features | After P2, if time permits |
| **P4** | Optional | IoT hardware integration | Only if hardware is available and time permits |
| **Future** | Post-MVP | Requires data, validation, or research not available for MVP | Not built for competition |

---

## 4. P0 — Critical MVP

These features are **required** for the minimum competition demo.

### 4.1 Authentication & Authorization
- Email/password login via Supabase Auth
- Password reset
- Role-based access control (roles defined in [07-AUTH-AND-RBAC.md](./07-AUTH-AND-RBAC.md))
- Route protection

### 4.2 Database Foundation
- PostgreSQL schema deployed on Supabase
- Core tables: `profiles`, `waste_batches`, `waste_sources`, `processing_stages`, `batch_stage_history`
- Row Level Security policies on core tables
- Seed/demo data script

### 4.3 Waste Batch CRUD
- Create Waste Batch with all required fields
- Unique public code generation (`MW-YYYY-NNN`)
- List view with filtering/sorting
- Detail view
- Edit capability
- Validation (weight > 0, required fields, unique codes)

### 4.4 Processing Timeline
- Update Waste Batch processing stage
- Append-only stage history with timestamps and actor
- Visual timeline display on batch detail page

### 4.5 QR Code Generation (Waste)
- Generate QR code for each Waste Batch
- QR encodes URL: `/trace/waste/{batch_code}`
- Download/print QR code

### 4.6 Public Waste Traceability Page
- Public read-only page at `/trace/waste/{batch_code}`
- Displays safe public information only
- No authentication required
- Mobile-friendly

### 4.7 Dashboard
- KPI cards with real database metrics
- Charts: Waste Over Time, By Source, By Type, By Stage, Processed vs Unprocessed
- Date range filter
- Recent Batches section

### 4.8 Audit Logging
- Core audit events: batch created, updated, stage changed
- Audit table in database
- Append-only records

### 4.9 Basic Administration
- User management (create, assign roles)

---

## 5. P1 — High Priority

Completes the full traceability story. Build immediately after P0.

### 5.1 Product Batch Management
- Create Product Batch with fields
- Unique public code generation (`BF-YYYY-NNN`)
- List, detail, edit views
- Link/unlink Waste Batches (many-to-many)

### 5.2 Waste-to-Product Linking
- Associate one or more Waste Batches to a Product Batch
- Validate referenced Waste Batches exist
- Track which Waste Batches contributed to each product

### 5.3 Product QR Traceability
- Generate QR code for Product Batches
- Public Product Traceability Page at `/trace/product/{batch_code}`
- Shows linked Waste Batches, processing journey, lab status

### 5.4 Laboratory Module
- Create Laboratory Test records
- Associate with Waste Batch and/or Product Batch
- Flexible test type (not fixed enum)
- File upload via Supabase Storage
- List and detail views

### 5.5 Extended Dashboard
- Product Batches Over Time chart
- Batches Requiring Attention section

### 5.6 Extended Administration
- Manage waste sources
- Processing stage configuration
- View audit logs

---

## 6. P2 — Medium Priority (AI Features)

AI-assisted features that differentiate the platform.

### 6.1 AI Waste Visual Analyzer
- Image upload + multimodal LLM analysis
- Structured JSON output
- "AI-Assisted Visual Assessment" labeling

### 6.2 AI Processing Advisor
- Rule engine + LLM explanation
- Configurable rules with placeholder thresholds

### 6.3 Ask MangoCycle
- Natural-language questions about platform data
- LLM Tool Calling with approved backend functions
- No direct SQL generation

### 6.4 AI Sustainability Insights
- Database-calculated metrics + LLM narrative interpretation

### 6.5 MangoCycle AI Navigation Section
- Dedicated AI area in main navigation

---

## 7. P3 — Lower Priority

Reports and advanced operational features. Build if time permits after P2.

### 7.1 AI Report Generator
- Structured reports from verified data
- Multiple report types
- Optional PDF export

### 7.2 Simple Anomaly Detection
- IQR / Z-score / threshold-based statistical alerts
- Labeled as "Statistical anomaly detection"

### 7.3 Batch Risk Score
- Configurable weighted scoring system
- Labeled "Prototype values pending scientific validation"

---

## 8. P4 — Optional (IoT)

Hardware integration. Build only if ESP32 hardware is available and time permits.

### 8.1 IoT Weight Endpoint
- `POST /api/iot/weight` with device authentication
- Payload validation (device ID, weight range, timestamp)

### 8.2 Smart Bin Management
- Device registration and management page
- Weight reading history

### 8.3 Dashboard IoT Section
- Smart Bin status display
- Real-time weight updates (Supabase Realtime if useful)

---

## 9. Future — Post-MVP

These items require labeled datasets, historical data, or specialist validation not available for MVP.

| Feature | Blocker |
|---|---|
| Custom Waste Quality Classification | Requires labeled dataset |
| Yield Prediction | Requires historical experimental data |
| Disease / Fungal Species Detection | Requires labeled image datasets and validation |
| Automated TEM/XRD/FTIR Interpretation | Requires specialist validation |
| Advanced ML Anomaly Detection | Requires sufficient historical data |
| Predictive Analytics | Requires historical processing data |

> [!NOTE]
> The MVP platform should collect clean structured data to enable future model development.

---

## 10. Scope Boundaries

### Explicitly In Scope

- Web application (desktop and mobile responsive)
- Supabase-hosted PostgreSQL database
- QR code generation and public traceability pages
- External AI API integration (no custom training)
- Optional IoT integration (non-blocking)
- English language (with RTL-ready architecture)

### Explicitly Out of Scope for MVP

- Mobile native application
- Custom ML model training
- Python-based ML pipelines
- Multi-tenant / multi-organization support
- Payment processing
- Public user registration (only admin-created accounts)
- Offline mode
- Real-time collaborative editing

---

## 11. Demo Compatibility Matrix

Every P0 feature must support the demo scenario. Verification:

| Demo Step | Required Feature | Priority |
|---|---|---|
| Create Waste Batch | Waste Batch CRUD | P0 ✅ |
| Generate QR Code | QR Generation | P0 ✅ |
| Scan QR on Phone | Public Waste Traceability Page | P0 ✅ |
| Update Processing Stages | Processing Timeline | P0 ✅ |
| View Dashboard | Dashboard | P0 ✅ |
| AI Visual Assessment | AI Waste Analyzer | P2 |
| AI Processing Advice | AI Processing Advisor | P2 |
| Create Product Batch | Product Batch Management | P1 |
| Link Waste to Product | Waste-to-Product Linking | P1 |
| Add Lab Results | Laboratory Module | P1 |
| Scan Product QR | Product QR Traceability | P1 |
| Ask MangoCycle a Question | Ask MangoCycle | P2 |
| Sustainability Metrics | Dashboard + AI Insights | P0/P2 |
| IoT Weight Capture | IoT Integration | P4 |

> [!IMPORTANT]
> The demo must remain functional even if P2+ features are not completed. P0 alone constitutes a viable demo.

---

## 12. Build Order

```
Phase 1: P0 (Core Platform)
    ├── Database schema + Auth
    ├── Waste Batch CRUD + Processing Timeline
    ├── QR Generation + Public Traceability
    ├── Dashboard
    └── Audit Logging + Admin basics

Phase 2: P1 (Full Traceability)
    ├── Product Batch Management
    ├── Waste-to-Product Linking + Product QR
    ├── Laboratory Module
    └── Extended Admin + Dashboard

Phase 3: P2 (AI Features)
    ├── AI Waste Visual Analyzer
    ├── AI Processing Advisor
    ├── Ask MangoCycle
    └── AI Sustainability Insights

Phase 4: P3 (Reports & Analytics)
    ├── AI Report Generator
    ├── Anomaly Detection
    └── Batch Risk Score

Phase 5: P4 (IoT)
    ├── IoT Endpoint
    ├── Smart Bin Management
    └── Dashboard IoT Section
```

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [GOVERNANCE.md](./GOVERNANCE.md) | Canonical terminology and governance rules |
| [00-PROJECT-OVERVIEW.md](./00-PROJECT-OVERVIEW.md) | Project context and design principles |
| [01-PRODUCT-REQUIREMENTS.md](./01-PRODUCT-REQUIREMENTS.md) | Detailed requirements with priority tags |
| [32-DEMO-PLAN.md](./32-DEMO-PLAN.md) | Competition demo scenario this scope must support |
| [33-DEVELOPMENT-ROADMAP.md](./33-DEVELOPMENT-ROADMAP.md) | Development timeline aligned with these priorities |
| [34-FUTURE-AI-ROADMAP.md](./34-FUTURE-AI-ROADMAP.md) | Post-MVP AI features |
