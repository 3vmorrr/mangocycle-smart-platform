# MangoCycle Smart Platform — Testing Strategy

> **Document Name:** Testing Strategy  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 36-DEFINITION-OF-DONE.md, 24-API-SPECIFICATION.md

---

## 1. Purpose

This document defines the testing strategy across all test types: unit, integration, end-to-end, security, and AI-specific tests.

---

## 2. Testing Framework

| Type | Tool | Priority |
|---|---|---|
| Unit Tests | Vitest or Jest | P0 |
| Integration Tests | Vitest + Supabase test client | P1 |
| E2E Tests | Playwright | P1 |
| Linting | ESLint | P0 |
| Type Checking | TypeScript (`tsc --noEmit`) | P0 |

---

## 3. Unit Tests

Test pure functions and business logic in isolation.

| Target | Examples |
|---|---|
| Batch code generation | `generateWasteBatchCode()` → `MW-2026-001` |
| Validation schemas | Zod schemas accept valid / reject invalid input |
| Risk score calculation | Weighted score formula correctness |
| Anomaly detection | IQR/Z-score calculations |
| Rule engine | Processing advisor rules trigger correctly |
| Utility functions | Date formatting, number formatting |
| Role hierarchy | `hasMinimumRole('operator', 'viewer')` → `true` |

---

## 4. Integration Tests

Test database operations and API logic together.

| Target | Examples |
|---|---|
| Waste Batch CRUD | Create, read, update via Server Actions |
| Processing stage update | Stage history insertion + status update |
| Product-waste linking | Link, verify constraint enforcement |
| Authorization | Verify role restrictions on actions |
| IoT endpoint | Valid/invalid payload handling |
| Audit log creation | Verify audit entries after mutations |
| AI adapter (mocked) | Mock LLM response, verify validation pipeline |

---

## 5. End-to-End Tests

Full user flows through the browser.

| Test | Steps |
|---|---|
| Login flow | Navigate to login, enter credentials, verify dashboard |
| Create Waste Batch | Fill form, submit, verify in list |
| Update stage | Navigate to batch, advance stage, verify timeline |
| QR + Public page | Generate QR URL, navigate to public page, verify data |
| Create Product | Create product, link waste batches, verify |
| Lab test creation | Create test, upload file, verify in list |

---

## 6. Security Tests

| Test | Description |
|---|---|
| Unauthorized access | Verify protected routes redirect to login |
| Role escalation | Verify `viewer` cannot create batches |
| Invalid uploads | Reject oversized files, wrong MIME types |
| Public data leakage | Verify public pages don't expose private fields |
| API key validation | Verify IoT endpoint rejects invalid/missing keys |
| XSS prevention | Verify rendered content is escaped |

---

## 7. AI-Specific Tests

| Test | Description |
|---|---|
| Malformed output | Zod validation catches missing/extra fields |
| Hallucinated fields | Reject AI output with unexpected keys |
| Provider timeout | Graceful error message within 30s |
| Provider failure | Error handling for 5xx responses |
| Rate limiting | Verify per-user rate limits are enforced |
| Tool safety | Ask MangoCycle tools execute only approved functions |

---

## 8. Test Commands

```bash
# Type checking
npm run type-check     # tsc --noEmit

# Linting
npm run lint

# Unit + integration tests
npm test

# E2E tests
npm run test:e2e

# All checks
npm run check          # type-check + lint + test
```

---

## 9. CI/CD Integration

Run on every pull request:
1. Type check
2. Lint
3. Unit tests
4. Integration tests (with test database)

Run before production deploy:
1. All above + E2E tests

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [36-DEFINITION-OF-DONE.md](./36-DEFINITION-OF-DONE.md) | Tests are part of completion criteria |
| [24-API-SPECIFICATION.md](./24-API-SPECIFICATION.md) | API contracts to test against |
| [25-VALIDATION-RULES.md](./25-VALIDATION-RULES.md) | Validation schemas to test |
| [08-SECURITY.md](./08-SECURITY.md) | Security requirements to verify |
| [15-AI-ARCHITECTURE.md](./15-AI-ARCHITECTURE.md) | AI validation pipeline to test |
