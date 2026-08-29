# MangoCycle Smart Platform — Database Schema

> **Document Name:** Database Schema  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 06-DATABASE-RELATIONSHIPS.md, 07-AUTH-AND-RBAC.md, 25-VALIDATION-RULES.md

---

## 1. Purpose

This document is the **authoritative source** for all database table definitions, column specifications, constraints, indexes, enum strategies, code-generation strategies, and suggested Row Level Security (RLS) policies for the MangoCycle Smart Platform.

All other documents must reference this file for database structure details and must not redefine table schemas.

---

## 2. General Conventions

### 2.1 Primary Keys

- All tables use `UUID` as internal primary keys.
- Default value: `gen_random_uuid()`.
- Human-readable public codes (`MW-YYYY-NNN`, `BF-YYYY-NNN`, `BIN-NNN`) are stored as separate unique columns.

### 2.2 Timestamps

- All `created_at` columns: `TIMESTAMPTZ NOT NULL DEFAULT now()`.
- All `updated_at` columns: `TIMESTAMPTZ NOT NULL DEFAULT now()`, maintained via trigger.
- Timestamps stored in UTC.

### 2.3 Enum Strategy

**Use `TEXT` columns with `CHECK` constraints** rather than PostgreSQL `ENUM` types.

Rationale: PostgreSQL `ENUM` types are difficult to modify (adding/removing values requires `ALTER TYPE`). `TEXT` with `CHECK` constraints is easier to evolve, especially during rapid MVP development.

Example:
```sql
waste_type TEXT NOT NULL CHECK (waste_type IN ('mango_peel', 'mango_seed', 'mixed_mango_waste'))
```

### 2.4 Soft Delete Strategy

Soft delete is implemented via an `is_active` or `deleted_at` column where appropriate. Records are never physically deleted when they have downstream references (traceability chain). Audit logs and stage history are **never** soft-deleted.

### 2.5 Naming Conventions

- Table names: `snake_case`, plural (e.g., `waste_batches`)
- Column names: `snake_case` (e.g., `batch_code`)
- Foreign keys: `{referenced_table_singular}_id` (e.g., `source_id`, `batch_id`)
- Index names: `idx_{table}_{column(s)}`
- Constraint names: `chk_{table}_{column}` for checks, `uq_{table}_{column}` for unique

### 2.6 Updated-At Trigger

A reusable trigger function for `updated_at`:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Applied to each table:

```sql
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON {table_name}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 3. Table Definitions

### 3.1 `profiles`

Extends Supabase Auth `auth.users`. Created via a trigger when a new auth user is created.

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `UUID` | NOT NULL | — | PK, FK → `auth.users(id)` ON DELETE CASCADE |
| `email` | `TEXT` | NOT NULL | — | UNIQUE |
| `full_name` | `TEXT` | NULL | — | — |
| `role` | `TEXT` | NOT NULL | `'viewer'` | CHECK (`role` IN ('super_admin', 'admin', 'researcher', 'operator', 'viewer')) |
| `avatar_url` | `TEXT` | NULL | — | — |
| `is_active` | `BOOLEAN` | NOT NULL | `true` | — |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |

**Indexes:**
- `idx_profiles_role` ON `role`
- `idx_profiles_is_active` ON `is_active`

**Trigger:**
- `set_updated_at` BEFORE UPDATE

**Profile Creation Trigger:**

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

---

### 3.2 `waste_sources`

Configurable waste source registry.

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `name` | `TEXT` | NOT NULL | — | UNIQUE |
| `source_type` | `TEXT` | NOT NULL | — | CHECK (`source_type` IN ('university', 'farm', 'mango_processing_factory', 'juice_factory', 'market', 'other')) |
| `location` | `TEXT` | NULL | — | — |
| `contact_info` | `TEXT` | NULL | — | — |
| `is_active` | `BOOLEAN` | NOT NULL | `true` | — |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |

**Indexes:**
- `idx_waste_sources_source_type` ON `source_type`
- `idx_waste_sources_is_active` ON `is_active`

**Trigger:**
- `set_updated_at` BEFORE UPDATE

---

### 3.3 `waste_batches`

Core entity: each record represents a unique Waste Batch.

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `batch_code` | `TEXT` | NOT NULL | — | UNIQUE (`uq_waste_batches_batch_code`) |
| `waste_type` | `TEXT` | NOT NULL | — | CHECK (`waste_type` IN ('mango_peel', 'mango_seed', 'mixed_mango_waste')) |
| `source_id` | `UUID` | NULL | — | FK → `waste_sources(id)` ON DELETE SET NULL |
| `weight_kg` | `NUMERIC(10,3)` | NOT NULL | — | CHECK (`weight_kg` > 0) |
| `collection_date` | `DATE` | NOT NULL | — | — |
| `location` | `TEXT` | NULL | — | — |
| `visual_condition` | `TEXT` | NULL | — | CHECK (`visual_condition` IN ('good', 'moderate', 'poor') OR `visual_condition` IS NULL) |
| `moisture_status` | `TEXT` | NULL | — | CHECK (`moisture_status` IN ('dry', 'moderate', 'high') OR `moisture_status` IS NULL) |
| `storage_duration_days` | `INTEGER` | NULL | — | CHECK (`storage_duration_days` >= 0 OR `storage_duration_days` IS NULL) |
| `notes` | `TEXT` | NULL | — | — |
| `current_status` | `TEXT` | NOT NULL | `'collected'` | CHECK (`current_status` IN ('collected', 'sorted', 'washed', 'dried', 'ground', 'extraction', 'production', 'laboratory_testing', 'completed', 'rejected')) |
| `created_by` | `UUID` | NULL | — | FK → `profiles(id)` ON DELETE SET NULL |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |

**Indexes:**
- `idx_waste_batches_batch_code` ON `batch_code`
- `idx_waste_batches_current_status` ON `current_status`
- `idx_waste_batches_waste_type` ON `waste_type`
- `idx_waste_batches_source_id` ON `source_id`
- `idx_waste_batches_collection_date` ON `collection_date`
- `idx_waste_batches_created_by` ON `created_by`

**Trigger:**
- `set_updated_at` BEFORE UPDATE

> [!NOTE]
> `current_status` includes `'rejected'` as an additional terminal state. The canonical processing stages in [GOVERNANCE.md](./GOVERNANCE.md) define the normal lifecycle; `'rejected'` is for batches removed from the normal flow.

---

### 3.4 `processing_stages`

Configurable processing stage definitions. Used as a reference/configuration table.

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `name` | `TEXT` | NOT NULL | — | UNIQUE |
| `display_order` | `INTEGER` | NOT NULL | — | UNIQUE |
| `description` | `TEXT` | NULL | — | — |
| `is_active` | `BOOLEAN` | NOT NULL | `true` | — |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |

**Seed Data:**

| name | display_order |
|---|---|
| `collected` | 1 |
| `sorted` | 2 |
| `washed` | 3 |
| `dried` | 4 |
| `ground` | 5 |
| `extraction` | 6 |
| `production` | 7 |
| `laboratory_testing` | 8 |
| `completed` | 9 |

---

### 3.5 `batch_stage_history`

Append-only log of processing stage transitions for Waste Batches.

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `batch_id` | `UUID` | NOT NULL | — | FK → `waste_batches(id)` ON DELETE CASCADE |
| `stage_name` | `TEXT` | NOT NULL | — | — |
| `entered_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |
| `notes` | `TEXT` | NULL | — | — |
| `performed_by` | `UUID` | NULL | — | FK → `profiles(id)` ON DELETE SET NULL |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |

**Indexes:**
- `idx_batch_stage_history_batch_id` ON `batch_id`
- `idx_batch_stage_history_entered_at` ON `entered_at`
- `idx_batch_stage_history_stage_name` ON `stage_name`

> [!IMPORTANT]
> This table is **append-only**. Rows must never be updated or deleted in normal application flow. Completed stage records must not be silently overwritten.

---

### 3.6 `product_batches`

Tracks final biological products produced from waste.

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `batch_code` | `TEXT` | NOT NULL | — | UNIQUE (`uq_product_batches_batch_code`) |
| `product_name` | `TEXT` | NOT NULL | — | — |
| `product_type` | `TEXT` | NULL | — | — |
| `production_date` | `DATE` | NULL | — | — |
| `status` | `TEXT` | NOT NULL | `'in_production'` | CHECK (`status` IN ('in_production', 'testing', 'completed', 'released', 'rejected')) |
| `quantity_produced` | `NUMERIC(10,3)` | NULL | — | CHECK (`quantity_produced` > 0 OR `quantity_produced` IS NULL) |
| `unit` | `TEXT` | NULL | — | — |
| `notes` | `TEXT` | NULL | — | — |
| `lab_testing_status` | `TEXT` | NOT NULL | `'pending'` | CHECK (`lab_testing_status` IN ('pending', 'in_progress', 'passed', 'failed', 'not_applicable')) |
| `created_by` | `UUID` | NULL | — | FK → `profiles(id)` ON DELETE SET NULL |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |

**Indexes:**
- `idx_product_batches_batch_code` ON `batch_code`
- `idx_product_batches_status` ON `status`
- `idx_product_batches_production_date` ON `production_date`

**Trigger:**
- `set_updated_at` BEFORE UPDATE

> [!NOTE]
> `product_name` and `product_type` are free-text to support configurable product naming (e.g., "Biofungicide", "NanoBiovera"). They are NOT hard-coded enums.

---

### 3.7 `product_waste_links`

Many-to-many link between Product Batches and Waste Batches.

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `product_batch_id` | `UUID` | NOT NULL | — | FK → `product_batches(id)` ON DELETE CASCADE |
| `waste_batch_id` | `UUID` | NOT NULL | — | FK → `waste_batches(id)` ON DELETE RESTRICT |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |

**Constraints:**
- `uq_product_waste_link` UNIQUE (`product_batch_id`, `waste_batch_id`)

**Indexes:**
- `idx_product_waste_links_product_batch_id` ON `product_batch_id`
- `idx_product_waste_links_waste_batch_id` ON `waste_batch_id`

> [!IMPORTANT]
> `ON DELETE RESTRICT` on `waste_batch_id` prevents deletion of a Waste Batch that is linked to a Product Batch, preserving traceability.

---

### 3.8 `laboratory_tests`

Flexible laboratory test records.

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `test_type` | `TEXT` | NOT NULL | — | — |
| `waste_batch_id` | `UUID` | NULL | — | FK → `waste_batches(id)` ON DELETE SET NULL |
| `product_batch_id` | `UUID` | NULL | — | FK → `product_batches(id)` ON DELETE SET NULL |
| `test_date` | `DATE` | NULL | — | — |
| `status` | `TEXT` | NOT NULL | `'pending'` | CHECK (`status` IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')) |
| `result_summary` | `TEXT` | NULL | — | — |
| `numeric_result` | `NUMERIC` | NULL | — | — |
| `result_unit` | `TEXT` | NULL | — | — |
| `researcher_notes` | `TEXT` | NULL | — | — |
| `created_by` | `UUID` | NULL | — | FK → `profiles(id)` ON DELETE SET NULL |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |

**Indexes:**
- `idx_laboratory_tests_test_type` ON `test_type`
- `idx_laboratory_tests_waste_batch_id` ON `waste_batch_id`
- `idx_laboratory_tests_product_batch_id` ON `product_batch_id`
- `idx_laboratory_tests_status` ON `status`

**Trigger:**
- `set_updated_at` BEFORE UPDATE

> [!NOTE]
> `test_type` is free-text (not an enum) to support arbitrary test types: UV-Vis, TEM, XRD, FTIR, antimicrobial, antioxidant, in vitro, in vivo, and any future types.

**Constraint:** At least one of `waste_batch_id` or `product_batch_id` should be provided. This is enforced at the application level (Zod validation) rather than a database constraint, to keep the schema flexible.

---

### 3.9 `laboratory_attachments`

File attachments for laboratory test records.

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `test_id` | `UUID` | NOT NULL | — | FK → `laboratory_tests(id)` ON DELETE CASCADE |
| `file_name` | `TEXT` | NOT NULL | — | — |
| `file_path` | `TEXT` | NOT NULL | — | — |
| `file_size_bytes` | `INTEGER` | NULL | — | CHECK (`file_size_bytes` > 0 OR `file_size_bytes` IS NULL) |
| `mime_type` | `TEXT` | NULL | — | — |
| `uploaded_by` | `UUID` | NULL | — | FK → `profiles(id)` ON DELETE SET NULL |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |

**Indexes:**
- `idx_laboratory_attachments_test_id` ON `test_id`

---

### 3.10 `ai_analysis_records`

Audit trail for all AI interactions.

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `analysis_type` | `TEXT` | NOT NULL | — | CHECK (`analysis_type` IN ('visual_assessment', 'processing_advice', 'ask_mangocycle', 'sustainability_insights', 'report_generation')) |
| `waste_batch_id` | `UUID` | NULL | — | FK → `waste_batches(id)` ON DELETE SET NULL |
| `product_batch_id` | `UUID` | NULL | — | FK → `product_batches(id)` ON DELETE SET NULL |
| `input_reference` | `TEXT` | NULL | — | — |
| `prompt_version` | `TEXT` | NULL | — | — |
| `model` | `TEXT` | NULL | — | — |
| `input_data` | `JSONB` | NULL | — | — |
| `output_data` | `JSONB` | NULL | — | — |
| `status` | `TEXT` | NOT NULL | `'completed'` | CHECK (`status` IN ('pending', 'completed', 'failed', 'error')) |
| `human_reviewed` | `BOOLEAN` | NOT NULL | `false` | — |
| `requested_by` | `UUID` | NULL | — | FK → `profiles(id)` ON DELETE SET NULL |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |

**Indexes:**
- `idx_ai_analysis_records_analysis_type` ON `analysis_type`
- `idx_ai_analysis_records_waste_batch_id` ON `waste_batch_id`
- `idx_ai_analysis_records_requested_by` ON `requested_by`
- `idx_ai_analysis_records_created_at` ON `created_at`

---

### 3.11 `iot_devices`

Smart Bin device registration.

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `device_code` | `TEXT` | NOT NULL | — | UNIQUE (`uq_iot_devices_device_code`) |
| `name` | `TEXT` | NULL | — | — |
| `location` | `TEXT` | NULL | — | — |
| `api_key_hash` | `TEXT` | NOT NULL | — | — |
| `is_active` | `BOOLEAN` | NOT NULL | `true` | — |
| `last_seen_at` | `TIMESTAMPTZ` | NULL | — | — |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |

**Indexes:**
- `idx_iot_devices_device_code` ON `device_code`
- `idx_iot_devices_is_active` ON `is_active`

**Trigger:**
- `set_updated_at` BEFORE UPDATE

> [!NOTE]
> The raw API key is never stored. Only a hash (e.g., SHA-256) of the key is stored in `api_key_hash`. The raw key is displayed to the admin once at device creation, then never shown again.

---

### 3.12 `iot_weight_readings`

Individual weight readings from Smart Bins.

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `device_id` | `UUID` | NOT NULL | — | FK → `iot_devices(id)` ON DELETE CASCADE |
| `weight_kg` | `NUMERIC(10,3)` | NOT NULL | — | CHECK (`weight_kg` >= 0) |
| `recorded_at` | `TIMESTAMPTZ` | NOT NULL | — | — |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |

**Indexes:**
- `idx_iot_weight_readings_device_id` ON `device_id`
- `idx_iot_weight_readings_recorded_at` ON `recorded_at`
- `idx_iot_weight_readings_device_recorded` ON (`device_id`, `recorded_at` DESC)

> [!NOTE]
> `weight_kg` allows `0` (empty bin) unlike `waste_batches.weight_kg` which requires `> 0`.

---

### 3.13 `audit_logs`

Platform-wide audit trail. **Append-only** — no updates or deletes.

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `actor_id` | `UUID` | NULL | — | FK → `profiles(id)` ON DELETE SET NULL |
| `action` | `TEXT` | NOT NULL | — | — |
| `entity_type` | `TEXT` | NOT NULL | — | — |
| `entity_id` | `UUID` | NULL | — | — |
| `before_value` | `JSONB` | NULL | — | — |
| `after_value` | `JSONB` | NULL | — | — |
| `ip_address` | `TEXT` | NULL | — | — |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |

**Indexes:**
- `idx_audit_logs_actor_id` ON `actor_id`
- `idx_audit_logs_entity_type` ON `entity_type`
- `idx_audit_logs_entity_id` ON `entity_id`
- `idx_audit_logs_created_at` ON `created_at`
- `idx_audit_logs_action` ON `action`

**Common `action` values:**

| Action | Entity Type | Description |
|---|---|---|
| `batch.created` | `waste_batch` | New Waste Batch created |
| `batch.updated` | `waste_batch` | Waste Batch fields updated |
| `batch.stage_changed` | `waste_batch` | Processing stage advanced |
| `product.created` | `product_batch` | New Product Batch created |
| `product.updated` | `product_batch` | Product Batch fields updated |
| `product.waste_linked` | `product_batch` | Waste Batch linked to Product |
| `product.waste_unlinked` | `product_batch` | Waste Batch unlinked from Product |
| `lab.test_created` | `laboratory_test` | Lab test record created |
| `lab.result_updated` | `laboratory_test` | Lab test result updated |
| `lab.attachment_added` | `laboratory_test` | File attached to lab test |
| `ai.analysis_requested` | `ai_analysis` | AI analysis initiated |
| `user.role_changed` | `profile` | User role modified |
| `user.deactivated` | `profile` | User account deactivated |
| `iot.device_created` | `iot_device` | Smart Bin registered |
| `iot.weight_received` | `iot_reading` | Weight reading recorded |

---

### 3.14 `app_settings`

Application configuration key-value store.

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `key` | `TEXT` | NOT NULL | — | UNIQUE |
| `value` | `JSONB` | NOT NULL | — | — |
| `description` | `TEXT` | NULL | — | — |
| `updated_by` | `UUID` | NULL | — | FK → `profiles(id)` ON DELETE SET NULL |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `now()` | — |

**Trigger:**
- `set_updated_at` BEFORE UPDATE

---

## 4. Public Identifier Code-Generation Strategy

### 4.1 Waste Batch Code: `MW-YYYY-NNN`

Format: `MW-{4-digit year}-{3-digit zero-padded sequence}`

**Strategy: Database function with advisory lock**

```sql
CREATE OR REPLACE FUNCTION generate_waste_batch_code()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_seq INTEGER;
  new_code TEXT;
BEGIN
  current_year := to_char(now(), 'YYYY');

  -- Get the next sequence number for this year
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(batch_code FROM 'MW-' || current_year || '-(\d+)')
        AS INTEGER
      )
    ), 0
  ) + 1
  INTO next_seq
  FROM waste_batches
  WHERE batch_code LIKE 'MW-' || current_year || '-%';

  new_code := 'MW-' || current_year || '-' || LPAD(next_seq::TEXT, 3, '0');

  RETURN new_code;
END;
$$ LANGUAGE plpgsql;
```

### 4.2 Product Batch Code: `BF-YYYY-NNN`

Format: `BF-{4-digit year}-{3-digit zero-padded sequence}`

Same strategy as waste batch codes, using prefix `BF-`.

```sql
CREATE OR REPLACE FUNCTION generate_product_batch_code()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_seq INTEGER;
  new_code TEXT;
BEGIN
  current_year := to_char(now(), 'YYYY');

  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(batch_code FROM 'BF-' || current_year || '-(\d+)')
        AS INTEGER
      )
    ), 0
  ) + 1
  INTO next_seq
  FROM product_batches
  WHERE batch_code LIKE 'BF-' || current_year || '-%';

  new_code := 'BF-' || current_year || '-' || LPAD(next_seq::TEXT, 3, '0');

  RETURN new_code;
END;
$$ LANGUAGE plpgsql;
```

### 4.3 Concurrency Safety

> [!IMPORTANT]
> The code-generation functions must be called within the same transaction as the `INSERT` statement. The `UNIQUE` constraint on `batch_code` acts as the final guard against duplicates. If a race condition causes a duplicate, the transaction will fail and can be retried.

For higher concurrency environments (future), consider a dedicated sequence table with row-level locking. For the MVP prototype with low concurrent users, the above approach is sufficient.

### 4.4 Smart Bin Code: `BIN-NNN`

Smart Bin codes (`BIN-NNN`) are manually assigned by administrators during device registration. They are not auto-generated. The `UNIQUE` constraint on `device_code` prevents duplicates.

---

## 5. Suggested Row Level Security (RLS) Policies

RLS policies enforce data access at the database level. These are suggestions — final policies should be reviewed with the auth model defined in [07-AUTH-AND-RBAC.md](./07-AUTH-AND-RBAC.md).

### 5.1 Enable RLS on All Tables

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_waste_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratory_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratory_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_weight_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
```

### 5.2 Policy Pattern

```sql
-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### 5.3 Example Policies for `waste_batches`

```sql
-- All authenticated users can read waste batches
CREATE POLICY "Authenticated users can view waste batches"
  ON waste_batches FOR SELECT
  TO authenticated
  USING (true);

-- Operators, researchers, admins, super_admins can insert
CREATE POLICY "Authorized users can create waste batches"
  ON waste_batches FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() IN ('operator', 'researcher', 'admin', 'super_admin'));

-- Operators, researchers, admins, super_admins can update
CREATE POLICY "Authorized users can update waste batches"
  ON waste_batches FOR UPDATE
  TO authenticated
  USING (get_user_role() IN ('operator', 'researcher', 'admin', 'super_admin'));

-- Only admins and super_admins can delete (soft delete preferred)
CREATE POLICY "Admins can delete waste batches"
  ON waste_batches FOR DELETE
  TO authenticated
  USING (get_user_role() IN ('admin', 'super_admin'));
```

### 5.4 Audit Logs Policy

```sql
-- Append-only: authenticated users can insert
CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only admins can read audit logs
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (get_user_role() IN ('admin', 'super_admin'));

-- No update or delete policies (append-only)
```

### 5.5 Service Role Bypass

Server Actions using the Supabase service role client bypass RLS entirely. This is used for:
- IoT weight endpoint (authenticates via API key, not JWT)
- System-level operations
- Audit log writes from server context

> [!WARNING]
> The Supabase service role key must **never** be exposed to the client. It is used only in server-side code.

---

## 6. Migration Strategy

### 6.1 Tool

Use **Supabase CLI migrations** (`supabase migration new`, `supabase db push`).

### 6.2 Order

Migrations must be applied in order:

1. Trigger function (`update_updated_at_column`)
2. `profiles` table + auth trigger
3. `waste_sources`
4. `processing_stages` + seed data
5. `waste_batches`
6. `batch_stage_history`
7. `product_batches`
8. `product_waste_links`
9. `laboratory_tests`
10. `laboratory_attachments`
11. `ai_analysis_records`
12. `iot_devices`
13. `iot_weight_readings`
14. `audit_logs`
15. `app_settings`
16. Code generation functions
17. RLS policies
18. Indexes (if not inline)

### 6.3 Determinism

All migrations must be deterministic and idempotent where possible. Use `IF NOT EXISTS` for table and index creation. Use `CREATE OR REPLACE` for functions.

---

## 7. Supabase Storage Buckets

| Bucket | Purpose | Public | Max File Size |
|---|---|---|---|
| `laboratory-attachments` | Lab test file uploads | No (private) | 10 MB |
| `ai-uploads` | Waste images for AI analysis | No (private) | 5 MB |

Bucket policies should restrict access to authenticated users. Detailed file validation rules are in [25-VALIDATION-RULES.md](./25-VALIDATION-RULES.md).

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [GOVERNANCE.md](./GOVERNANCE.md) | Canonical terminology, processing stages list |
| [06-DATABASE-RELATIONSHIPS.md](./06-DATABASE-RELATIONSHIPS.md) | ER diagram and relationship descriptions |
| [07-AUTH-AND-RBAC.md](./07-AUTH-AND-RBAC.md) | Role definitions for RLS policies |
| [08-SECURITY.md](./08-SECURITY.md) | Security requirements affecting schema design |
| [25-VALIDATION-RULES.md](./25-VALIDATION-RULES.md) | Application-level validation rules |
| [27-AUDIT-LOGGING.md](./27-AUDIT-LOGGING.md) | Audit log event specifications |
| [29-ENVIRONMENT-CONFIG.md](./29-ENVIRONMENT-CONFIG.md) | Database connection configuration |
