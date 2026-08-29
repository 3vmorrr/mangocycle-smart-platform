# MangoCycle Smart Platform — Decision Log

> **Document Name:** Decision Log (Architectural Decision Records)  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 04-TECH-STACK.md, 37-OPEN-QUESTIONS.md

---

## 1. Purpose

This document records all significant architectural and technical decisions using an ADR (Architecture Decision Record) format.

---

## 2. Decision Records

### ADR-001: Next.js + TypeScript

| Field | Value |
|---|---|
| **Decision** | Use Next.js with TypeScript as the primary application framework |
| **Date** | 2026-08-28 |
| **Status** | Accepted |
| **Reason** | SSR, Server Actions, App Router, Vercel integration, type safety, AI agent reliability |
| **Alternatives** | Vite + React (no SSR), Remix (smaller ecosystem), SvelteKit (unfamiliar) |
| **Trade-offs** | Larger framework than Vite; mitigated by Vercel optimization |

### ADR-002: Supabase as BaaS

| Field | Value |
|---|---|
| **Decision** | Use Supabase for database, auth, storage, and realtime |
| **Date** | 2026-08-28 |
| **Status** | Accepted |
| **Reason** | Integrated PostgreSQL + Auth + Storage, RLS, generous free tier, rapid development |
| **Alternatives** | Firebase (NoSQL), self-hosted Postgres (ops overhead), PlanetScale (MySQL) |
| **Trade-offs** | Vendor lock-in; PostgreSQL is portable if needed |

### ADR-003: PostgreSQL over NoSQL

| Field | Value |
|---|---|
| **Decision** | Use PostgreSQL relational database |
| **Date** | 2026-08-28 |
| **Status** | Accepted |
| **Reason** | Relational integrity critical for traceability chain, constraints, RLS |
| **Alternatives** | MongoDB, Firestore |
| **Trade-offs** | Less flexible schema; mitigated by JSONB for flexible fields |

### ADR-004: Vercel for Hosting

| Field | Value |
|---|---|
| **Decision** | Deploy application on Vercel |
| **Date** | 2026-08-28 |
| **Status** | Accepted |
| **Reason** | Native Next.js support, serverless, edge network, preview deployments, free tier |
| **Alternatives** | AWS Amplify, Netlify, self-hosted |
| **Trade-offs** | Vercel-specific optimizations; application is portable Next.js |

### ADR-005: External AI API (No Custom Models)

| Field | Value |
|---|---|
| **Decision** | Use external multimodal LLM API; no custom model training for MVP |
| **Date** | 2026-08-28 |
| **Status** | Accepted |
| **Reason** | No labeled dataset available; external APIs provide vision + tool calling out of the box |
| **Alternatives** | Custom training (requires data), no AI features |
| **Trade-offs** | API costs; dependency on provider; mitigated by provider-agnostic abstraction |

### ADR-006: Tool Calling over SQL Generation

| Field | Value |
|---|---|
| **Decision** | Ask MangoCycle uses LLM Tool Calling with approved functions, not raw SQL generation |
| **Date** | 2026-08-28 |
| **Status** | Accepted |
| **Reason** | Security (no SQL injection), controlled data access, auditable, validated |
| **Alternatives** | Text-to-SQL (security risk), pre-built dashboards only (limited flexibility) |
| **Trade-offs** | Limited to approved tool capabilities; expandable by adding tools |

### ADR-007: IoT is Optional

| Field | Value |
|---|---|
| **Decision** | IoT integration is optional (P4); platform works without it |
| **Date** | 2026-08-28 |
| **Status** | Accepted |
| **Reason** | Hardware may not be available for competition; manual entry is always functional |
| **Alternatives** | Require IoT (risky if hardware fails) |
| **Trade-offs** | None — strictly additive feature |

### ADR-008: UUID Internal IDs + Public Codes

| Field | Value |
|---|---|
| **Decision** | Use UUID as internal primary keys; human-readable public codes separately |
| **Date** | 2026-08-28 |
| **Status** | Accepted |
| **Reason** | UUIDs prevent enumeration; public codes are user-friendly and traceable |
| **Alternatives** | Auto-increment (enumerable), public codes as PK (brittle) |
| **Trade-offs** | Two identifiers per entity; minor complexity |

### ADR-009: QR Contains URL, Not Data

| Field | Value |
|---|---|
| **Decision** | QR codes encode a URL to the public traceability page, not batch data |
| **Date** | 2026-08-28 |
| **Status** | Accepted |
| **Reason** | URLs always show current data; QR doesn't need regeneration on updates |
| **Alternatives** | Embed JSON in QR (static, limited size, outdated) |
| **Trade-offs** | Requires internet access to view data |

### ADR-010: TEXT with CHECK over PostgreSQL ENUM

| Field | Value |
|---|---|
| **Decision** | Use TEXT columns with CHECK constraints instead of PostgreSQL ENUM types |
| **Date** | 2026-08-28 |
| **Status** | Accepted |
| **Reason** | Easier to modify during rapid development; ENUM ALTER requires migration complexity |
| **Alternatives** | PostgreSQL ENUM (harder to change), lookup tables (more joins) |
| **Trade-offs** | Less strict typing at DB level; compensated by Zod validation |

### ADR-011: No Python in MVP

| Field | Value |
|---|---|
| **Decision** | No Python in MVP; TypeScript only |
| **Date** | 2026-08-28 |
| **Status** | Accepted |
| **Reason** | Single-language stack simplicity; Python only needed for future custom ML |
| **Alternatives** | Python ML microservice (premature for MVP) |
| **Trade-offs** | Cannot use Python ML libraries; not needed for MVP scope |

### ADR-012: Server Actions as Primary API

| Field | Value |
|---|---|
| **Decision** | Use Next.js Server Actions for frontend-to-server communication; Route Handlers only for external clients |
| **Date** | 2026-08-28 |
| **Status** | Accepted |
| **Reason** | Type-safe, less boilerplate, built-in CSRF protection, progressive enhancement |
| **Alternatives** | REST API routes for everything (more code, separate type definitions) |
| **Trade-offs** | Server Actions are Next.js-specific; acceptable for monolithic app |

---

## 3. Pending Decisions

| Decision | Linked Question | Status |
|---|---|---|
| AI provider selection | Q09 | Pending |
| Domain name | Q10 | Pending |
| Scientific thresholds for advisor | Q02 | Pending |
| Sustainability calculation methodology | Q06 | Pending |

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [GOVERNANCE.md](./GOVERNANCE.md) | Change management process |
| [37-OPEN-QUESTIONS.md](./37-OPEN-QUESTIONS.md) | Unresolved decisions |
| [04-TECH-STACK.md](./04-TECH-STACK.md) | Technology decisions documented here |
