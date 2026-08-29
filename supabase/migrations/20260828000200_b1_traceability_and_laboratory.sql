-- MangoCycle B1: canonical waste, product, processing, and laboratory tables.

create table if not exists public.waste_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_type text not null,
  location text,
  contact_info text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_waste_sources_name unique (name),
  constraint chk_waste_sources_source_type check (
    source_type in (
      'university',
      'farm',
      'mango_processing_factory',
      'juice_factory',
      'market',
      'other'
    )
  )
);

create index if not exists idx_waste_sources_source_type
  on public.waste_sources (source_type);

create index if not exists idx_waste_sources_is_active
  on public.waste_sources (is_active);

drop trigger if exists set_updated_at on public.waste_sources;
create trigger set_updated_at
  before update on public.waste_sources
  for each row
  execute function public.update_updated_at_column();

create table if not exists public.processing_stages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  display_order integer not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint uq_processing_stages_name unique (name),
  constraint uq_processing_stages_display_order unique (display_order)
);

insert into public.processing_stages (name, display_order)
values
  ('collected', 1),
  ('sorted', 2),
  ('washed', 3),
  ('dried', 4),
  ('ground', 5),
  ('extraction', 6),
  ('production', 7),
  ('laboratory_testing', 8),
  ('completed', 9)
on conflict do nothing;

create table if not exists public.waste_batches (
  id uuid primary key default gen_random_uuid(),
  batch_code text not null,
  waste_type text not null,
  source_id uuid references public.waste_sources (id) on delete set null,
  weight_kg numeric(10, 3) not null,
  collection_date date not null,
  location text,
  visual_condition text,
  moisture_status text,
  storage_duration_days integer,
  notes text,
  current_status text not null default 'collected',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_waste_batches_batch_code unique (batch_code),
  constraint chk_waste_batches_waste_type check (
    waste_type in ('mango_peel', 'mango_seed', 'mixed_mango_waste')
  ),
  constraint chk_waste_batches_weight_kg check (weight_kg > 0),
  constraint chk_waste_batches_visual_condition check (
    visual_condition is null or visual_condition in ('good', 'moderate', 'poor')
  ),
  constraint chk_waste_batches_moisture_status check (
    moisture_status is null or moisture_status in ('dry', 'moderate', 'high')
  ),
  constraint chk_waste_batches_storage_duration_days check (
    storage_duration_days is null or storage_duration_days >= 0
  ),
  constraint chk_waste_batches_current_status check (
    current_status in (
      'collected',
      'sorted',
      'washed',
      'dried',
      'ground',
      'extraction',
      'production',
      'laboratory_testing',
      'completed',
      'rejected'
    )
  )
);

create index if not exists idx_waste_batches_batch_code
  on public.waste_batches (batch_code);
create index if not exists idx_waste_batches_current_status
  on public.waste_batches (current_status);
create index if not exists idx_waste_batches_waste_type
  on public.waste_batches (waste_type);
create index if not exists idx_waste_batches_source_id
  on public.waste_batches (source_id);
create index if not exists idx_waste_batches_collection_date
  on public.waste_batches (collection_date);
create index if not exists idx_waste_batches_created_by
  on public.waste_batches (created_by);

drop trigger if exists set_updated_at on public.waste_batches;
create trigger set_updated_at
  before update on public.waste_batches
  for each row
  execute function public.update_updated_at_column();

create table if not exists public.batch_stage_history (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.waste_batches (id) on delete cascade,
  stage_name text not null,
  entered_at timestamptz not null default now(),
  notes text,
  performed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_batch_stage_history_batch_id
  on public.batch_stage_history (batch_id);
create index if not exists idx_batch_stage_history_entered_at
  on public.batch_stage_history (entered_at);
create index if not exists idx_batch_stage_history_stage_name
  on public.batch_stage_history (stage_name);

create table if not exists public.product_batches (
  id uuid primary key default gen_random_uuid(),
  batch_code text not null,
  product_name text not null,
  product_type text,
  production_date date,
  status text not null default 'in_production',
  quantity_produced numeric(10, 3),
  unit text,
  notes text,
  lab_testing_status text not null default 'pending',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_product_batches_batch_code unique (batch_code),
  constraint chk_product_batches_status check (
    status in ('in_production', 'testing', 'completed', 'released', 'rejected')
  ),
  constraint chk_product_batches_quantity_produced check (
    quantity_produced is null or quantity_produced > 0
  ),
  constraint chk_product_batches_lab_testing_status check (
    lab_testing_status in ('pending', 'in_progress', 'passed', 'failed', 'not_applicable')
  )
);

create index if not exists idx_product_batches_batch_code
  on public.product_batches (batch_code);
create index if not exists idx_product_batches_status
  on public.product_batches (status);
create index if not exists idx_product_batches_production_date
  on public.product_batches (production_date);

drop trigger if exists set_updated_at on public.product_batches;
create trigger set_updated_at
  before update on public.product_batches
  for each row
  execute function public.update_updated_at_column();

create table if not exists public.product_waste_links (
  id uuid primary key default gen_random_uuid(),
  product_batch_id uuid not null references public.product_batches (id) on delete cascade,
  waste_batch_id uuid not null references public.waste_batches (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint uq_product_waste_link unique (product_batch_id, waste_batch_id)
);

create index if not exists idx_product_waste_links_product_batch_id
  on public.product_waste_links (product_batch_id);
create index if not exists idx_product_waste_links_waste_batch_id
  on public.product_waste_links (waste_batch_id);

create table if not exists public.laboratory_tests (
  id uuid primary key default gen_random_uuid(),
  test_type text not null,
  waste_batch_id uuid references public.waste_batches (id) on delete set null,
  product_batch_id uuid references public.product_batches (id) on delete set null,
  test_date date,
  status text not null default 'pending',
  result_summary text,
  numeric_result numeric,
  result_unit text,
  researcher_notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_laboratory_tests_status check (
    status in ('pending', 'in_progress', 'completed', 'failed', 'cancelled')
  )
);

create index if not exists idx_laboratory_tests_test_type
  on public.laboratory_tests (test_type);
create index if not exists idx_laboratory_tests_waste_batch_id
  on public.laboratory_tests (waste_batch_id);
create index if not exists idx_laboratory_tests_product_batch_id
  on public.laboratory_tests (product_batch_id);
create index if not exists idx_laboratory_tests_status
  on public.laboratory_tests (status);

drop trigger if exists set_updated_at on public.laboratory_tests;
create trigger set_updated_at
  before update on public.laboratory_tests
  for each row
  execute function public.update_updated_at_column();

create table if not exists public.laboratory_attachments (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.laboratory_tests (id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_size_bytes integer,
  mime_type text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint chk_laboratory_attachments_file_size_bytes check (
    file_size_bytes is null or file_size_bytes > 0
  )
);

create index if not exists idx_laboratory_attachments_test_id
  on public.laboratory_attachments (test_id);

