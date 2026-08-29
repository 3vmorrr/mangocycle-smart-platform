# MangoCycle Smart Platform — Agent Instructions

> **Document Name:** Agent Instructions  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, all project documentation

---

## 1. Purpose

This document provides mandatory instructions for any AI coding agent working on the MangoCycle Smart Platform codebase. Read this document **before** writing any code.

---

## 2. Pre-Coding Requirements

Before writing any code, you MUST:

1. **Read** `GOVERNANCE.md` — understand terminology, authority map, and governance rules
2. **Read** `02-MVP-SCOPE.md` — understand what is in scope
3. **Read** relevant feature documents for the task at hand
4. **Inspect** existing code before editing — never assume the current state
5. **Check** `38-DECISION-LOG.md` for architectural decisions
6. **Check** `37-OPEN-QUESTIONS.md` for unresolved items

---

## 3. Coding Standards

### 3.1 TypeScript

- **Strict mode** enabled (`strict: true` in tsconfig)
- **Avoid `any`** unless explicitly justified and documented with a comment
- **Use reusable components** — do not duplicate UI patterns
- **Type all function parameters and return values**
- **Use Zod schemas** for runtime validation of external data

### 3.2 File Organization

- Follow the project structure defined in [03-SYSTEM-ARCHITECTURE.md](./03-SYSTEM-ARCHITECTURE.md) §4.1
- Place Server Actions in `actions/` directory
- Place validators in `lib/validators/`
- Place AI integration code in `lib/ai/`
- Keep components focused and reusable

### 3.3 Database

- **Never** alter the database schema without documenting the change
- Use Supabase CLI migrations for all schema changes
- Run `supabase gen types` after migration changes
- Use parameterized queries only — never string interpolation
- Use transactions for multi-step consistency where needed
- Keep migrations deterministic and idempotent

### 3.4 Security

- Keep server-only secrets on the server — never in `NEXT_PUBLIC_` variables
- Validate **every** external input (forms, API payloads, AI responses, IoT data)
- Never trust AI output directly — validate with Zod
- Never trust IoT payloads directly — validate all fields
- Do not alter public data exposure without security review
- Check authentication and authorization in every Server Action / API handler

---

## 4. Prohibited Actions

Coding agents must **NEVER**:

| ❌ Action | Reason |
|---|---|
| Rewrite unrelated working features | Scope creep; breaks existing functionality |
| Silently change database schema | Must follow migration + documentation process |
| Delete existing functionality without explanation | Must document reasoning |
| Replace working architecture because another stack is preferred | Follow existing tech stack decisions |
| Fabricate credentials or secrets | Use `.env.example` as reference only |
| Mark unfinished features as complete | Follow Definition of Done |
| Use `any` without justification | TypeScript strict mode requirement |
| Create fake scientific claims | Scientific language constraints |
| Create fake dashboard data outside seed/demo mode | Data integrity requirement |
| Generate arbitrary SQL from AI/LLM | Security requirement |
| Expose server secrets to client | Security requirement |
| Commit API keys or passwords | Security requirement |

---

## 5. AI-Specific Rules

When implementing AI features:

- **Label all AI features** with appropriate disclaimers (see [15-AI-ARCHITECTURE.md](./15-AI-ARCHITECTURE.md) §7)
- **Validate all AI output** with Zod schemas before use
- **Never** let AI fabricate database values
- **Never** present AI guesses as laboratory facts
- **Separate** observation from interpretation
- **Communicate** uncertainty in AI responses
- **Recommend** manual review where appropriate
- **Use** approved tool functions for Ask MangoCycle — no raw SQL
- **Store** AI interactions in `ai_analysis_records` for audit

---

## 6. Quality Checklist per Feature

After implementing any feature:

- [ ] TypeScript compiles without errors (`tsc --noEmit`)
- [ ] ESLint passes with no warnings
- [ ] Relevant unit tests written and passing
- [ ] Server Action has authentication + authorization checks
- [ ] Input validated with Zod
- [ ] Audit log entry created for significant actions
- [ ] Error handling implemented (no exposed internals)
- [ ] Public pages do not expose private data
- [ ] No `console.log` of sensitive data
- [ ] No hard-coded secrets
- [ ] Demo data clearly distinguishable from production data
- [ ] Feature matches the specification in the relevant documentation file

---

## 7. Workflow per Implementation Task

```
1. Read all relevant project documentation
2. Select ONE implementation task
3. Inspect existing code
4. Implement the task
5. Run type checks
6. Run lint
7. Run tests
8. Review for security
9. Update documentation if architecture changed
10. Commit with a clear, descriptive message
```

---

## 8. When Uncertain

- **If a requirement is unclear:** Document the uncertainty in code comments and flag it
- **If a scientific decision is needed:** Do NOT invent thresholds or values. Use placeholder values clearly labeled "TBD by scientific team"
- **If an architectural change seems needed:** Update `38-DECISION-LOG.md` first, then implement
- **If a feature scope is ambiguous:** Reference `02-MVP-SCOPE.md` and `01-PRODUCT-REQUIREMENTS.md`

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [GOVERNANCE.md](./GOVERNANCE.md) | Master governance rules |
| [02-MVP-SCOPE.md](./02-MVP-SCOPE.md) | Scope boundaries |
| [03-SYSTEM-ARCHITECTURE.md](./03-SYSTEM-ARCHITECTURE.md) | Project structure |
| [05-DATABASE-SCHEMA.md](./05-DATABASE-SCHEMA.md) | Database authority |
| [08-SECURITY.md](./08-SECURITY.md) | Security requirements |
| [15-AI-ARCHITECTURE.md](./15-AI-ARCHITECTURE.md) | AI safety rules |
| [36-DEFINITION-OF-DONE.md](./36-DEFINITION-OF-DONE.md) | Completion criteria |
| [37-OPEN-QUESTIONS.md](./37-OPEN-QUESTIONS.md) | Unresolved decisions |
| [38-DECISION-LOG.md](./38-DECISION-LOG.md) | Architectural decisions |
