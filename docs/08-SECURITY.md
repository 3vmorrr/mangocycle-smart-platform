# MangoCycle Smart Platform — Security

> **Document Name:** Security Requirements  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 05-DATABASE-SCHEMA.md, 07-AUTH-AND-RBAC.md, 25-VALIDATION-RULES.md, 29-ENVIRONMENT-CONFIG.md

---

## 1. Purpose

This document is the **authoritative source** for all security requirements, policies, and practices for the MangoCycle Smart Platform. It covers defense in depth across all layers: edge, middleware, application, database, storage, and external services.

---

## 2. Security Principles

1. **Defense in Depth** — Security enforced at every layer, not just one
2. **Least Privilege** — Users and services get minimum required access
3. **Server-Side Authority** — All authorization and secrets handled server-side
4. **Input Distrust** — Every external input validated before processing
5. **Output Safety** — All rendered data sanitized against XSS
6. **Audit Everything** — Security-relevant actions logged
7. **Fail Securely** — Errors do not leak internal information

---

## 3. Authentication Security

### 3.1 Credential Handling

| Requirement | Implementation |
|---|---|
| Password hashing | Managed by Supabase Auth (bcrypt) |
| Minimum password length | 8 characters (Supabase default, configurable) |
| Password reset | Email link via Supabase Auth, time-limited |
| Session tokens | JWT, stored in HTTP-only cookies |
| Token refresh | Automatic via Supabase client libraries |
| No public registration | User creation only by Admin/Super Admin |

### 3.2 Session Security

| Requirement | Implementation |
|---|---|
| HTTP-only cookies | Prevents JavaScript access to session tokens |
| Secure flag | Cookies sent only over HTTPS |
| SameSite attribute | `Lax` or `Strict` to prevent CSRF |
| Token expiry | 1 hour access token, refresh token rotation |
| Session invalidation | On password change, on user deactivation |

---

## 4. Authorization Security

Authorization is defined authoritatively in [07-AUTH-AND-RBAC.md](./07-AUTH-AND-RBAC.md). This section covers the security aspects.

### 4.1 Enforcement Layers

```
Layer 1: Next.js Middleware    → Route-level protection
Layer 2: Server Actions/APIs   → Action-level role checks
Layer 3: Database RLS          → Row-level data access control
```

All three layers must be consistent. A breach in one layer should be caught by another.

### 4.2 Authorization Rules

| Rule | Detail |
|---|---|
| Every protected route checks authentication | Middleware verifies JWT |
| Every mutation checks role | Server Action verifies role from DB |
| RLS enforces at DB level | Even if application check is bypassed |
| Service role key bypasses RLS | Used only in server-side code for system operations |
| Role checked from DB, not JWT | Ensures role changes take immediate effect |

---

## 5. Input Validation

### 5.1 General Rules

| Rule | Detail |
|---|---|
| All input validated server-side | Client validation is UX, not security |
| Use Zod schemas | Type-safe, composable validation |
| Validate type, format, range, length | Not just presence |
| Reject unknown fields | Strip or reject extra properties |
| Parameterized queries only | Never interpolate user input into SQL |

### 5.2 Specific Validations

Detailed validation rules per field are defined in [25-VALIDATION-RULES.md](./25-VALIDATION-RULES.md). Key security-relevant validations:

| Input | Validation |
|---|---|
| Batch code | Must match format `MW-YYYY-NNN` or `BF-YYYY-NNN` |
| Weight | Numeric, positive, reasonable range (0.001–10,000 kg) |
| Email | Valid email format |
| Text fields | Max length enforced, no script injection |
| UUIDs | Valid UUID v4 format |
| Dates | Valid ISO date, reasonable range |
| File uploads | See Section 7 |
| IoT payloads | See Section 9 |
| AI responses | See Section 10 |

---

## 6. Output Security

### 6.1 XSS Prevention

| Measure | Detail |
|---|---|
| React auto-escaping | React escapes rendered strings by default |
| No `dangerouslySetInnerHTML` | Unless absolutely necessary with sanitized HTML |
| Content Security Policy | Restrict inline scripts, external sources |
| AI output sanitization | AI-generated text sanitized before rendering |

### 6.2 Secure Error Handling

| Rule | Detail |
|---|---|
| No stack traces to client | Production errors show generic messages |
| No internal paths in errors | Never expose file system paths |
| No SQL errors to client | Database errors wrapped in generic messages |
| Log detailed errors server-side | For debugging via server logs |
| Consistent error format | Standard error response shape for APIs |

---

## 7. File Upload Security

### 7.1 Laboratory Attachments

| Requirement | Value |
|---|---|
| Max file size | 10 MB |
| Allowed MIME types | `application/pdf`, `image/jpeg`, `image/png`, `image/tiff`, `text/csv`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| File name sanitization | Strip special characters, enforce max length |
| Storage | Supabase Storage, private bucket (`laboratory-attachments`) |
| Access control | Authenticated users with `researcher`+ role |
| Virus scanning | Not in MVP scope; consider for production |

### 7.2 AI Image Uploads

| Requirement | Value |
|---|---|
| Max file size | 5 MB |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp` |
| Storage | Supabase Storage, private bucket (`ai-uploads`) |
| Access control | Authenticated users with `operator`+ role |
| Retention | Stored for audit; retention policy TBD |

### 7.3 Validation Process

```
1. Check file size before upload
2. Validate MIME type (both Content-Type header and file magic bytes)
3. Sanitize file name
4. Generate unique storage path (UUID-based)
5. Upload to Supabase Storage
6. Store metadata in database
```

> [!WARNING]
> Never rely solely on file extension for type validation. Check MIME type from file headers (magic bytes) on the server side.

---

## 8. API Security

### 8.1 Server-Side Secret Protection

| Secret | Storage | Exposure |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only env var | **Never** exposed to client |
| `AI_API_KEY` | Server-only env var | **Never** exposed to client |
| `IOT_DEVICE_SECRET` | Server-only env var | **Never** exposed to client |
| `NEXT_PUBLIC_SUPABASE_URL` | Public env var | Safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public env var | Safe to expose (RLS protects data) |

> [!CAUTION]
> Any environment variable prefixed with `NEXT_PUBLIC_` is embedded in the client bundle. **Never** put secrets in `NEXT_PUBLIC_` variables.

### 8.2 Rate Limiting

| Endpoint | Rate Limit | Rationale |
|---|---|---|
| AI endpoints | 10 requests/minute/user | Prevent API cost abuse |
| IoT weight endpoint | 60 requests/minute/device | Reasonable sensor frequency |
| Public traceability pages | 60 requests/minute/IP | Prevent scraping |
| Login endpoint | 5 attempts/minute/IP | Prevent brute force |
| Password reset | 3 requests/hour/email | Prevent email spam |

Implementation: Use Vercel's rate limiting or a simple in-memory/Redis rate limiter for MVP.

### 8.3 CORS

| Rule | Detail |
|---|---|
| API routes | Restrict to application domain |
| IoT endpoint | Allow from any origin (authenticated via API key) |
| Public pages | Standard same-origin |

### 8.4 CSRF Protection

| Measure | Detail |
|---|---|
| SameSite cookies | `Lax` prevents CSRF for state-changing requests |
| Server Actions | Next.js Server Actions include built-in CSRF protection |
| API routes | Verify origin header for mutation endpoints |

---

## 9. IoT Security

| Requirement | Implementation |
|---|---|
| Device authentication | API key in `Authorization` header |
| Key storage | SHA-256 hash stored in `iot_devices.api_key_hash` |
| Key display | Raw key shown once at creation, never again |
| Payload validation | Zod schema: device_id, weight_kg, timestamp |
| Weight range validation | 0–1000 kg (configurable reasonable range) |
| Timestamp validation | Within ±5 minutes of server time |
| Device existence check | Verify `device_id` exists and `is_active` |
| HTTPS only | ESP32 must use HTTPS, not HTTP |
| Rate limiting | 60 requests/minute/device |

### 9.1 IoT Authentication Flow

```
ESP32 → HTTPS POST /api/iot/weight
  Headers: Authorization: Bearer {api_key}
  Body: { device_id, weight_kg, timestamp }
    ↓
Server:
  1. Extract API key from header
  2. Hash the key
  3. Look up device by device_id
  4. Compare hash with stored api_key_hash
  5. Verify device is_active
  6. Validate payload with Zod
  7. Insert weight reading
  8. Update device last_seen_at
  9. Return 200 OK
```

---

## 10. AI Security

| Requirement | Detail |
|---|---|
| API keys server-only | AI provider keys never in client code |
| Output validation | Validate AI JSON against Zod schema before use |
| No raw SQL from AI | Ask MangoCycle uses approved tool functions only |
| No trusted AI output | AI output never directly inserted into DB without validation |
| Prompt injection defense | System prompts clearly separate from user input |
| Hallucination handling | AI outputs flagged with confidence level; recommend manual review |
| Cost protection | Rate limiting prevents excessive API calls |
| Timeout handling | 30-second timeout on AI calls; graceful failure |
| Audit logging | All AI interactions recorded in `ai_analysis_records` |

### 10.1 Ask MangoCycle Safety

```
User Question
    ↓
LLM receives: system prompt + tool definitions + user question
    ↓
LLM selects approved tool (e.g., get_total_waste)
    ↓
Server executes ONLY the approved function with validated parameters
    ↓
Result returned to LLM for natural language formatting
    ↓
Response displayed to user
```

> [!IMPORTANT]
> The LLM must **never**:
> - Generate or execute arbitrary SQL
> - Access tables/columns outside approved tool definitions
> - Modify data (all tools are read-only)
> - Return raw database identifiers (UUIDs) to the user

---

## 11. Public vs Private Data Boundary

### 11.1 Public Traceability Pages

These pages are accessible without authentication. They must expose ONLY:

#### Waste Traceability Page (Public)

| Field | Public? |
|---|---|
| Batch code (`MW-YYYY-NNN`) | ✅ Public |
| Waste type | ✅ Public |
| Source name | ✅ Public |
| Weight | ✅ Public |
| Collection date | ✅ Public |
| Current status | ✅ Public |
| Processing timeline (stage names + dates) | ✅ Public |
| Linked Product Batch code | ✅ Public |
| Sustainability info | ✅ Public |
| Internal UUID | ❌ Private |
| Researcher notes | ❌ Private |
| Created-by user info | ❌ Private |
| AI analysis details | ❌ Private |
| Internal audit history | ❌ Private |
| Moisture status | ❌ Private |
| Visual condition details | ❌ Private |

#### Product Traceability Page (Public)

| Field | Public? |
|---|---|
| Product batch code (`BF-YYYY-NNN`) | ✅ Public |
| Product name | ✅ Public |
| Production date | ✅ Public |
| Linked Waste Batch codes | ✅ Public |
| Total waste used (sum of weights) | ✅ Public |
| Processing journey summary | ✅ Public |
| Lab testing status (pass/fail/pending) | ✅ Public |
| Sustainability info | ✅ Public |
| Internal UUID | ❌ Private |
| Researcher notes | ❌ Private |
| Lab test details | ❌ Private |
| Lab attachments | ❌ Private |
| Created-by user info | ❌ Private |
| AI analysis details | ❌ Private |

### 11.2 Data Query for Public Pages

Public traceability pages must use a dedicated database query that explicitly `SELECT`s only public-safe columns. Never use `SELECT *` for public pages.

```sql
-- Conceptual: Waste batch public query
SELECT
  batch_code,
  waste_type,
  ws.name AS source_name,
  weight_kg,
  collection_date,
  current_status
FROM waste_batches wb
LEFT JOIN waste_sources ws ON wb.source_id = ws.id
WHERE wb.batch_code = $1;
```

---

## 12. SQL Injection Prevention

| Measure | Detail |
|---|---|
| Supabase client | Uses parameterized queries by default |
| No raw SQL | Application code does not construct SQL strings |
| Stored functions | Used for code generation; parameters are typed |
| Ask MangoCycle | Approved tools use parameterized queries only |
| IoT endpoint | Parameters validated by Zod before any DB interaction |

---

## 13. Environment Variable Security

Detailed in [29-ENVIRONMENT-CONFIG.md](./29-ENVIRONMENT-CONFIG.md). Key rules:

| Rule | Detail |
|---|---|
| `.env.local` in `.gitignore` | Never commit secrets to version control |
| Vercel env vars | Set via Vercel dashboard for production |
| No secrets in `NEXT_PUBLIC_*` | These are bundled into client code |
| Different keys per environment | Dev, staging, production use different keys |
| Rotate keys periodically | Especially AI and IoT keys |

---

## 14. Audit & Monitoring

| Requirement | Detail |
|---|---|
| Audit logging | All security-relevant events logged (see [27-AUDIT-LOGGING.md](./27-AUDIT-LOGGING.md)) |
| Failed auth attempts | Logged server-side (Supabase Auth logs) |
| Role changes | Audit logged with before/after values |
| Unusual IoT activity | Flagged if device sends abnormal data |
| AI usage | All AI calls logged in `ai_analysis_records` |

---

## 15. Deployment Security

| Requirement | Detail |
|---|---|
| HTTPS everywhere | Vercel provides automatic HTTPS |
| No HTTP fallback | Force HTTPS redirect |
| Preview deployments | Should use separate Supabase project or at minimum different API keys |
| Production access | Limited to authorized personnel |
| Database backups | Supabase managed backups |

---

## 16. Security Checklist for Every Feature

Before any feature is considered complete, verify:

- [ ] Authentication required on protected routes
- [ ] Role check enforced in Server Actions / API handlers
- [ ] RLS policy covers the new table/operation
- [ ] All user input validated with Zod
- [ ] No secrets exposed to client
- [ ] Error messages do not leak internals
- [ ] File uploads validated (if applicable)
- [ ] AI output validated (if applicable)
- [ ] Audit log entry created for significant actions
- [ ] Public pages do not expose private data
- [ ] No `console.log` of sensitive data in production

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [GOVERNANCE.md](./GOVERNANCE.md) | Canonical terminology |
| [05-DATABASE-SCHEMA.md](./05-DATABASE-SCHEMA.md) | RLS policies, constraint definitions |
| [07-AUTH-AND-RBAC.md](./07-AUTH-AND-RBAC.md) | Role definitions and permission matrix |
| [24-API-SPECIFICATION.md](./24-API-SPECIFICATION.md) | API-level security requirements |
| [25-VALIDATION-RULES.md](./25-VALIDATION-RULES.md) | Input validation details |
| [27-AUDIT-LOGGING.md](./27-AUDIT-LOGGING.md) | Audit event specifications |
| [29-ENVIRONMENT-CONFIG.md](./29-ENVIRONMENT-CONFIG.md) | Secret management |
| [30-DEPLOYMENT.md](./30-DEPLOYMENT.md) | Deployment security |
