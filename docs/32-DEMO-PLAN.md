# MangoCycle Smart Platform — Demo Plan

> **Document Name:** Demo Plan  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 02-MVP-SCOPE.md, 00-PROJECT-OVERVIEW.md

---

## 1. Purpose

This document defines the exact competition demo scenario that the platform must support. All P0 features must work for this demo. P1+ features enhance it.

---

## 2. Demo Scenario

### Step-by-Step Script

| Step | Action | Feature Required | Priority |
|---|---|---|---|
| 1 | Place real mango waste on/in a collection container | Physical setup | — |
| 2 | (If IoT) Load Cell measures weight, appears on dashboard | IoT + Dashboard | P4 |
| 3 | Create Waste Batch `MW-2026-001` (manual weight entry if no IoT) | Waste Batch CRUD | P0 |
| 4 | Generate QR Code for the batch | QR Generation | P0 |
| 5 | Scan QR Code using a phone | QR + Public Page | P0 |
| 6 | Show public Waste Traceability Page on phone | Waste Traceability Page | P0 |
| 7 | Update processing stages (Collected → Sorted → Washed → Dried) | Processing Timeline | P0 |
| 8 | Run AI Waste Visual Assessment using a real photo | AI Waste Analyzer | P2 |
| 9 | Run AI Processing Advisor on the batch | AI Processing Advisor | P2 |
| 10 | Create Product Batch `BF-2026-001` | Product Batch CRUD | P1 |
| 11 | Link `MW-2026-001` to `BF-2026-001` | Waste-Product Linking | P1 |
| 12 | Add laboratory test statuses | Laboratory Module | P1 |
| 13 | Scan Product QR Code on phone | Product QR | P1 |
| 14 | Show complete traceability journey on Product Traceability Page | Product Traceability Page | P1 |
| 15 | Open Dashboard | Dashboard | P0 |
| 16 | Show updated sustainability metrics | Dashboard KPIs | P0 |
| 17 | Ask MangoCycle AI a question about the data | Ask MangoCycle | P2 |

---

## 3. Fallback Scenarios

| If This Fails | Do This |
|---|---|
| IoT hardware unavailable | Use manual weight entry (Step 2 → Step 3) |
| AI provider down | Skip Steps 8, 9, 17 — show all non-AI features |
| Phone can't scan QR | Open the URL manually on a phone/tablet browser |
| Internet issues | Have local screenshots as backup |

---

## 4. Minimum Viable Demo (P0 Only)

If only P0 features are complete:

1. Create Waste Batch → 2. Generate QR → 3. Scan QR on phone → 4. View Traceability Page → 5. Update stages → 6. View Dashboard with metrics

This is a **complete, demonstrable** demo with end-to-end traceability.

---

## 5. Demo Data Setup

Pre-load demo data to show a populated system:

| Entity | Data |
|---|---|
| Waste Sources | University Agriculture Lab, Mango Processing Factory A, Juice Factory B |
| Waste Batches | `MW-2026-001` (Completed), `MW-2026-002` (In Progress), `MW-2026-003` (Collected) |
| Product Batch | `BF-2026-001` (linked to MW-2026-001) |
| Lab Tests | 2–3 sample tests with different statuses |
| IoT Device | `BIN-001` (if IoT enabled) |

> [!WARNING]
> Demo data must be clearly labeled as fictional/sample data. Use a seed script that marks data as `is_demo = true` or uses a separate schema/flag.

---

## 6. Technical Checklist

- [ ] Deployed to public URL (Vercel)
- [ ] `NEXT_PUBLIC_APP_URL` points to production deployment
- [ ] QR codes resolve correctly on mobile
- [ ] Demo data seeded
- [ ] AI provider API key configured and tested
- [ ] Phone/tablet available for QR scanning
- [ ] Backup screenshots prepared
- [ ] Presenter has login credentials

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [02-MVP-SCOPE.md](./02-MVP-SCOPE.md) | Demo compatibility matrix |
| [00-PROJECT-OVERVIEW.md](./00-PROJECT-OVERVIEW.md) | Competition context |
| [13-QR-SYSTEM.md](./13-QR-SYSTEM.md) | QR code demo requirements |
