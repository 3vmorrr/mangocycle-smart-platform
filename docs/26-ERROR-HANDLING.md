# MangoCycle Smart Platform — Error Handling

> **Document Name:** Error Handling  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 08-SECURITY.md, 24-API-SPECIFICATION.md

---

## 1. Purpose

This document defines the error handling strategy across all platform layers.

---

## 2. Error Response Format

### 2.1 Server Actions

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
```

### 2.2 Route Handlers (API)

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

Common HTTP status codes: 400, 401, 403, 404, 422, 429, 500.

---

## 3. Error Categories

| Category | Client Message | Server Log | HTTP |
|---|---|---|---|
| Validation error | Field-specific messages | Input details | 400/422 |
| Authentication | "Please log in" | Session details | 401 |
| Authorization | "You don't have permission" | Role mismatch | 403 |
| Not found | "Resource not found" | Entity type + ID | 404 |
| Rate limited | "Too many requests, wait" | IP/user/device | 429 |
| AI unavailable | "AI temporarily unavailable" | Provider error | 503 |
| Internal error | "Something went wrong" | Full stack trace | 500 |

---

## 4. Security Rules

- **Never** expose stack traces, file paths, or SQL errors to the client
- **Never** reveal whether a resource exists via error message differences (prevent enumeration)
- **Always** log detailed errors server-side for debugging
- **Always** return generic messages for 500 errors

---

## 5. UI Error Display

| Context | Pattern |
|---|---|
| Form validation | Inline messages below fields |
| Action failure | Toast notification (error type) |
| Page-level error | Error boundary with retry button |
| 404 page | Custom "Not Found" page with navigation |
| AI error | Inline message within AI feature area |

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [08-SECURITY.md](./08-SECURITY.md) | Secure error handling rules |
| [24-API-SPECIFICATION.md](./24-API-SPECIFICATION.md) | Error responses per endpoint |
| [15-AI-ARCHITECTURE.md](./15-AI-ARCHITECTURE.md) | AI-specific error handling |
