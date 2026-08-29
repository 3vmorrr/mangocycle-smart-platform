-- MangoCycle B1: concurrency-safe public code helpers and structural RLS enablement.
-- Detailed role policies are intentionally deferred to B2.

create or replace function public.generate_waste_batch_code()
returns text
language plpgsql
set search_path = ''
as $$
declare
  current_year integer := extract(year from pg_catalog.now())::integer;
  current_year_text text := current_year::text;
  next_sequence integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('mangocycle:waste_batch_code'),
    current_year
  );

  select coalesce(
    max(
      substring(
        waste_batches.batch_code
        from ('^MW-' || current_year_text || '-([0-9]+)$')
      )::integer
    ),
    0
  ) + 1
  into next_sequence
  from public.waste_batches
  where waste_batches.batch_code like 'MW-' || current_year_text || '-%';

  if next_sequence > 999 then
    raise exception 'Waste Batch code capacity exhausted for year %', current_year
      using errcode = '54000';
  end if;

  return 'MW-' || current_year_text || '-' || pg_catalog.lpad(next_sequence::text, 3, '0');
end;
$$;

create or replace function public.generate_product_batch_code()
returns text
language plpgsql
set search_path = ''
as $$
declare
  current_year integer := extract(year from pg_catalog.now())::integer;
  current_year_text text := current_year::text;
  next_sequence integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('mangocycle:product_batch_code'),
    current_year
  );

  select coalesce(
    max(
      substring(
        product_batches.batch_code
        from ('^BF-' || current_year_text || '-([0-9]+)$')
      )::integer
    ),
    0
  ) + 1
  into next_sequence
  from public.product_batches
  where product_batches.batch_code like 'BF-' || current_year_text || '-%';

  if next_sequence > 999 then
    raise exception 'Product Batch code capacity exhausted for year %', current_year
      using errcode = '54000';
  end if;

  return 'BF-' || current_year_text || '-' || pg_catalog.lpad(next_sequence::text, 3, '0');
end;
$$;

alter table public.profiles enable row level security;
alter table public.waste_sources enable row level security;
alter table public.waste_batches enable row level security;
alter table public.processing_stages enable row level security;
alter table public.batch_stage_history enable row level security;
alter table public.product_batches enable row level security;
alter table public.product_waste_links enable row level security;
alter table public.laboratory_tests enable row level security;
alter table public.laboratory_attachments enable row level security;
alter table public.ai_analysis_records enable row level security;
alter table public.iot_devices enable row level security;
alter table public.iot_weight_readings enable row level security;
alter table public.audit_logs enable row level security;
alter table public.app_settings enable row level security;

