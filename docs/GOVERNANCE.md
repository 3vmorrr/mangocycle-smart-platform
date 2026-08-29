# Documentation Governance

> **Document Name:** Documentation Governance  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** All project documentation files

---

## 1. Purpose

This document defines the governance rules for the MangoCycle Smart Platform documentation suite. Every document author — human or AI agent — must follow these rules to maintain consistency, traceability, and implementation readiness.

---

## 2. Document Metadata

Every documentation file must begin with a metadata block immediately after the title:

```
> **Document Name:** [Full document title]
> **Version:** [Major.Minor, starting at 0.1]
> **Status:** Draft | Reviewed | Approved
> **Last Updated:** [YYYY-MM-DD]
> **Owner:** [Responsible team or individual]
> **Related Documents:** [Comma-separated list of related document filenames]
```

### Rules

- All initially generated documents must be marked **Draft**.
- Only a human reviewer may change status to **Reviewed** or **Approved**.
- AI agents must **never** mark a document as Approved automatically.
- Version increments:
  - Minor (0.1 → 0.2): Content edits, clarifications, additions.
  - Major (0.x → 1.0): First human-approved version.

---

## 3. Authoritative Source Rule

Each piece of authoritative information must be defined in **exactly one** canonical document. Other documents may reference that information but must **not** redefine it in a way that could conflict.

### Canonical Authority Map

| Information Type | Authoritative Document |
|---|---|
| Database table definitions, columns, types, constraints | `05-DATABASE-SCHEMA.md` |
| Database relationships, ER diagram | `06-DATABASE-RELATIONSHIPS.md` |
| Role definitions and permissions | `07-AUTH-AND-RBAC.md` |
| Security policies and requirements | `08-SECURITY.md` |
| Route/page definitions and classifications | `09-ROUTES-AND-PAGES.md` |
| API contracts (routes, methods, payloads) | `24-API-SPECIFICATION.md` |
| Validation rules | `25-VALIDATION-RULES.md` |
| Environment variables | `29-ENVIRONMENT-CONFIG.md` |
| MVP scope and priority tiers | `02-MVP-SCOPE.md` |
| Architectural decisions | `38-DECISION-LOG.md` |
| Open questions and assumptions | `37-OPEN-QUESTIONS.md` |
| Canonical terminology | This document (`GOVERNANCE.md`) |

### Referencing Convention

When another document needs to mention an authoritative item, use this pattern:

```
> Roles and permissions are defined authoritatively in [07-AUTH-AND-RBAC.md](./07-AUTH-AND-RBAC.md).
```

Do **not** copy full definitions — summarize if needed and link to the source.

---

## 4. Canonical Terminology

All documents must use these exact terms consistently. Do not introduce synonyms, abbreviations, or alternative names without updating this section and the Decision Log.

### Platform

| Canonical Term | Usage | Do NOT Use |
|---|---|---|
| MangoCycle Smart Platform | Full platform name | MangoCycle App, The System |
| MangoCycle AI | AI section/module name | AI Hub, Smart AI |

### Entities

| Canonical Term | Public Identifier Format | Usage |
|---|---|---|
| Waste Batch | `MW-YYYY-NNN` | A tracked unit of collected mango waste |
| Product Batch | `BF-YYYY-NNN` | A tracked unit of final biological product |
| Smart Bin | `BIN-NNN` | An IoT-enabled waste collection device |
| Laboratory Test | — | A recorded scientific analysis |

### Pages

| Canonical Term | Context |
|---|---|
| Waste Traceability Page | Public read-only page for a Waste Batch (QR target) |
| Product Traceability Page | Public read-only page for a Product Batch (QR target) |
| Dashboard | Main authenticated operational dashboard |

### Processing Stages

The canonical ordered list of processing stages:

1. Collected
2. Sorted
3. Washed
4. Dried
5. Ground
6. Extraction
7. Production
8. Laboratory Testing
9. Completed

> [!NOTE]
> The exact stage list is subject to scientific team validation. See [37-OPEN-QUESTIONS.md](./37-OPEN-QUESTIONS.md).

### AI Feature Names

| Canonical Term | Short Reference |
|---|---|
| AI Waste Visual Analyzer | Waste Analyzer |
| AI Processing Advisor | Processing Advisor |
| Ask MangoCycle | Ask MangoCycle |
| AI Sustainability Insights | Sustainability Insights |
| AI Report Generator | Report Generator |

### Scientific Language

| Use ✅ | Do NOT Use ❌ |
|---|---|
| AI-assisted | AI accurately diagnoses |
| Visual assessment | Automated diagnosis |
| Decision support | AI guarantees quality |
| Statistical alert | Clinically proven |
| Estimated | Scientifically validated (unless proven) |
| Prototype | Production-ready (unless verified) |
| Requires scientific validation | — |

---

## 5. Document Structure

Every documentation file must follow this structure:

1. **Title** — `# Document Title`
2. **Metadata block** — As specified in Section 2
3. **Body content** — Organized with `##` and `###` headings
4. **Dependencies & Related Documents** — Final section (see Section 6)

---

## 6. Dependencies & Related Documents Section

Every document must end with:

```markdown
## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [filename](./filename) | [depends on / referenced by / interacts with] |
```

This section makes cross-document dependencies explicit and auditable.

---

## 7. Phase Consistency Reviews

After completing each documentation phase, a mini consistency review must be performed before continuing to the next phase.

### Review Checklist

- [ ] **Terminology** — All canonical terms used correctly (no synonyms, no invented terms)
- [ ] **Database names** — Table and column names consistent with `05-DATABASE-SCHEMA.md`
- [ ] **Roles** — Role names consistent with `07-AUTH-AND-RBAC.md`
- [ ] **Routes** — Page/route paths consistent with `09-ROUTES-AND-PAGES.md`
- [ ] **Feature scope** — Features correctly classified per `02-MVP-SCOPE.md`
- [ ] **MVP vs Future** — No future features described as MVP, no MVP features missing
- [ ] **Security boundaries** — Public/private data separation consistent with `08-SECURITY.md`
- [ ] **AI limitations** — Scientific language constraints respected throughout
- [ ] **Identifier formats** — `MW-YYYY-NNN`, `BF-YYYY-NNN`, `BIN-NNN` used correctly

---

## 8. Change Management

If any document requires changing an earlier architectural decision:

1. **Do NOT silently change it.**
2. Update `38-DECISION-LOG.md` with:
   - The original decision
   - The proposed change
   - The reason
   - Affected documents
3. Identify and list all affected documents.
4. Update all affected documents to reflect the change.
5. Increment version numbers on all changed documents.
6. Document the reason for the change in each updated file's metadata or a changelog section.

---

## 9. AI Agent Compliance

AI coding agents working from this documentation must:

- Read `GOVERNANCE.md` before generating or modifying any document.
- Follow the authoritative source rule — never redefine canonical information.
- Use canonical terminology exactly as specified.
- Never mark documents as Approved.
- Perform consistency reviews at phase boundaries.
- Log changes that affect architectural decisions in the Decision Log.

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| All project files | This document governs all other documentation files |
| [38-DECISION-LOG.md](./38-DECISION-LOG.md) | Change management target |
| [37-OPEN-QUESTIONS.md](./37-OPEN-QUESTIONS.md) | Tracks unresolved terminology/decisions |
| [35-AGENT-INSTRUCTIONS.md](./35-AGENT-INSTRUCTIONS.md) | Agent compliance rules reference this document |
