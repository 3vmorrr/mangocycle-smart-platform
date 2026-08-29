# MangoCycle Smart Platform — Waste Traceability

> **Document Name:** Waste Traceability  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 05-DATABASE-SCHEMA.md, 09-ROUTES-AND-PAGES.md, 13-QR-SYSTEM.md

---

## 1. Purpose

This document describes the Waste Batch lifecycle, the internal traceability mechanisms, and the public Waste Traceability Page. It references authoritative definitions for database structure ([05-DATABASE-SCHEMA.md](./05-DATABASE-SCHEMA.md)), routes ([09-ROUTES-AND-PAGES.md](./09-ROUTES-AND-PAGES.md)), and QR code system ([13-QR-SYSTEM.md](./13-QR-SYSTEM.md)).

---

## 2. Waste Batch Lifecycle

### 2.1 Creation

A Waste Batch is created when mango waste is collected and entered into the system. This may happen via:

1. **Manual entry** — Operator fills the Create Waste Batch form
2. **IoT-assisted entry** — Weight pre-filled from Smart Bin reading, operator completes remaining fields

At creation:
- A unique public code (`MW-YYYY-NNN`) is generated (see code-generation strategy in [05-DATABASE-SCHEMA.md](./05-DATABASE-SCHEMA.md) §4)
- The batch enters the `collected` stage
- An initial `batch_stage_history` record is created
- An audit log entry is recorded
- A QR code becomes available for generation

### 2.2 Processing Flow

```
  Collected
      ↓
  Sorted
      ↓
  Washed
      ↓
  Dried
      ↓
  Ground
      ↓
  Extraction
      ↓
  Production
      ↓
  Laboratory Testing
      ↓
  Completed
```

Stage transitions:
- Are triggered by an authorized user (see permissions in [07-AUTH-AND-RBAC.md](./07-AUTH-AND-RBAC.md))
- May include optional notes
- Are recorded in the `batch_stage_history` table (append-only)
- Update the `current_status` field on the `waste_batches` record
- Create an audit log entry

### 2.3 Stage Transition Rules

| Rule | Detail |
|---|---|
| Forward only (normal) | Stages progress in order; skipping is allowed but should be documented |
| No silent overwrite | Completed stage records are never modified |
| Rejection | A batch can be moved to `rejected` from any stage |
| Resumption | A rejected batch cannot be resumed (create a new batch if needed) |
| Parallel processing | Not supported in MVP — each batch is in one stage at a time |

> [!NOTE]
> The scientific team may adjust stage definitions. The `processing_stages` table is configurable. See [37-OPEN-QUESTIONS.md](./37-OPEN-QUESTIONS.md).

### 2.4 Terminal States

| State | Meaning |
|---|---|
| `completed` | Batch has finished all processing |
| `rejected` | Batch was removed from the processing pipeline |

---

## 3. Internal Traceability Data

On the **Waste Batch Details** page (authenticated), the full internal view includes:

| Section | Content |
|---|---|
| Header | Batch code, status badge, QR code button |
| Core Info | Waste type, source, weight, collection date, location |
| Condition | Visual condition, moisture status, storage duration |
| Notes | Internal notes (private) |
| Processing Timeline | Full visual timeline with dates, actors, and notes |
| Linked Products | List of Product Batches this waste contributes to (with links) |
| Laboratory Tests | List of associated lab test records (with links) |
| AI Analyses | History of AI assessments run on this batch |
| Metadata | Created by, created at, updated at |
| Actions | Edit, Update Stage, Generate QR, Delete/Archive |

---

## 4. Public Waste Traceability Page

### 4.1 Route

`/trace/waste/[batchCode]` — e.g., `/trace/waste/MW-2026-001`

### 4.2 Access

- **No authentication required**
- Linked from QR code scan
- Mobile-optimized
- Read-only

### 4.3 Displayed Information

Only public-safe fields as defined in [08-SECURITY.md](./08-SECURITY.md) §11.1:

| Field | Source |
|---|---|
| Batch Code | `waste_batches.batch_code` |
| Waste Type | `waste_batches.waste_type` (display label) |
| Source | `waste_sources.name` |
| Weight | `waste_batches.weight_kg` |
| Collection Date | `waste_batches.collection_date` |
| Current Status | `waste_batches.current_status` (display label) |
| Processing Timeline | `batch_stage_history` (stage names + dates only) |
| Linked Product | `product_batches.batch_code` via `product_waste_links` |
| Sustainability | Calculated: weight = waste diverted from disposal |

### 4.4 Not Displayed

- Internal UUID
- Researcher notes
- Created-by user info
- AI analysis details
- Audit history
- Moisture status
- Visual condition details
- Performed-by on stage history

### 4.5 Error States

| Scenario | Behavior |
|---|---|
| Batch code not found | Show "Batch not found" message — not a 500 error |
| Batch code format invalid | Show "Invalid batch code" message |
| Database error | Show generic "Unable to load data" message |

---

## 5. Sustainability Metrics

For each Waste Batch, basic sustainability information:

| Metric | Calculation | Notes |
|---|---|---|
| Waste Diverted | `weight_kg` of the batch | Simple: waste entering the system = diverted from disposal |
| Processing Status | Current stage indicates progress | Shows journey toward value recovery |
| Product Link | If linked to a Product Batch | Indicates waste was transformed into a product |

> [!IMPORTANT]
> More sophisticated sustainability calculations (carbon offset, economic value) are documented as open questions in [37-OPEN-QUESTIONS.md](./37-OPEN-QUESTIONS.md). The MVP uses simple waste weight as the diversion metric.

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [GOVERNANCE.md](./GOVERNANCE.md) | Canonical processing stages, terminology |
| [05-DATABASE-SCHEMA.md](./05-DATABASE-SCHEMA.md) | `waste_batches`, `batch_stage_history` definitions |
| [06-DATABASE-RELATIONSHIPS.md](./06-DATABASE-RELATIONSHIPS.md) | Traceability chain |
| [07-AUTH-AND-RBAC.md](./07-AUTH-AND-RBAC.md) | Permissions for stage transitions |
| [08-SECURITY.md](./08-SECURITY.md) | Public data boundary |
| [09-ROUTES-AND-PAGES.md](./09-ROUTES-AND-PAGES.md) | Route definitions |
| [13-QR-SYSTEM.md](./13-QR-SYSTEM.md) | QR code generation and URL format |
| [37-OPEN-QUESTIONS.md](./37-OPEN-QUESTIONS.md) | Stage definitions, sustainability formulas |
