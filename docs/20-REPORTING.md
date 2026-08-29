# MangoCycle Smart Platform — Reporting

> **Document Name:** Reporting Module  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 15-AI-ARCHITECTURE.md, 05-DATABASE-SCHEMA.md, 09-ROUTES-AND-PAGES.md

---

## 1. Purpose

This document specifies the Reporting Module — structured report generation from verified platform data with optional AI-assisted narrative and PDF export.

---

## 2. Feature Summary

| Attribute | Value |
|---|---|
| Priority | P3 |
| Routes | `/reports`, `/reports/generate`, `/reports/[id]` |
| Min Role (view) | `viewer` |
| Min Role (generate) | `researcher` |
| AI Integration | LLM generates narrative summary from verified data |

---

## 3. Report Types

| Report | Description | Data Source |
|---|---|---|
| Batch Report | Detailed report for a single Waste Batch | `waste_batches`, `batch_stage_history`, `laboratory_tests` |
| Monthly Waste Management Report | Aggregated metrics for a month | All waste/product tables |
| Sustainability Report | Waste diversion and processing metrics | `waste_batches`, `product_batches` |
| Product Traceability Report | Full product journey with linked waste | `product_batches`, `product_waste_links`, `waste_batches` |
| Laboratory Summary Report | Summary of lab tests by type/status | `laboratory_tests` |

---

## 4. Report Generation Flow

```
User selects report type and parameters
    ↓
Backend queries database for verified data
    ↓
Backend formats data into structured report object
    ↓
(Optional) LLM generates narrative summary
    ↓
Report rendered as HTML view
    ↓
(Optional) Export as PDF
```

### 4.1 Data First, AI Second

All numerical data in reports comes from database queries. The LLM only generates the narrative commentary section. If AI is unavailable, reports still contain all data — just without the narrative.

---

## 5. Report Structure (Common)

Each report contains:

| Section | Content | AI-Generated? |
|---|---|---|
| Header | Report title, generation date, parameters | No |
| Summary Metrics | KPI values calculated from database | No |
| Data Tables | Tabular data from queries | No |
| Narrative Summary | Commentary on the data | Yes (optional) |
| Charts/Visualizations | Rendered from query data | No |
| Disclaimer | AI-generated content notice | No |
| Footer | Platform name, generation timestamp | No |

---

## 6. PDF Export

PDF export is optional for MVP. If implemented:

| Approach | Consideration |
|---|---|
| `@react-pdf/renderer` | React-native PDF rendering |
| Browser print to PDF | Simplest; use print-optimized CSS |
| Server-side HTML-to-PDF | More reliable for consistent output |

For MVP, **browser print-to-PDF** with print-optimized CSS is the recommended approach for simplicity.

---

## 7. AI Report Narrative

System prompt pattern:

```
You are a report narrator for MangoCycle Smart Platform.
Generate a professional summary of the following verified data.
ONLY reference numbers from the provided data. NEVER invent data.
Keep the narrative concise (2-4 paragraphs) and professional.
```

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [15-AI-ARCHITECTURE.md](./15-AI-ARCHITECTURE.md) | AI narrative generation |
| [05-DATABASE-SCHEMA.md](./05-DATABASE-SCHEMA.md) | Data source tables |
| [09-ROUTES-AND-PAGES.md](./09-ROUTES-AND-PAGES.md) | Report routes |
| [07-AUTH-AND-RBAC.md](./07-AUTH-AND-RBAC.md) | Report permissions |
