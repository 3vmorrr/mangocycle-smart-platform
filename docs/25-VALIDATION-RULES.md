# MangoCycle Smart Platform — Validation Rules

> **Document Name:** Validation Rules  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 05-DATABASE-SCHEMA.md, 24-API-SPECIFICATION.md, 08-SECURITY.md

---

## 1. Purpose

This document is the **authoritative source** for all input validation rules, specifying Zod schemas and business validation logic. Validation is enforced **server-side** (security) and optionally **client-side** (UX).

---

## 2. Waste Batch Validation

| Field | Type | Required | Constraints |
|---|---|---|---|
| `waste_type` | enum | Yes | `'mango_peel' \| 'mango_seed' \| 'mixed_mango_waste'` |
| `source_id` | UUID | No | Must reference existing `waste_sources` record |
| `weight_kg` | number | Yes | `> 0`, `≤ 10,000` |
| `collection_date` | date | Yes | Valid ISO date, not in future |
| `location` | string | No | Max 500 characters |
| `visual_condition` | enum | No | `'good' \| 'moderate' \| 'poor'` |
| `moisture_status` | enum | No | `'dry' \| 'moderate' \| 'high'` |
| `storage_duration_days` | integer | No | `≥ 0` |
| `notes` | string | No | Max 2,000 characters |

---

## 3. Product Batch Validation

| Field | Type | Required | Constraints |
|---|---|---|---|
| `product_name` | string | Yes | 1–200 characters |
| `product_type` | string | No | Max 200 characters |
| `production_date` | date | No | Valid ISO date |
| `quantity_produced` | number | No | `> 0` if provided |
| `unit` | string | No | Max 50 characters |
| `notes` | string | No | Max 2,000 characters |
| `waste_batch_ids` | UUID[] | Yes (on create) | Min 1; each must reference existing waste batch |

---

## 4. Laboratory Test Validation

| Field | Type | Required | Constraints |
|---|---|---|---|
| `test_type` | string | Yes | 1–100 characters |
| `waste_batch_id` | UUID | No | Must reference existing waste batch |
| `product_batch_id` | UUID | No | Must reference existing product batch |
| `test_date` | date | No | Valid ISO date |
| `status` | enum | Yes | `'pending' \| 'in_progress' \| 'completed' \| 'failed' \| 'cancelled'` |
| `result_summary` | string | No | Max 5,000 characters |
| `numeric_result` | number | No | Any valid number |
| `result_unit` | string | No | Max 50 characters |
| `researcher_notes` | string | No | Max 5,000 characters |

**Business Rule:** At least one of `waste_batch_id` or `product_batch_id` should be provided.

---

## 5. File Upload Validation

| Context | Max Size | Allowed MIME Types |
|---|---|---|
| Lab Attachments | 10 MB | `application/pdf`, `image/jpeg`, `image/png`, `image/tiff`, `text/csv`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| AI Waste Images | 5 MB | `image/jpeg`, `image/png`, `image/webp` |

**Additional Rules:**
- Validate MIME type from file magic bytes (not just extension)
- Sanitize file names (remove special characters, enforce max length 200)
- Generate UUID-based storage paths

---

## 6. IoT Payload Validation

| Field | Type | Required | Constraints |
|---|---|---|---|
| `device_id` | string | Yes | 1–50 characters |
| `weight_kg` | number | Yes | `≥ 0`, `≤ 1,000` |
| `timestamp` | datetime | Yes | Valid ISO datetime, within ±5 min of server time |

---

## 7. Common Validation Patterns

| Pattern | Zod |
|---|---|
| UUID | `z.string().uuid()` |
| Email | `z.string().email()` |
| Positive number | `z.number().positive()` |
| Non-empty string | `z.string().min(1)` |
| Date (ISO) | `z.string().date()` |
| Datetime (ISO) | `z.string().datetime()` |
| Batch code format | `z.string().regex(/^MW-\d{4}-\d{3}$/)` or `z.string().regex(/^BF-\d{4}-\d{3}$/)` |

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [05-DATABASE-SCHEMA.md](./05-DATABASE-SCHEMA.md) | Database constraints that validation mirrors |
| [08-SECURITY.md](./08-SECURITY.md) | Security requirements for validation |
| [24-API-SPECIFICATION.md](./24-API-SPECIFICATION.md) | API contracts using these schemas |
