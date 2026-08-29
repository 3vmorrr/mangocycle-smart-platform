# MangoCycle Smart Platform — Project Overview

> **Document Name:** Project Overview  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 01-PRODUCT-REQUIREMENTS.md, 02-MVP-SCOPE.md, 03-SYSTEM-ARCHITECTURE.md

---

## 1. Executive Summary

**MangoCycle Smart Platform** is a digital management, traceability, sustainability, and AI-assisted decision-support layer for a university biotechnology innovation project that converts mango waste — primarily mango peels and mango seeds — into value-added biological products.

The platform is **not** the biotechnology product itself. It is the software system that digitally tracks mango waste from the moment it is collected until it becomes a final biological product, providing full end-to-end traceability, operational dashboards, AI-assisted analysis, optional IoT integration, and QR-based public traceability.

---

## 2. Scientific Project Context

The underlying scientific project is a university-level waste-management and biotechnology innovation initiative. The core scientific activity converts mango waste (peels, seeds, mixed waste) into biological products through a series of processing stages.

### What the Scientific Project Does

- Collects mango waste from various sources (universities, farms, factories, markets)
- Processes the waste through defined stages (sorting, washing, drying, grinding, extraction, production)
- Produces value-added biological products (e.g., biofungicide or similar — see naming note below)
- Conducts laboratory testing to validate product quality

### Product Naming

The exact product name is determined by the scientific team and may change. Known candidates include:

- Biofungicide
- NanoBiovera
- Biovera Nano
- Other future names

> [!IMPORTANT]
> The platform architecture must **not** hard-code a single product name. Product naming must remain configurable.

---

## 3. What This Platform Is

| The platform IS | The platform IS NOT |
|---|---|
| A digital management and traceability system | The biotechnology product |
| An operational dashboard for waste processing | A marketing website |
| A QR-based public traceability tool | An e-commerce platform |
| An AI-assisted decision-support layer | A scientifically validated diagnostic tool |
| An optional IoT integration for weight measurement | A fully automated manufacturing system |
| A data collection foundation for future ML models | A trained machine-learning product |

---

## 4. Core Value Proposition

### For the Scientific Team

- Track every Waste Batch from collection to final Product Batch
- Record processing stages with a complete audit trail
- Store laboratory test results and attachments
- Receive AI-assisted insights on waste condition and processing decisions
- Generate traceability reports

### For Competition Judges / External Stakeholders

- Scan a QR code on any Waste Batch or Product Batch to view its full journey
- View sustainability metrics and waste diversion data
- See a professional, data-driven dashboard
- Witness the end-to-end traceability: Waste → Processing → Product

### For Future Development

- Clean, structured data collection enables future ML model development
- Modular architecture supports adding new product types, tests, and AI capabilities

---

## 5. Platform Capabilities Overview

### 5.1 Waste Batch Management

Every quantity of mango waste entering the system is represented as a unique **Waste Batch** with a public identifier in the format `MW-YYYY-NNN` (e.g., `MW-2026-001`). Each batch carries metadata including waste type, source, weight, collection date, visual condition, and more.

### 5.2 Processing Lifecycle

Each Waste Batch moves through a defined sequence of processing stages. The platform maintains a traceable timeline/history of all stage transitions. Canonical stages are defined in [GOVERNANCE.md](./GOVERNANCE.md).

### 5.3 Product Traceability

Multiple Waste Batches can be linked to a **Product Batch** (identifier format `BF-YYYY-NNN`), establishing full waste-to-product traceability.

### 5.4 QR Code Traceability

Automatic QR code generation for both Waste Batches and Product Batches. Each QR code links to a public, read-only traceability page — no authentication required for viewing.

### 5.5 Operational Dashboard

A real-time operational dashboard calculating all KPI metrics from actual database data. Includes waste collection trends, source distribution, stage distribution, and sustainability metrics.

### 5.6 Laboratory Module

Flexible laboratory test recording supporting arbitrary test types (UV-Vis, TEM, XRD, FTIR, antimicrobial, antioxidant, and future types). Supports file attachments via Supabase Storage.

### 5.7 MangoCycle AI

AI-assisted features including visual waste assessment, processing advice, natural-language data queries, sustainability insights, and report generation. All AI features use external LLM APIs — no custom model training required for MVP.

### 5.8 IoT Integration (Optional)

Optional integration with ESP32-based Smart Bins equipped with load cells for automatic weight measurement. The platform functions fully without IoT hardware — manual weight entry is always available.

### 5.9 Reporting

Structured report generation from verified platform data, with optional PDF export.

### 5.10 Anomaly Detection

Simple statistical anomaly detection (IQR, Z-score, threshold-based) for processing metrics. Not a trained ML model.

---

## 6. Key Stakeholders

| Stakeholder | Interest |
|---|---|
| Scientific Research Team | Process tracking, laboratory data, product traceability |
| University Faculty | Project oversight, competition presentation |
| Competition Judges | Live demo, traceability demonstration, innovation assessment |
| Platform Operators | Day-to-day data entry, waste tracking, processing updates |
| Future Collaborators | Data quality, extensibility, API access |

---

## 7. Competition Demo Context

The platform must support a live demonstration during a university competition. The demo must be functional and self-contained. The complete demo scenario is defined in [32-DEMO-PLAN.md](./32-DEMO-PLAN.md).

Key demo requirements:

- Create a Waste Batch and generate its QR code
- Scan QR code with a mobile phone to view the public Waste Traceability Page
- Update processing stages and see the timeline
- Run AI Waste Visual Analyzer on a real mango waste image
- Create a Product Batch and link Waste Batches to it
- Show end-to-end traceability via Product QR
- Display the Dashboard with live sustainability metrics
- Ask MangoCycle AI a natural-language question about the data
- (Optional) Demonstrate IoT weight capture via Smart Bin

> [!IMPORTANT]
> The demo must remain fully functional even if IoT hardware fails or the AI provider is temporarily unavailable. Manual entry and non-AI workflows must always work.

---

## 8. Design Principles

1. **Traceability First** — Every design decision prioritizes end-to-end traceability
2. **Data Integrity** — Deterministic calculations done by code/database, never by LLM
3. **Scientific Honesty** — AI features clearly labeled as AI-assisted, never as validated science
4. **Graceful Degradation** — Platform works without AI and without IoT
5. **Security by Default** — Private data protected, public pages expose only safe information
6. **Extensibility** — Architecture supports future products, test types, and ML models
7. **MVP Focus** — No overengineering; build what's needed for the competition demo
8. **AI as Support** — AI supports human decision-making, never replaces scientific judgment

---

## 9. Glossary

Canonical terminology is defined and maintained in [GOVERNANCE.md](./GOVERNANCE.md). Key terms include:

| Term | Definition |
|---|---|
| Waste Batch | A tracked unit of collected mango waste (ID: `MW-YYYY-NNN`) |
| Product Batch | A tracked unit of final biological product (ID: `BF-YYYY-NNN`) |
| Smart Bin | An IoT-enabled waste collection device (ID: `BIN-NNN`) |
| Processing Stage | A defined step in the waste-to-product lifecycle |
| MangoCycle AI | The AI-assisted features section of the platform |
| Waste Traceability Page | Public read-only page for a Waste Batch |
| Product Traceability Page | Public read-only page for a Product Batch |

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [GOVERNANCE.md](./GOVERNANCE.md) | Canonical terminology and governance rules |
| [01-PRODUCT-REQUIREMENTS.md](./01-PRODUCT-REQUIREMENTS.md) | Detailed functional/non-functional requirements |
| [02-MVP-SCOPE.md](./02-MVP-SCOPE.md) | Priority tiers and scope boundaries |
| [03-SYSTEM-ARCHITECTURE.md](./03-SYSTEM-ARCHITECTURE.md) | Technical architecture |
| [04-TECH-STACK.md](./04-TECH-STACK.md) | Technology selections |
| [32-DEMO-PLAN.md](./32-DEMO-PLAN.md) | Competition demo scenario |
| [37-OPEN-QUESTIONS.md](./37-OPEN-QUESTIONS.md) | Unresolved decisions |
| [38-DECISION-LOG.md](./38-DECISION-LOG.md) | Architectural decisions |
