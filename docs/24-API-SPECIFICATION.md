# MangoCycle Smart Platform — API Specification

> **Document Name:** API Specification  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 05-DATABASE-SCHEMA.md, 07-AUTH-AND-RBAC.md, 08-SECURITY.md, 25-VALIDATION-RULES.md

---

## 1. Purpose

This document is the **authoritative source** for all API contracts — Server Actions and Route Handlers. It defines routes, methods, authentication, roles, inputs, outputs, and side effects.

---

## 2. API Architecture

| Type | Usage | Pattern |
|---|---|---|
| **Server Actions** | Internal mutations from the Next.js frontend | TypeScript functions with `'use server'` |
| **Route Handlers** | External HTTP endpoints (IoT, webhooks) | `app/api/*/route.ts` |

Server Actions are the primary API pattern for the MangoCycle frontend. Route Handlers are used only for external clients (IoT, potential future integrations).

---

## 3. Server Action Conventions

Every Server Action follows this pattern:

```typescript
async function actionName(input: InputType): Promise<ActionResult<OutputType>> {
  'use server';
  // 1. Authenticate user
  // 2. Authorize role
  // 3. Validate input with Zod
  // 4. Execute business logic
  // 5. Create audit log entry
  // 6. Return result
}

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };
```

---

## 4. Waste Batch APIs

### 4.1 Create Waste Batch

| Attribute | Value |
|---|---|
| Type | Server Action |
| Auth | Required |
| Min Role | `operator` |
| Audit | `batch.created` |

**Input (Zod):**
```typescript
z.object({
  waste_type: z.enum(['mango_peel', 'mango_seed', 'mixed_mango_waste']),
  source_id: z.string().uuid().optional(),
  weight_kg: z.number().positive().max(10000),
  collection_date: z.string().date(),
  location: z.string().max(500).optional(),
  visual_condition: z.enum(['good', 'moderate', 'poor']).optional(),
  moisture_status: z.enum(['dry', 'moderate', 'high']).optional(),
  storage_duration_days: z.number().int().min(0).optional(),
  notes: z.string().max(2000).optional(),
})
```

**Success Response:** `{ success: true, data: { id, batch_code } }`

**Side Effects:** Generate batch code, insert batch, insert initial stage history (`collected`), create audit log.

### 4.2 Update Waste Batch

| Attribute | Value |
|---|---|
| Type | Server Action |
| Auth | Required |
| Min Role | `operator` |
| Audit | `batch.updated` (with before/after) |

**Input:** Partial update of waste batch fields (same validation, all optional).

### 4.3 Update Processing Stage

| Attribute | Value |
|---|---|
| Type | Server Action |
| Auth | Required |
| Min Role | `operator` |
| Audit | `batch.stage_changed` |

**Input:**
```typescript
z.object({
  batch_id: z.string().uuid(),
  stage_name: z.string(),
  notes: z.string().max(2000).optional(),
})
```

**Side Effects:** Insert `batch_stage_history` record, update `waste_batches.current_status`, create audit log.

### 4.4 List Waste Batches

| Attribute | Value |
|---|---|
| Type | Server Action or Server Component query |
| Auth | Required |
| Min Role | `viewer` |

**Input:** Optional filters (status, waste_type, source_id, date range), pagination.

### 4.5 Get Waste Batch Details

| Attribute | Value |
|---|---|
| Type | Server Component query |
| Auth | Required for full view; public route for public view |
| Min Role | `viewer` (internal) or None (public) |

---

## 5. Product Batch APIs

### 5.1 Create Product Batch

| Attribute | Value |
|---|---|
| Type | Server Action |
| Auth | Required |
| Min Role | `researcher` |
| Audit | `product.created` |

**Input:**
```typescript
z.object({
  product_name: z.string().min(1).max(200),
  product_type: z.string().max(200).optional(),
  production_date: z.string().date().optional(),
  quantity_produced: z.number().positive().optional(),
  unit: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
  waste_batch_ids: z.array(z.string().uuid()).min(1),
})
```

**Side Effects:** Generate batch code, insert product, insert product_waste_links, create audit log.

### 5.2 Link/Unlink Waste Batches

| Attribute | Value |
|---|---|
| Type | Server Action |
| Auth | Required |
| Min Role | `researcher` |
| Audit | `product.waste_linked` / `product.waste_unlinked` |

---

## 6. Laboratory APIs

### 6.1 Create Laboratory Test

| Attribute | Value |
|---|---|
| Type | Server Action |
| Auth | Required |
| Min Role | `researcher` |
| Audit | `lab.test_created` |

**Input:**
```typescript
z.object({
  test_type: z.string().min(1).max(100),
  waste_batch_id: z.string().uuid().optional(),
  product_batch_id: z.string().uuid().optional(),
  test_date: z.string().date().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']).default('pending'),
  result_summary: z.string().max(5000).optional(),
  numeric_result: z.number().optional(),
  result_unit: z.string().max(50).optional(),
  researcher_notes: z.string().max(5000).optional(),
})
```

### 6.2 Upload Lab Attachment

| Attribute | Value |
|---|---|
| Type | Server Action |
| Auth | Required |
| Min Role | `researcher` |
| Audit | `lab.attachment_added` |

**Validation:** File size ≤ 10 MB, MIME type in allowed list, test_id exists.

---

## 7. Public Traceability APIs

### 7.1 Get Public Waste Batch

| Attribute | Value |
|---|---|
| Type | Server Component query (public route) |
| Auth | None |
| Rate Limit | 60 req/min/IP |

**Input:** `batchCode` (path parameter)

**Response:** Public-safe fields only (per [08-SECURITY.md](./08-SECURITY.md) §11).

### 7.2 Get Public Product Batch

Same pattern as waste batch. Public-safe fields only.

---

## 8. AI APIs

### 8.1 AI Waste Visual Analysis

| Attribute | Value |
|---|---|
| Type | Server Action |
| Auth | Required |
| Min Role | `operator` |
| Rate Limit | 5 req/min/user |
| Audit | `ai.analysis_requested` |

**Input:** Image file + optional waste_batch_id

### 8.2 AI Processing Advice

| Attribute | Value |
|---|---|
| Type | Server Action |
| Auth | Required |
| Min Role | `operator` |
| Rate Limit | 10 req/min/user |

**Input:** `batch_id: z.string().uuid()`

### 8.3 Ask MangoCycle

| Attribute | Value |
|---|---|
| Type | Server Action |
| Auth | Required |
| Min Role | `viewer` |
| Rate Limit | 10 req/min/user |

**Input:** `question: z.string().min(1).max(500)`

### 8.4 Sustainability Insights

| Attribute | Value |
|---|---|
| Type | Server Action |
| Auth | Required |
| Min Role | `viewer` |
| Rate Limit | 5 req/min/user |

**Input:** `period: z.string().optional()`

---

## 9. IoT API

### 9.1 POST /api/iot/weight

| Attribute | Value |
|---|---|
| Type | Route Handler |
| Method | POST |
| Auth | API Key (`Authorization: Bearer {key}`) |
| Rate Limit | 60 req/min/device |

**Input:**
```typescript
z.object({
  device_id: z.string().min(1).max(50),
  weight_kg: z.number().min(0).max(1000),
  timestamp: z.string().datetime(),
})
```

**Validation Flow:**
1. Extract API key from Authorization header
2. Hash key, look up device by `device_id`
3. Compare hash with stored `api_key_hash`
4. Verify device is active
5. Validate payload with Zod
6. Validate timestamp within ±5 min of server time
7. Insert into `iot_weight_readings`
8. Update `iot_devices.last_seen_at`

**Success Response:** `{ success: true }` (200)

**Error Responses:**
| Status | Condition |
|---|---|
| 400 | Invalid payload |
| 401 | Invalid or missing API key |
| 403 | Device is inactive |
| 404 | Device not found |
| 429 | Rate limit exceeded |
| 500 | Internal error |

---

## 10. Dashboard Metrics API

| Attribute | Value |
|---|---|
| Type | Server Component query or Server Action |
| Auth | Required |
| Min Role | `viewer` |

Returns all calculated KPI values. See [01-PRODUCT-REQUIREMENTS.md](./01-PRODUCT-REQUIREMENTS.md) §2.6.

---

## 11. Ask MangoCycle Tool Functions

These are internal server functions called by the LLM tool-calling mechanism. They are **not** HTTP endpoints — they are TypeScript functions invoked server-side.

Defined in [18-ASK-MANGOCYCLE.md](./18-ASK-MANGOCYCLE.md) §4.

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [05-DATABASE-SCHEMA.md](./05-DATABASE-SCHEMA.md) | Database tables for all operations |
| [07-AUTH-AND-RBAC.md](./07-AUTH-AND-RBAC.md) | Role requirements per API |
| [08-SECURITY.md](./08-SECURITY.md) | Rate limiting, input validation, public data boundary |
| [25-VALIDATION-RULES.md](./25-VALIDATION-RULES.md) | Detailed Zod validation schemas |
| [27-AUDIT-LOGGING.md](./27-AUDIT-LOGGING.md) | Audit events per API |
| [18-ASK-MANGOCYCLE.md](./18-ASK-MANGOCYCLE.md) | Tool function definitions |
| [22-IOT-ARCHITECTURE.md](./22-IOT-ARCHITECTURE.md) | IoT endpoint architecture |
