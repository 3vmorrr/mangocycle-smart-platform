-- MangoCycle B1: canonical AI, IoT, audit, and settings tables.

create table if not exists public.ai_analysis_records (
  id uuid primary key default gen_random_uuid(),
  analysis_type text not null,
  waste_batch_id uuid references public.waste_batches (id) on delete set null,
  product_batch_id uuid references public.product_batches (id) on delete set null,
  input_reference text,
  prompt_version text,
  model text,
  input_data jsonb,
  output_data jsonb,
  status text not null default 'completed',
  human_reviewed boolean not null default false,
  requested_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint chk_ai_analysis_records_analysis_type check (
    analysis_type in (
      'visual_assessment',
      'processing_advice',
      'ask_mangocycle',
      'sustainability_insights',
      'report_generation'
    )
  ),
  constraint chk_ai_analysis_records_status check (
    status in ('pending', 'completed', 'failed', 'error')
  )
);

create index if not exists idx_ai_analysis_records_analysis_type
  on public.ai_analysis_records (analysis_type);
create index if not exists idx_ai_analysis_records_waste_batch_id
  on public.ai_analysis_records (waste_batch_id);
create index if not exists idx_ai_analysis_records_requested_by
  on public.ai_analysis_records (requested_by);
create index if not exists idx_ai_analysis_records_created_at
  on public.ai_analysis_records (created_at);

create table if not exists public.iot_devices (
  id uuid primary key default gen_random_uuid(),
  device_code text not null,
  name text,
  location text,
  api_key_hash text not null,
  is_active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_iot_devices_device_code unique (device_code)
);

create index if not exists idx_iot_devices_device_code
  on public.iot_devices (device_code);
create index if not exists idx_iot_devices_is_active
  on public.iot_devices (is_active);

drop trigger if exists set_updated_at on public.iot_devices;
create trigger set_updated_at
  before update on public.iot_devices
  for each row
  execute function public.update_updated_at_column();

create table if not exists public.iot_weight_readings (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.iot_devices (id) on delete cascade,
  weight_kg numeric(10, 3) not null,
  recorded_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint chk_iot_weight_readings_weight_kg check (weight_kg >= 0)
);

create index if not exists idx_iot_weight_readings_device_id
  on public.iot_weight_readings (device_id);
create index if not exists idx_iot_weight_readings_recorded_at
  on public.iot_weight_readings (recorded_at);
create index if not exists idx_iot_weight_readings_device_recorded
  on public.iot_weight_readings (device_id, recorded_at desc);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_value jsonb,
  after_value jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_actor_id
  on public.audit_logs (actor_id);
create index if not exists idx_audit_logs_entity_type
  on public.audit_logs (entity_type);
create index if not exists idx_audit_logs_entity_id
  on public.audit_logs (entity_id);
create index if not exists idx_audit_logs_created_at
  on public.audit_logs (created_at);
create index if not exists idx_audit_logs_action
  on public.audit_logs (action);

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  value jsonb not null,
  description text,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint uq_app_settings_key unique (key)
);

drop trigger if exists set_updated_at on public.app_settings;
create trigger set_updated_at
  before update on public.app_settings
  for each row
  execute function public.update_updated_at_column();

