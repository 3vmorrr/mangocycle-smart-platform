# MangoCycle Smart Platform — Definition of Done

> **Document Name:** Definition of Done  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 35-AGENT-INSTRUCTIONS.md, 31-TESTING-STRATEGY.md

---

## 1. Purpose

This document defines what "done" means for every feature. A feature is **NOT done** merely because a page visually exists.

---

## 2. Universal Definition of Done

Every feature, regardless of type, must satisfy ALL of the following:

- [ ] **UI exists** and matches the specification
- [ ] **Validation works** — invalid input is rejected with clear messages
- [ ] **Database operations work** — data is correctly created/read/updated
- [ ] **Authorization works** — role restrictions enforced
- [ ] **Error handling works** — errors shown gracefully, no internals exposed
- [ ] **Audit log created** — significant actions recorded
- [ ] **TypeScript passes** — `tsc --noEmit` succeeds
- [ ] **Lint passes** — no ESLint errors
- [ ] **Tests pass** — relevant unit/integration tests written and passing
- [ ] **No exposed secrets** — no server secrets in client code
- [ ] **Public/private boundary respected** — public pages show only safe data
- [ ] **Responsive** — works on desktop and mobile
- [ ] **Accessible** — keyboard navigable, proper labels

---

## 3. Feature-Specific Checklists

### 3.1 Waste Batch Creation

- [ ] Create form exists with all specified fields
- [ ] Zod validation on client and server
- [ ] Unique batch code (`MW-YYYY-NNN`) generated
- [ ] Database insert succeeds
- [ ] Initial stage history (`collected`) created
- [ ] Audit log: `batch.created`
- [ ] Success notification shown
- [ ] Batch appears in list view
- [ ] Batch detail page works
- [ ] QR code can be generated
- [ ] Processing timeline shows `Collected` as first stage

### 3.2 Processing Stage Update

- [ ] Stage update UI exists on batch detail page
- [ ] Stage history record appended (not updated)
- [ ] `current_status` field updated on waste batch
- [ ] Audit log: `batch.stage_changed`
- [ ] Timeline visualization updates
- [ ] Public traceability page reflects new stage

### 3.3 QR Code & Public Page

- [ ] QR code generates with correct URL
- [ ] QR downloadable as PNG/SVG
- [ ] Public page loads without authentication
- [ ] Public page shows only public-safe data
- [ ] Page is mobile-responsive
- [ ] 404 page for invalid batch codes

### 3.4 Product Batch with Linking

- [ ] Product created with unique code (`BF-YYYY-NNN`)
- [ ] Waste Batches linked successfully
- [ ] Link validation (waste batch must exist)
- [ ] `product_waste_links` records created
- [ ] Audit log: `product.created`, `product.waste_linked`
- [ ] Product detail shows linked waste batches
- [ ] Product QR and public page work

### 3.5 Laboratory Test

- [ ] Test record created with flexible test type
- [ ] Associated with Waste Batch and/or Product Batch
- [ ] File upload works (validation: size, type)
- [ ] Files stored in Supabase Storage
- [ ] Attachments downloadable
- [ ] Researcher notes are private (not on public pages)

### 3.6 AI Feature

- [ ] AI call executes successfully via abstraction layer
- [ ] AI output validated with Zod schema
- [ ] Result stored in `ai_analysis_records`
- [ ] Appropriate disclaimer displayed
- [ ] Error state handles AI unavailability gracefully
- [ ] Rate limiting enforced
- [ ] No scientific claims beyond specification

### 3.7 Dashboard

- [ ] All KPI cards show real database values
- [ ] Charts render from real data
- [ ] Date range filter works
- [ ] No AI-generated metrics (all deterministic)
- [ ] Responsive layout
- [ ] Recent batches section populated

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [35-AGENT-INSTRUCTIONS.md](./35-AGENT-INSTRUCTIONS.md) | Agent quality checklist |
| [31-TESTING-STRATEGY.md](./31-TESTING-STRATEGY.md) | Test requirements |
| [08-SECURITY.md](./08-SECURITY.md) | Security checklist |
