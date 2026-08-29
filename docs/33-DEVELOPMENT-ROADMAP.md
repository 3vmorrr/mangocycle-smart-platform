# MangoCycle Smart Platform — Development Roadmap

> **Document Name:** Development Roadmap  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 02-MVP-SCOPE.md, 35-AGENT-INSTRUCTIONS.md

---

## 1. Purpose

This document provides the phased development roadmap aligned with the priority tiers in [02-MVP-SCOPE.md](./02-MVP-SCOPE.md).

---

## 2. Implementation Phases

### Phase 1: Foundation (P0)

**Goal:** Deployable platform with core waste traceability.

| Task | Detail |
|---|---|
| 1.1 | Initialize Next.js project with TypeScript, Tailwind CSS |
| 1.2 | Set up Supabase project (database, auth, storage) |
| 1.3 | Create database migrations (core tables) |
| 1.4 | Implement Supabase Auth (login, password reset) |
| 1.5 | Set up middleware (route protection, role check) |
| 1.6 | Build application shell (sidebar, header, layout) |
| 1.7 | Implement Waste Batch CRUD + processing timeline |
| 1.8 | Implement QR code generation |
| 1.9 | Build public Waste Traceability Page |
| 1.10 | Build Dashboard with KPI cards and charts |
| 1.11 | Implement audit logging |
| 1.12 | Build user management (admin) |
| 1.13 | Create seed/demo data script |
| 1.14 | Deploy to Vercel |

**Definition of Done:** Complete demo steps 1–7, 15–16 functional.

### Phase 2: Full Traceability (P1)

**Goal:** Complete waste-to-product traceability chain.

| Task | Detail |
|---|---|
| 2.1 | Implement Product Batch CRUD |
| 2.2 | Build waste-to-product linking |
| 2.3 | Build Product QR + Product Traceability Page |
| 2.4 | Implement Laboratory Module (CRUD + file upload) |
| 2.5 | Extend Dashboard (product charts, attention section) |
| 2.6 | Build admin pages (sources, stages, audit logs) |

**Definition of Done:** Complete demo steps 10–14 functional.

### Phase 3: AI Features (P2)

**Goal:** AI-assisted features operational.

| Task | Detail |
|---|---|
| 3.1 | Build AI abstraction layer (provider, validation) |
| 3.2 | Implement AI Waste Visual Analyzer |
| 3.3 | Implement AI Processing Advisor (rule engine + LLM) |
| 3.4 | Implement Ask MangoCycle (tool calling) |
| 3.5 | Implement AI Sustainability Insights |
| 3.6 | Build MangoCycle AI navigation section |

**Definition of Done:** Complete demo steps 8–9, 17 functional.

### Phase 4: Reports & Analytics (P3)

| Task | Detail |
|---|---|
| 4.1 | Build report generation framework |
| 4.2 | Implement anomaly detection alerts |
| 4.3 | Implement batch risk score (optional) |

### Phase 5: IoT (P4)

| Task | Detail |
|---|---|
| 5.1 | Build IoT weight endpoint |
| 5.2 | Build device management pages |
| 5.3 | ESP32 firmware development |
| 5.4 | Integration testing with hardware |

---

## 3. Development Process per Phase

```
1. Read all project documentation
2. Select implementation tasks for the phase
3. Inspect existing code before editing
4. Implement only the requested scope
5. Run type checks (tsc --noEmit)
6. Run lint (eslint)
7. Run tests
8. Review database migrations
9. Review security
10. Commit small coherent changes
```

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [02-MVP-SCOPE.md](./02-MVP-SCOPE.md) | Priority tiers and scope |
| [35-AGENT-INSTRUCTIONS.md](./35-AGENT-INSTRUCTIONS.md) | Agent coding rules |
| [36-DEFINITION-OF-DONE.md](./36-DEFINITION-OF-DONE.md) | Completion criteria |
| [32-DEMO-PLAN.md](./32-DEMO-PLAN.md) | Demo scenario driving priorities |
