# MangoCycle Smart Platform — Product Traceability

> **Document Name:** Product Traceability  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 05-DATABASE-SCHEMA.md, 09-ROUTES-AND-PAGES.md, 11-WASTE-TRACEABILITY.md, 13-QR-SYSTEM.md

---

## 1. Purpose

This document describes the Product Batch lifecycle, the waste-to-product linking mechanism, and the public Product Traceability Page. It references authoritative definitions in [05-DATABASE-SCHEMA.md](./05-DATABASE-SCHEMA.md) for database structure and [09-ROUTES-AND-PAGES.md](./09-ROUTES-AND-PAGES.md) for routes.

---

## 2. Product Batch Concept

A **Product Batch** represents a unit of final biological product produced from one or more Waste Batches. The relationship is many-to-many:

- Multiple Waste Batches can contribute to one Product Batch
- A single Waste Batch can contribute to multiple Product Batches (e.g., if waste is split across production runs)

### 2.1 Waste-to-Product Linking

```
MW-2026-001 ──┐
               ├──→ BF-2026-001
MW-2026-004 ──┘
```

This linkage establishes the end-to-end traceability chain:

```
Waste Source → Waste Batch → Processing → Product Batch → Lab Testing
```

### 2.2 Product Naming

Product naming is **configurable** — not hard-coded. The `product_name` and `product_type` fields in `product_batches` (see [05-DATABASE-SCHEMA.md](./05-DATABASE-SCHEMA.md) §3.6) are free-text.

Known product candidates:
- Biofungicide
- NanoBiovera
- Biovera Nano
- Future products

---

## 3. Product Batch Lifecycle

### 3.1 Creation

A Product Batch is created when waste processing yields a final product. At creation:
- A unique public code (`BF-YYYY-NNN`) is generated
- Initial status is `in_production`
- Waste Batches are linked via `product_waste_links`
- An audit log entry is recorded

### 3.2 Status Flow

```
in_production → testing → completed → released
                            ↘
                          rejected
```

| Status | Meaning |
|---|---|
| `in_production` | Product is being manufactured |
| `testing` | Product is undergoing laboratory testing |
| `completed` | Production and testing finished |
| `released` | Product approved and released |
| `rejected` | Product failed quality checks |

### 3.3 Laboratory Testing Status

Tracked via `lab_testing_status` on the Product Batch:

| Status | Meaning |
|---|---|
| `pending` | No tests started |
| `in_progress` | Tests underway |
| `passed` | All tests passed |
| `failed` | One or more tests failed |
| `not_applicable` | Testing not required |

---

## 4. Internal Product Batch Details Page

On the **Product Batch Details** page (authenticated):

| Section | Content |
|---|---|
| Header | Product batch code, status badge, product name, QR code button |
| Core Info | Product name, product type, production date, quantity, unit |
| Linked Waste Batches | List of contributing Waste Batches with codes, weights, and links |
| Total Waste Used | Sum of `weight_kg` from linked Waste Batches |
| Laboratory Tests | Associated lab tests with status indicators |
| Lab Testing Status | Overall testing status |
| Notes | Internal notes (private) |
| Metadata | Created by, created at, updated at |
| Actions | Edit, Link/Unlink Waste, Generate QR |

---

## 5. Public Product Traceability Page

### 5.1 Route

`/trace/product/[batchCode]` — e.g., `/trace/product/BF-2026-001`

### 5.2 Access

- No authentication required
- Linked from QR code scan
- Mobile-optimized, read-only

### 5.3 Displayed Information

Only public-safe fields as defined in [08-SECURITY.md](./08-SECURITY.md) §11.1:

| Field | Source |
|---|---|
| Product Batch Code | `product_batches.batch_code` |
| Product Name | `product_batches.product_name` |
| Production Date | `product_batches.production_date` |
| Status | `product_batches.status` (display label) |
| Linked Waste Batches | `waste_batches.batch_code` via `product_waste_links` |
| Total Waste Used | `SUM(waste_batches.weight_kg)` for linked batches |
| Processing Journey | Combined stage histories of linked Waste Batches (summary) |
| Lab Testing Status | `product_batches.lab_testing_status` (display label) |
| Sustainability | Total waste diverted, number of sources involved |

### 5.4 Processing Journey Display

The public page shows a summary of the processing journey across all linked Waste Batches:

```
🥭 2 Waste Batches Used
   MW-2026-001 — Mango Peel — 2.5 kg — Completed ✅
   MW-2026-004 — Mango Seed — 1.8 kg — Completed ✅

📊 Total Waste: 4.3 kg diverted from disposal
🔬 Lab Testing: Passed ✅

Processing Journey:
   Collected → Sorted → Washed → Dried → Ground →
   Extraction → Production → Lab Testing → Completed
```

### 5.5 Not Displayed

- Internal UUIDs
- Researcher notes
- Created-by user info
- Lab test details/attachments
- AI analysis details
- Quantity produced / unit (may be commercially sensitive — open question)

### 5.6 Error States

Same pattern as Waste Traceability Page — see [11-WASTE-TRACEABILITY.md](./11-WASTE-TRACEABILITY.md) §4.5.

---

## 6. Linking Rules

| Rule | Detail |
|---|---|
| Waste batch must exist | Cannot link to a nonexistent Waste Batch |
| No duplicate links | `UNIQUE(product_batch_id, waste_batch_id)` constraint |
| Linked waste cannot be deleted | `ON DELETE RESTRICT` prevents deletion |
| Audit logging | Every link/unlink action is audit logged |
| Unlinking | Permitted for `researcher`+ roles; creates audit entry |

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [GOVERNANCE.md](./GOVERNANCE.md) | Canonical terminology |
| [05-DATABASE-SCHEMA.md](./05-DATABASE-SCHEMA.md) | `product_batches`, `product_waste_links` definitions |
| [06-DATABASE-RELATIONSHIPS.md](./06-DATABASE-RELATIONSHIPS.md) | Many-to-many relationship details |
| [07-AUTH-AND-RBAC.md](./07-AUTH-AND-RBAC.md) | Permissions for product operations |
| [08-SECURITY.md](./08-SECURITY.md) | Public data boundary |
| [09-ROUTES-AND-PAGES.md](./09-ROUTES-AND-PAGES.md) | Route definitions |
| [11-WASTE-TRACEABILITY.md](./11-WASTE-TRACEABILITY.md) | Waste Batch lifecycle this links to |
| [13-QR-SYSTEM.md](./13-QR-SYSTEM.md) | QR code for Product Batches |
| [14-LABORATORY-MODULE.md](./14-LABORATORY-MODULE.md) | Lab tests associated with products |
