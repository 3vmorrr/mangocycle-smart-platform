# MangoCycle Smart Platform — Product Requirements

> **Document Name:** Product Requirements  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 00-PROJECT-OVERVIEW.md, 02-MVP-SCOPE.md, 05-DATABASE-SCHEMA.md, 07-AUTH-AND-RBAC.md, 09-ROUTES-AND-PAGES.md

---

## 1. Introduction

This document defines the complete functional and non-functional requirements for the MangoCycle Smart Platform. Each requirement is tagged with a priority level matching the tiers defined in [02-MVP-SCOPE.md](./02-MVP-SCOPE.md).

**Priority Legend:**

| Tag | Meaning |
|---|---|
| **P0** | Must-have for MVP — required for competition demo |
| **P1** | High priority — needed for complete traceability story |
| **P2** | Medium priority — AI-assisted features |
| **P3** | Lower priority — reports and analytics |
| **P4** | Optional — IoT integration |
| **Future** | Post-MVP development |

---

## 2. Functional Requirements

### 2.1 Authentication & User Management

| ID | Requirement | Priority |
|---|---|---|
| FR-AUTH-01 | Users must authenticate via email/password using Supabase Auth | P0 |
| FR-AUTH-02 | Password reset flow must be supported | P0 |
| FR-AUTH-03 | Users must be assigned one role. Role definitions are authoritative in [07-AUTH-AND-RBAC.md](./07-AUTH-AND-RBAC.md) | P0 |
| FR-AUTH-04 | Access control must be enforced on every protected route and API | P0 |
| FR-AUTH-05 | Super Admin can manage user accounts and roles | P0 |
| FR-AUTH-06 | Deleted/deactivated users must not destroy historical data ownership | P0 |

### 2.2 Waste Batch Management

| ID | Requirement | Priority |
|---|---|---|
| FR-WB-01 | Create a Waste Batch with fields: waste type, source, weight, collection date, location, visual condition, moisture status, storage duration, notes | P0 |
| FR-WB-02 | Each Waste Batch must receive a unique public identifier in format `MW-YYYY-NNN` | P0 |
| FR-WB-03 | Each Waste Batch must have an internal UUID primary key | P0 |
| FR-WB-04 | List all Waste Batches with filtering and sorting | P0 |
| FR-WB-05 | View detailed information for a single Waste Batch | P0 |
| FR-WB-06 | Edit Waste Batch fields (with audit trail) | P0 |
| FR-WB-07 | Supported waste types: Mango Peel, Mango Seed, Mixed Mango Waste | P0 |
| FR-WB-08 | Supported source types: University, Farm, Mango Processing Factory, Juice Factory, Market, Other | P0 |
| FR-WB-09 | Weight must be a positive number | P0 |
| FR-WB-10 | Waste Batch must track current processing status | P0 |
| FR-WB-11 | Soft delete or archival of Waste Batches (must not destroy traceability) | P1 |

### 2.3 Processing Lifecycle

| ID | Requirement | Priority |
|---|---|---|
| FR-PL-01 | Each Waste Batch progresses through ordered processing stages (canonical list in [GOVERNANCE.md](./GOVERNANCE.md)) | P0 |
| FR-PL-02 | Each stage transition must be recorded with timestamp, actor, and optional notes | P0 |
| FR-PL-03 | Stage history must be chronologically ordered and append-only | P0 |
| FR-PL-04 | Completed stage records must not be silently overwritten | P0 |
| FR-PL-05 | The current stage must be derivable from the most recent stage history entry | P0 |
| FR-PL-06 | A visual processing timeline must be displayed on the Waste Batch detail page | P0 |

### 2.4 QR Code System

| ID | Requirement | Priority |
|---|---|---|
| FR-QR-01 | A QR code must be automatically generatable for each Waste Batch | P0 |
| FR-QR-02 | The QR code must encode a URL pointing to the public Waste Traceability Page, not raw batch data | P0 |
| FR-QR-03 | QR codes must be downloadable/printable | P0 |
| FR-QR-04 | A QR code must be generatable for each Product Batch | P1 |
| FR-QR-05 | Product QR codes must point to the public Product Traceability Page | P1 |

### 2.5 Public Traceability Pages

| ID | Requirement | Priority |
|---|---|---|
| FR-PT-01 | The Waste Traceability Page must be accessible without authentication at `/trace/waste/{batch_code}` | P0 |
| FR-PT-02 | The page must display: batch code, waste type, source, weight, collection date, current status, processing timeline, linked product (if any), sustainability info (if available) | P0 |
| FR-PT-03 | The page must NOT expose private researcher notes, internal AI prompts, user information, private lab attachments, API keys, or internal audit history | P0 |
| FR-PT-04 | The Product Traceability Page must be accessible at `/trace/product/{batch_code}` | P1 |
| FR-PT-05 | The product page must display: product batch code, product name, production date, linked Waste Batches, total waste used, processing journey, lab testing status, sustainability info | P1 |

### 2.6 Dashboard

| ID | Requirement | Priority |
|---|---|---|
| FR-DB-01 | Display KPI cards: Total Mango Waste Collected, Total Waste Processed, Number of Waste Batches, Number of Active Batches, Number of Completed Batches, Number of Product Batches, Waste Diverted from Disposal, Processing Rate | P0 |
| FR-DB-02 | All KPI values must be calculated from database data, not from AI | P0 |
| FR-DB-03 | Display charts: Waste Collected Over Time, Waste by Source, Waste by Type, Batches by Current Stage, Processed vs Unprocessed Waste | P0 |
| FR-DB-04 | Display Product Batches Over Time chart | P1 |
| FR-DB-05 | Support date range filtering | P0 |
| FR-DB-06 | Show Recent Batches section | P0 |
| FR-DB-07 | Show Batches Requiring Attention section | P1 |
| FR-DB-08 | Show AI Insights section | P2 |
| FR-DB-09 | Show Smart Bin Status section (if IoT enabled) | P4 |

### 2.7 Product Batch Management

| ID | Requirement | Priority |
|---|---|---|
| FR-PB-01 | Create a Product Batch with fields: product name, product type, production date, quantity, unit, notes | P1 |
| FR-PB-02 | Each Product Batch must receive a unique public identifier in format `BF-YYYY-NNN` | P1 |
| FR-PB-03 | Link one or more Waste Batches to a Product Batch (many-to-many) | P1 |
| FR-PB-04 | Product Batch cannot link to a nonexistent Waste Batch | P1 |
| FR-PB-05 | List, view, and edit Product Batches | P1 |
| FR-PB-06 | Track laboratory testing status on each Product Batch | P1 |
| FR-PB-07 | Product naming must remain configurable — not hard-coded | P1 |

### 2.8 Laboratory Module

| ID | Requirement | Priority |
|---|---|---|
| FR-LB-01 | Create a Laboratory Test record associated with a Waste Batch and/or Product Batch | P1 |
| FR-LB-02 | Supported test type field must be flexible (not limited to a fixed enum) | P1 |
| FR-LB-03 | Record fields: test type, test date, status, result summary, numeric results, units, researcher notes, created by | P1 |
| FR-LB-04 | Upload file attachments to laboratory test records via Supabase Storage | P1 |
| FR-LB-05 | List and view laboratory tests | P1 |
| FR-LB-06 | Laboratory attachments must be private by default | P1 |
| FR-LB-07 | Laboratory files must belong to valid test records | P1 |

### 2.9 MangoCycle AI

> All AI features must follow the scientific language constraints defined in [GOVERNANCE.md](./GOVERNANCE.md).

#### 2.9.1 AI Waste Visual Analyzer

| ID | Requirement | Priority |
|---|---|---|
| FR-AI-01 | Accept an uploaded image of mango waste | P2 |
| FR-AI-02 | Send image to a multimodal Vision LLM via external API | P2 |
| FR-AI-03 | Return structured JSON assessment: waste type, visual condition, visible findings, manual review recommendation, confidence note | P2 |
| FR-AI-04 | Must never claim exact moisture %, chemical composition, fungal species, contamination level, disease diagnosis, or lab-confirmed quality grade | P2 |
| FR-AI-05 | Must be labeled "AI-Assisted Visual Assessment" | P2 |
| FR-AI-06 | AI analysis records must be stored for audit | P2 |

#### 2.9.2 AI Processing Advisor

| ID | Requirement | Priority |
|---|---|---|
| FR-AI-07 | Accept batch data and generate processing recommendations | P2 |
| FR-AI-08 | Use a configurable scientific rule engine first, then LLM for explanation | P2 |
| FR-AI-09 | Rules must support placeholders for scientific thresholds ("to be defined by scientific team") | P2 |
| FR-AI-10 | Must not make pure LLM-based processing decisions | P2 |

#### 2.9.3 Ask MangoCycle

| ID | Requirement | Priority |
|---|---|---|
| FR-AI-11 | Accept natural-language questions about platform data | P2 |
| FR-AI-12 | Use LLM Tool Calling / Function Calling to invoke approved backend tools | P2 |
| FR-AI-13 | Must never generate arbitrary SQL directly | P2 |
| FR-AI-14 | Approved tools: `get_total_waste()`, `get_batches_by_status()`, `get_batch_details()`, `get_waste_by_source()`, `get_product_batch_details()`, `get_dashboard_metrics()`, `get_recent_lab_results()` | P2 |
| FR-AI-15 | Return verified results through the LLM for natural-language formatting | P2 |

#### 2.9.4 AI Sustainability Insights

| ID | Requirement | Priority |
|---|---|---|
| FR-AI-16 | Calculate sustainability metrics from database (code/SQL) | P2 |
| FR-AI-17 | Pass verified metrics to LLM for narrative insight generation | P2 |
| FR-AI-18 | AI must never invent metrics — only interpret verified data | P2 |

#### 2.9.5 AI Report Generator

| ID | Requirement | Priority |
|---|---|---|
| FR-AI-19 | Generate structured reports from verified platform data | P3 |
| FR-AI-20 | Supported reports: Batch Report, Monthly Waste Report, Sustainability Report, Product Traceability Report, Laboratory Summary Report | P3 |
| FR-AI-21 | Optional PDF export | P3 |

### 2.10 Anomaly Detection

| ID | Requirement | Priority |
|---|---|---|
| FR-AN-01 | Detect statistical anomalies using IQR, Z-score, or threshold-based rules | P3 |
| FR-AN-02 | Example alerts: unusually long processing duration, abnormal weight change, yield outliers | P3 |
| FR-AN-03 | Must be labeled "Statistical anomaly detection" — not a trained ML model | P3 |

### 2.11 Batch Risk Score

| ID | Requirement | Priority |
|---|---|---|
| FR-RS-01 | Optional weighted scoring system for batch risk assessment | P3 |
| FR-RS-02 | Factors: storage duration, moisture status, visual condition, source risk | P3 |
| FR-RS-03 | Weights must be clearly labeled "Prototype values pending scientific validation" | P3 |

### 2.12 IoT Integration

| ID | Requirement | Priority |
|---|---|---|
| FR-IOT-01 | Accept weight data from ESP32-based Smart Bins via HTTPS API | P4 |
| FR-IOT-02 | Validate device ID, API key, payload, and weight range | P4 |
| FR-IOT-03 | Manual weight entry must always remain available regardless of IoT status | P4 |
| FR-IOT-04 | IoT weight readings stored in database for history | P4 |
| FR-IOT-05 | Smart Bin management page | P4 |

### 2.13 Audit Logging

| ID | Requirement | Priority |
|---|---|---|
| FR-AL-01 | Log important platform changes: batch creation, weight updates, stage changes, product creation, waste-product linking, lab result addition, AI analysis requests, role changes | P0 |
| FR-AL-02 | Audit fields: actor, action, entity type, entity ID, before value, after value, timestamp | P0 |
| FR-AL-03 | Audit records must be append-only where practical | P0 |

### 2.14 Administration

| ID | Requirement | Priority |
|---|---|---|
| FR-AD-01 | Manage users and roles | P0 |
| FR-AD-02 | Manage waste sources | P1 |
| FR-AD-03 | Manage processing stage configuration | P1 |
| FR-AD-04 | View audit logs | P1 |
| FR-AD-05 | AI configuration settings | P2 |
| FR-AD-06 | System settings | P1 |

---

## 3. Non-Functional Requirements

### 3.1 Performance

| ID | Requirement |
|---|---|
| NFR-01 | Dashboard must load within 3 seconds on standard broadband |
| NFR-02 | Public traceability pages must load within 2 seconds |
| NFR-03 | QR code generation must complete within 1 second |

### 3.2 Security

| ID | Requirement |
|---|---|
| NFR-04 | All security requirements defined in [08-SECURITY.md](./08-SECURITY.md) must be met |
| NFR-05 | Public pages must expose only safe public information |
| NFR-06 | AI API keys must remain server-side only |
| NFR-07 | All user input must be validated server-side |

### 3.3 Reliability

| ID | Requirement |
|---|---|
| NFR-08 | Platform must function without AI if AI provider is unavailable |
| NFR-09 | Platform must function without IoT hardware |
| NFR-10 | Data integrity constraints must be enforced at the database level |

### 3.4 Usability

| ID | Requirement |
|---|---|
| NFR-11 | Interface must be responsive (desktop and mobile) |
| NFR-12 | Architecture must support RTL (Arabic) layout in the future |
| NFR-13 | Dashboard must feel like an operational platform, not a marketing page |
| NFR-14 | Visual design must communicate sustainability, biotechnology, and professionalism |

### 3.5 Maintainability

| ID | Requirement |
|---|---|
| NFR-15 | TypeScript strict mode must be enabled |
| NFR-16 | Reusable components for common UI patterns |
| NFR-17 | Separation of concerns between UI, business logic, and data access |
| NFR-18 | Demo data must be clearly distinguishable from production data |

### 3.6 Internationalization

| ID | Requirement |
|---|---|
| NFR-19 | Architecture must not prevent future Arabic language support |
| NFR-20 | Avoid design decisions that make RTL support difficult |
| NFR-21 | Date, number, and unit formatting must be locale-aware |

---

## 4. Constraints

| Constraint | Description |
|---|---|
| Timeline | Very short development timeline for competition |
| Scientific Claims | No unvalidated scientific claims in AI output |
| AI Scope | No custom model training for MVP; external API only |
| IoT Dependency | Platform must not require IoT hardware to function |
| Technology | Primarily TypeScript/Next.js stack — no Python in MVP |
| Data | Demo data is fictional/sample; clearly labeled as such |

---

## 5. Features NOT in MVP

The following are documented as **Future** development items. See [34-FUTURE-AI-ROADMAP.md](./34-FUTURE-AI-ROADMAP.md).

1. **Custom Waste Quality Classification** — Requires labeled dataset
2. **Yield Prediction** — Requires historical experimental data
3. **Disease / Fungal Species Detection** — Requires labeled image datasets
4. **Automated TEM/XRD/FTIR Interpretation** — Requires specialist validation
5. **Advanced ML Anomaly Detection** — Requires sufficient historical data

> [!NOTE]
> The platform should collect clean structured data now so these models can be developed later.

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [GOVERNANCE.md](./GOVERNANCE.md) | Canonical terminology and scientific language constraints |
| [00-PROJECT-OVERVIEW.md](./00-PROJECT-OVERVIEW.md) | Project context |
| [02-MVP-SCOPE.md](./02-MVP-SCOPE.md) | Priority tier definitions |
| [05-DATABASE-SCHEMA.md](./05-DATABASE-SCHEMA.md) | Authoritative field/table definitions |
| [07-AUTH-AND-RBAC.md](./07-AUTH-AND-RBAC.md) | Authoritative role definitions |
| [08-SECURITY.md](./08-SECURITY.md) | Authoritative security requirements |
| [09-ROUTES-AND-PAGES.md](./09-ROUTES-AND-PAGES.md) | Authoritative page/route definitions |
| [24-API-SPECIFICATION.md](./24-API-SPECIFICATION.md) | Authoritative API contracts |
| [34-FUTURE-AI-ROADMAP.md](./34-FUTURE-AI-ROADMAP.md) | Future AI features |
