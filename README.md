# MangoCycle Smart Platform

> **Document Name:** README  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** All documentation files in `/docs`

---

## Overview

**MangoCycle Smart Platform** is a digital management, traceability, sustainability, and AI-assisted decision-support system for a university biotechnology innovation project that converts mango waste into value-added biological products.

This repository contains the complete technical specification and implementation of the platform.

---

## Documentation

All project documentation is in the [`/docs`](./docs/) directory:

| # | Document | Purpose |
|---|---|---|
| — | [GOVERNANCE.md](./docs/GOVERNANCE.md) | Documentation governance, canonical terminology, change management |
| 00 | [PROJECT-OVERVIEW.md](./docs/00-PROJECT-OVERVIEW.md) | Project context, objectives, design principles |
| 01 | [PRODUCT-REQUIREMENTS.md](./docs/01-PRODUCT-REQUIREMENTS.md) | Complete functional and non-functional requirements |
| 02 | [MVP-SCOPE.md](./docs/02-MVP-SCOPE.md) | Priority tiers (P0–P4), scope boundaries, build order |
| 03 | [SYSTEM-ARCHITECTURE.md](./docs/03-SYSTEM-ARCHITECTURE.md) | Architecture diagrams, data flows, component structure |
| 04 | [TECH-STACK.md](./docs/04-TECH-STACK.md) | Technology selections with justifications |
| 05 | [DATABASE-SCHEMA.md](./docs/05-DATABASE-SCHEMA.md) | PostgreSQL schema, constraints, indexes, RLS, migrations |
| 06 | [DATABASE-RELATIONSHIPS.md](./docs/06-DATABASE-RELATIONSHIPS.md) | ER diagram, relationship descriptions |
| 07 | [AUTH-AND-RBAC.md](./docs/07-AUTH-AND-RBAC.md) | Authentication, roles, permission matrix |
| 08 | [SECURITY.md](./docs/08-SECURITY.md) | Security requirements across all layers |
| 09 | [ROUTES-AND-PAGES.md](./docs/09-ROUTES-AND-PAGES.md) | All application routes and page definitions |
| 10 | [UI-UX-SPECIFICATION.md](./docs/10-UI-UX-SPECIFICATION.md) | Design system, layout, component patterns |
| 11 | [WASTE-TRACEABILITY.md](./docs/11-WASTE-TRACEABILITY.md) | Waste Batch lifecycle and public traceability |
| 12 | [PRODUCT-TRACEABILITY.md](./docs/12-PRODUCT-TRACEABILITY.md) | Product Batch lifecycle, waste-to-product linking |
| 13 | [QR-SYSTEM.md](./docs/13-QR-SYSTEM.md) | QR code generation and scanning |
| 14 | [LABORATORY-MODULE.md](./docs/14-LABORATORY-MODULE.md) | Flexible laboratory test records and file uploads |
| 15 | [AI-ARCHITECTURE.md](./docs/15-AI-ARCHITECTURE.md) | AI abstraction layer, validation, safety |
| 16 | [AI-WASTE-ANALYZER.md](./docs/16-AI-WASTE-ANALYZER.md) | Vision-based waste visual assessment |
| 17 | [AI-PROCESSING-ADVISOR.md](./docs/17-AI-PROCESSING-ADVISOR.md) | Rule engine + LLM processing recommendations |
| 18 | [ASK-MANGOCYCLE.md](./docs/18-ASK-MANGOCYCLE.md) | Natural-language data queries via tool calling |
| 19 | [AI-SUSTAINABILITY-INSIGHTS.md](./docs/19-AI-SUSTAINABILITY-INSIGHTS.md) | AI-interpreted sustainability metrics |
| 20 | [REPORTING.md](./docs/20-REPORTING.md) | Report generation and PDF export |
| 21 | [ANOMALY-DETECTION.md](./docs/21-ANOMALY-DETECTION.md) | Statistical anomaly alerts |
| 22 | [IOT-ARCHITECTURE.md](./docs/22-IOT-ARCHITECTURE.md) | Smart Bin IoT integration |
| 23 | [ESP32-INTEGRATION.md](./docs/23-ESP32-INTEGRATION.md) | ESP32 firmware specification |
| 24 | [API-SPECIFICATION.md](./docs/24-API-SPECIFICATION.md) | All API contracts |
| 25 | [VALIDATION-RULES.md](./docs/25-VALIDATION-RULES.md) | Zod validation schemas |
| 26 | [ERROR-HANDLING.md](./docs/26-ERROR-HANDLING.md) | Error handling strategy |
| 27 | [AUDIT-LOGGING.md](./docs/27-AUDIT-LOGGING.md) | Audit event catalog |
| 28 | [I18N-RTL.md](./docs/28-I18N-RTL.md) | Internationalization and RTL architecture |
| 29 | [ENVIRONMENT-CONFIG.md](./docs/29-ENVIRONMENT-CONFIG.md) | Environment variables and .env.example |
| 30 | [DEPLOYMENT.md](./docs/30-DEPLOYMENT.md) | Deployment architecture and procedures |
| 31 | [TESTING-STRATEGY.md](./docs/31-TESTING-STRATEGY.md) | Testing framework and test categories |
| 32 | [DEMO-PLAN.md](./docs/32-DEMO-PLAN.md) | Competition demo scenario |
| 33 | [DEVELOPMENT-ROADMAP.md](./docs/33-DEVELOPMENT-ROADMAP.md) | Phased implementation plan |
| 34 | [FUTURE-AI-ROADMAP.md](./docs/34-FUTURE-AI-ROADMAP.md) | Post-MVP AI features |
| 35 | [AGENT-INSTRUCTIONS.md](./docs/35-AGENT-INSTRUCTIONS.md) | **Must-read for AI coding agents** |
| 36 | [DEFINITION-OF-DONE.md](./docs/36-DEFINITION-OF-DONE.md) | Feature completion criteria |
| 37 | [OPEN-QUESTIONS.md](./docs/37-OPEN-QUESTIONS.md) | Unresolved decisions and assumptions |
| 38 | [DECISION-LOG.md](./docs/38-DECISION-LOG.md) | Architectural decision records |

---

## Quick Start

```bash
# Clone
git clone <repo-url>
cd mangocycle

# Install
npm install

# Configure
cp .env.example .env.local
# Fill in Supabase and AI credentials

# Database
npx supabase db push

# Run
npm run dev
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Next.js Server Actions, Route Handlers |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| AI | External LLM API |
| IoT | ESP32 + Arduino C++ |
| Hosting | Vercel + Supabase Cloud |

---

## For AI Coding Agents

**Start here:** Read [35-AGENT-INSTRUCTIONS.md](./docs/35-AGENT-INSTRUCTIONS.md) before writing any code.

---

## License

TBD

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [GOVERNANCE.md](./docs/GOVERNANCE.md) | Master governance document |
| [35-AGENT-INSTRUCTIONS.md](./docs/35-AGENT-INSTRUCTIONS.md) | Agent-specific instructions |
