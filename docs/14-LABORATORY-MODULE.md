# MangoCycle Smart Platform — Laboratory Module

> **Document Name:** Laboratory Module  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 05-DATABASE-SCHEMA.md, 07-AUTH-AND-RBAC.md, 08-SECURITY.md, 09-ROUTES-AND-PAGES.md

---

## 1. Purpose

This document describes the Laboratory Module — its features, data model usage, supported test types, file attachment handling, and integration with Waste Batches and Product Batches. Database schema is defined authoritatively in [05-DATABASE-SCHEMA.md](./05-DATABASE-SCHEMA.md) (tables: `laboratory_tests`, `laboratory_attachments`).

---

## 2. Core Concept

The Laboratory Module allows researchers to create test records, associate them with Waste Batches and/or Product Batches, record results, and attach supporting files.

### 2.1 Design Principle: Flexibility

The module is designed to support **any** test type — current and future. The `test_type` field is free-text, not a fixed enum.

Known test types from the scientific project:

| Test Type | Category |
|---|---|
| UV-Vis | Spectroscopy |
| TEM | Microscopy |
| XRD | Crystallography |
| FTIR | Spectroscopy |
| In Vitro | Biological testing |
| In Vivo | Biological testing |
| Antimicrobial | Efficacy testing |
| Antioxidant | Efficacy testing |

Additional test types can be added at any time by entering a new test type name.

---

## 3. Features

### 3.1 Create Laboratory Test

| Field | Required | Source |
|---|---|---|
| Test Type | Yes | Free-text input (with suggestions from previous types) |
| Waste Batch | Optional | Select from existing Waste Batches |
| Product Batch | Optional | Select from existing Product Batches |
| Test Date | Optional | Date picker |
| Status | Yes (default: `pending`) | Select: pending, in_progress, completed, failed, cancelled |
| Result Summary | Optional | Text area |
| Numeric Result | Optional | Number input |
| Result Unit | Optional | Text input (e.g., nm, %, mg/L) |
| Researcher Notes | Optional | Text area (private — not shown publicly) |

> [!NOTE]
> At least one of Waste Batch or Product Batch should be provided. This is enforced at the application level (Zod validation), not as a database constraint.

### 3.2 File Attachments

Files are uploaded to Supabase Storage (bucket: `laboratory-attachments`) and tracked in the `laboratory_attachments` table.

| Constraint | Value |
|---|---|
| Max file size | 10 MB |
| Allowed types | PDF, JPEG, PNG, TIFF, CSV, XLSX |
| Max files per test | 10 (application-level limit) |
| Storage path | `laboratory-attachments/{test_id}/{uuid}-{filename}` |
| Access | Private — authenticated `researcher`+ role only |

Upload process:
1. Validate file type and size client-side (UX)
2. Validate file type and size server-side (security)
3. Check MIME type from file headers (not just extension)
4. Upload to Supabase Storage
5. Create `laboratory_attachments` record
6. Audit log entry

### 3.3 List View

| Feature | Detail |
|---|---|
| Columns | Test type, associated batch codes, test date, status, result summary |
| Filtering | By test type, by status, by Waste Batch, by Product Batch |
| Sorting | By date, by type, by status |
| Pagination | 20 per page |

### 3.4 Detail View

Shows all test fields plus:
- Linked Waste Batch (clickable link to batch detail)
- Linked Product Batch (clickable link to batch detail)
- File attachments with download buttons
- Researcher notes (visible only to authenticated users)
- Metadata (created by, created at, updated at)

### 3.5 Edit Test

Authorized users (`researcher`+) can:
- Update status
- Add/update result summary and numeric result
- Add additional notes
- Upload new attachments
- Remove attachments (with audit logging)

---

## 4. Integration Points

### 4.1 Waste Batch Details Page

The Waste Batch detail page includes a "Laboratory Tests" section showing all tests associated with that batch:
- Test type, date, status, result summary
- Link to full test detail
- "Add Test" button (for `researcher`+)

### 4.2 Product Batch Details Page

Same pattern as Waste Batch — shows associated tests and overall lab testing status.

### 4.3 Dashboard

P1 Dashboard section: "Recent Lab Tests" showing the most recent test results.

### 4.4 Public Traceability Pages

- **Waste Traceability Page**: Lab tests are NOT shown on the public waste page
- **Product Traceability Page**: Only `lab_testing_status` (passed/failed/pending) is shown — no test details or attachments

---

## 5. Scientific Language

The Laboratory Module must follow scientific language constraints from [GOVERNANCE.md](./GOVERNANCE.md):

| Do | Don't |
|---|---|
| Display results as recorded data | Interpret results automatically |
| Show status as-is | Claim AI-validated results |
| Allow researcher to add interpretation in notes | Auto-generate diagnostic conclusions |

> [!IMPORTANT]
> The platform **records and displays** laboratory data. It does **not** interpret TEM/XRD/FTIR/etc. results automatically. Automated scientific interpretation is a Future feature requiring specialist validation (see [34-FUTURE-AI-ROADMAP.md](./34-FUTURE-AI-ROADMAP.md)).

---

## 6. Permissions Summary

Permissions are defined authoritatively in [07-AUTH-AND-RBAC.md](./07-AUTH-AND-RBAC.md) §4.3. Summary:

| Action | Minimum Role |
|---|---|
| View tests | `viewer` |
| Create test | `researcher` |
| Edit test | `researcher` |
| Delete test | `admin` |
| Upload attachments | `researcher` |
| Download attachments | `operator` |

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [GOVERNANCE.md](./GOVERNANCE.md) | Scientific language constraints |
| [05-DATABASE-SCHEMA.md](./05-DATABASE-SCHEMA.md) | `laboratory_tests`, `laboratory_attachments` tables |
| [07-AUTH-AND-RBAC.md](./07-AUTH-AND-RBAC.md) | Lab permissions |
| [08-SECURITY.md](./08-SECURITY.md) | File upload security, private data boundary |
| [09-ROUTES-AND-PAGES.md](./09-ROUTES-AND-PAGES.md) | Lab route definitions |
| [11-WASTE-TRACEABILITY.md](./11-WASTE-TRACEABILITY.md) | Integration with Waste Batch details |
| [12-PRODUCT-TRACEABILITY.md](./12-PRODUCT-TRACEABILITY.md) | Integration with Product Batch details |
| [25-VALIDATION-RULES.md](./25-VALIDATION-RULES.md) | File upload validation rules |
| [34-FUTURE-AI-ROADMAP.md](./34-FUTURE-AI-ROADMAP.md) | Future automated lab interpretation |
