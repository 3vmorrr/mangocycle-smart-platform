# MangoCycle Smart Platform — Audit Logging

> **Document Name:** Audit Logging  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 05-DATABASE-SCHEMA.md, 07-AUTH-AND-RBAC.md

---

## 1. Purpose

This document specifies the audit logging strategy. The `audit_logs` table definition is in [05-DATABASE-SCHEMA.md](./05-DATABASE-SCHEMA.md) §3.13.

---

## 2. Design Principles

- **Append-only** — Audit records are never updated or deleted
- **Comprehensive** — All significant platform changes are logged
- **Non-blocking** — Audit logging should not fail a primary operation (log errors separately)
- **Queryable** — Admins can search and filter audit history

---

## 3. Auditable Events

| Action Value | Entity Type | Trigger |
|---|---|---|
| `batch.created` | `waste_batch` | Waste Batch created |
| `batch.updated` | `waste_batch` | Waste Batch fields modified |
| `batch.stage_changed` | `waste_batch` | Processing stage advanced |
| `batch.deleted` | `waste_batch` | Waste Batch archived/deleted |
| `product.created` | `product_batch` | Product Batch created |
| `product.updated` | `product_batch` | Product Batch modified |
| `product.waste_linked` | `product_batch` | Waste Batch linked to product |
| `product.waste_unlinked` | `product_batch` | Waste Batch unlinked from product |
| `lab.test_created` | `laboratory_test` | Lab test record created |
| `lab.result_updated` | `laboratory_test` | Lab test result/status updated |
| `lab.attachment_added` | `laboratory_test` | File attached |
| `lab.attachment_removed` | `laboratory_test` | File removed |
| `ai.analysis_requested` | `ai_analysis` | AI feature invoked |
| `user.created` | `profile` | New user account created |
| `user.role_changed` | `profile` | Role changed (with before/after) |
| `user.deactivated` | `profile` | Account deactivated |
| `iot.device_created` | `iot_device` | Smart Bin registered |
| `iot.device_deactivated` | `iot_device` | Smart Bin deactivated |
| `iot.key_regenerated` | `iot_device` | API key rotated |
| `settings.updated` | `app_settings` | System setting changed |

---

## 4. Audit Record Fields

Per [05-DATABASE-SCHEMA.md](./05-DATABASE-SCHEMA.md):

| Field | Content |
|---|---|
| `actor_id` | UUID of the user who performed the action |
| `action` | Action identifier from the table above |
| `entity_type` | Type of entity affected |
| `entity_id` | UUID of the affected entity |
| `before_value` | JSONB snapshot of relevant fields before change |
| `after_value` | JSONB snapshot of relevant fields after change |
| `ip_address` | Client IP (if available from request context) |
| `created_at` | Timestamp of the event |

---

## 5. Implementation Pattern

```typescript
// Conceptual utility
async function createAuditLog(params: {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string;
  beforeValue?: Record<string, unknown>;
  afterValue?: Record<string, unknown>;
  ipAddress?: string;
}) {
  // Insert into audit_logs using service role client (bypasses RLS)
  // Use try/catch to prevent audit failures from blocking primary operation
}
```

---

## 6. Access Control

Per [07-AUTH-AND-RBAC.md](./07-AUTH-AND-RBAC.md): Only `admin` and `super_admin` can view audit logs.

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [05-DATABASE-SCHEMA.md](./05-DATABASE-SCHEMA.md) | `audit_logs` table definition |
| [07-AUTH-AND-RBAC.md](./07-AUTH-AND-RBAC.md) | Audit log access permissions |
| [24-API-SPECIFICATION.md](./24-API-SPECIFICATION.md) | Which APIs create audit entries |
