# MangoCycle Smart Platform — Open Questions

> **Document Name:** Open Questions  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 38-DECISION-LOG.md

---

## 1. Purpose

This document tracks all unresolved questions, assumptions, and decisions that need input from the scientific team, product team, or stakeholders. Do NOT invent answers to these questions — document them and proceed with stated assumptions.

---

## 2. Classification

| Symbol | Meaning |
|---|---|
| 🔴 | **Decision Needed** — blocks or significantly affects implementation |
| 🟡 | **Assumption Made** — proceeding with stated assumption; needs validation |
| 🟢 | **Known Requirement** — resolved; documented for reference |
| ⚪ | **Low Priority** — nice to know but doesn't block MVP |

---

## 3. Open Questions

### Scientific Team Input Required

| # | Question | Status | Current Assumption | Impact |
|---|---|---|---|---|
| Q01 | What are the exact approved processing stages? | 🟡 | Using: Collected → Sorted → Washed → Dried → Ground → Extraction → Production → Lab Testing → Completed | Stages are configurable; can be changed later |
| Q02 | What scientific thresholds should the Processing Advisor use? (e.g., max storage days, moisture triggers) | 🔴 | Placeholder values labeled "TBD by scientific team" | Rule engine rules will use placeholder thresholds |
| Q03 | What factors and weights should the Batch Risk Score use? | 🔴 | Prototype values clearly labeled as unvalidated | Risk scores are P3; not blocking MVP |
| Q04 | What laboratory test fields are most important? | 🟡 | Flexible test type with generic numeric result + text summary | Schema supports any test type |
| Q05 | Should product quantity/unit be displayed on public traceability pages? | 🟡 | Not displayed (may be commercially sensitive) | Easy to change |
| Q06 | What sustainability metrics should be calculated? (carbon offset, economic value?) | 🔴 | Using simple waste weight as diversion metric only | No unvalidated sustainability claims |
| Q07 | What is the official final product name? | 🟡 | Product name is configurable; not hard-coded | No architecture impact |

### Product Team Input Required

| # | Question | Status | Current Assumption | Impact |
|---|---|---|---|---|
| Q08 | What is the final official platform name? | 🟡 | "MangoCycle Smart Platform" | Affects branding only |
| Q09 | Which AI provider to use? (OpenAI, Google Gemini, Anthropic) | 🔴 | Architecture is provider-agnostic; implementation will use whichever is configured | Need API key before P2 features |
| Q10 | What domain name to use? | 🟡 | Vercel-provided domain for MVP | Need custom domain for production QR codes |
| Q11 | Is Arabic language support needed for the competition demo? | 🟡 | English only for MVP; RTL-ready architecture | No translation files needed immediately |
| Q12 | Are there branding guidelines (logo, colors)? | 🟡 | Using the design direction in [10-UI-UX-SPECIFICATION.md](./10-UI-UX-SPECIFICATION.md) | Visual design adjustable |

### Technical Decisions Pending

| # | Question | Status | Current Assumption | Impact |
|---|---|---|---|---|
| Q13 | ESP32 hardware availability for competition? | ⚪ | IoT is optional (P4); manual weight entry works | Only affects IoT implementation |
| Q14 | Supabase plan? (Free tier vs paid) | 🟡 | Free tier for MVP | Limits on database size, storage, backups |
| Q15 | Should we use shadcn/ui component library? | 🟡 | Recommended but not required (noted in [04-TECH-STACK.md](./04-TECH-STACK.md)) | Implementing agent can decide |
| Q16 | Batch code format — should NNN support >999? | ⚪ | 3-digit (000–999) sufficient for MVP | Can extend later if needed |

---

## 4. Resolution Process

When a question is resolved:

1. Update the status to 🟢
2. Record the resolution in this document
3. Update any affected documentation files
4. If an architectural decision, add to [38-DECISION-LOG.md](./38-DECISION-LOG.md)

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [GOVERNANCE.md](./GOVERNANCE.md) | Change management process |
| [38-DECISION-LOG.md](./38-DECISION-LOG.md) | Resolved decisions logged here |
| [17-AI-PROCESSING-ADVISOR.md](./17-AI-PROCESSING-ADVISOR.md) | Q02 affects rule thresholds |
| [04-TECH-STACK.md](./04-TECH-STACK.md) | Q09, Q15 affect tech choices |
