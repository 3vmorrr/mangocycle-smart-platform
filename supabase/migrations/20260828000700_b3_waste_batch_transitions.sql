-- MangoCycle B3: Real Waste Sources + Waste Batch + Processing Timeline Backend.
-- Concurrency-safe code generation grant, canonical source seeds, and atomic workflow RPCs.

grant execute on function public.generate_waste_batch_code() to authenticated;

-- Seed canonical waste sources if not already present
insert into public.waste_sources (name, source_type, location, contact_info)
values
  ('University Agriculture Lab', 'university', 'Campus Agricultural Research Facility, Sector 4', '+966 50 123 4567'),
  ('Mango Processing Factory A', 'mango_processing_factory', 'Industrial Zone 2, Warehouse 14', 'contact@mangofactory.com'),
  ('Juice Factory B', 'juice_factory', 'South Agricultural District, Highway 10', '+966 55 987 6543'),
  ('Local Organic Mango Farm', 'farm', 'Al-Kharj Agricultural Oasis', 'info@organicmango.local'),
  ('Central Wholesale Produce Market', 'market', 'Central Fruit & Vegetable Market, Stall 88', 'market-intake@mangocycle.local')
on conflict (name) do nothing;

create or replace function public.create_waste_batch(
  p_waste_type text,
  p_source_id uuid default null,
  p_weight_kg numeric default 0,
  p_collection_date date default current_date,
  p_location text default null,
  p_visual_condition text default null,
  p_moisture_status text default null,
  p_storage_duration_days integer default null,
  p_notes text default null
)
returns public.waste_batches
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  v_code text;
  v_batch public.waste_batches;
begin
  if actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not public.has_minimum_role('operator') then
    raise exception 'insufficient role privileges' using errcode = '42501';
  end if;

  if p_weight_kg is null or p_weight_kg <= 0 or p_weight_kg > 10000 then
    raise exception 'weight_kg must be between 0 and 10000' using errcode = '22003';
  end if;

  if p_collection_date is null or p_collection_date > current_date then
    raise exception 'collection_date cannot be in the future' using errcode = '22008';
  end if;

  if p_waste_type not in ('mango_peel', 'mango_seed', 'mixed_mango_waste') then
    raise exception 'invalid waste_type' using errcode = '22023';
  end if;

  if p_visual_condition is not null and p_visual_condition not in ('good', 'moderate', 'poor') then
    raise exception 'invalid visual_condition' using errcode = '22023';
  end if;

  if p_moisture_status is not null and p_moisture_status not in ('dry', 'moderate', 'high') then
    raise exception 'invalid moisture_status' using errcode = '22023';
  end if;

  if p_storage_duration_days is not null and p_storage_duration_days < 0 then
    raise exception 'storage_duration_days cannot be negative' using errcode = '22023';
  end if;

  if p_source_id is not null and not exists (select 1 from public.waste_sources where id = p_source_id) then
    raise exception 'referenced waste source does not exist' using errcode = '23503';
  end if;

  v_code := public.generate_waste_batch_code();

  insert into public.waste_batches (
    batch_code,
    waste_type,
    source_id,
    weight_kg,
    collection_date,
    location,
    visual_condition,
    moisture_status,
    storage_duration_days,
    notes,
    current_status,
    created_by
  )
  values (
    v_code,
    p_waste_type,
    p_source_id,
    p_weight_kg,
    p_collection_date,
    p_location,
    p_visual_condition,
    p_moisture_status,
    coalesce(p_storage_duration_days, 0),
    p_notes,
    'collected',
    actor_id
  )
  returning * into v_batch;

  insert into public.batch_stage_history (
    batch_id,
    stage_name,
    entered_at,
    notes,
    performed_by
  )
  values (
    v_batch.id,
    'collected',
    now(),
    coalesce(p_notes, 'Initial batch collection intake recorded'),
    actor_id
  );

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    before_value,
    after_value
  )
  values (
    actor_id,
    'batch.created',
    'waste_batch',
    v_batch.id,
    null,
    jsonb_build_object('batch_code', v_batch.batch_code, 'weight_kg', v_batch.weight_kg)
  );

  return v_batch;
end;
$$;

create or replace function public.advance_waste_batch_stage(
  p_batch_id uuid,
  p_notes text default null
)
returns public.waste_batches
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  v_batch public.waste_batches;
  v_next_status text;
begin
  if actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not public.has_minimum_role('operator') then
    raise exception 'insufficient role privileges' using errcode = '42501';
  end if;

  select * into v_batch from public.waste_batches where id = p_batch_id for update;
  if v_batch.id is null then
    raise exception 'batch not found' using errcode = 'P0002';
  end if;

  if v_batch.current_status = 'completed' or v_batch.current_status = 'rejected' then
    raise exception 'cannot advance completed or rejected batch' using errcode = '22023';
  end if;

  -- Canonical sequential stage transitions
  v_next_status := case v_batch.current_status
    when 'collected' then 'sorted'
    when 'sorted' then 'washed'
    when 'washed' then 'dried'
    when 'dried' then 'ground'
    when 'ground' then 'extraction'
    when 'extraction' then 'production'
    when 'production' then 'laboratory_testing'
    when 'laboratory_testing' then 'completed'
    else null
  end;

  if v_next_status is null then
    raise exception 'invalid current stage for advancement' using errcode = '22023';
  end if;

  update public.waste_batches
  set current_status = v_next_status,
      updated_at = now()
  where id = p_batch_id
  returning * into v_batch;

  insert into public.batch_stage_history (
    batch_id,
    stage_name,
    entered_at,
    notes,
    performed_by
  )
  values (
    v_batch.id,
    v_next_status,
    now(),
    p_notes,
    actor_id
  );

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    before_value,
    after_value
  )
  values (
    actor_id,
    'stage.advanced',
    'waste_batch',
    v_batch.id,
    jsonb_build_object('status', v_batch.current_status),
    jsonb_build_object('status', v_next_status, 'notes', p_notes)
  );

  return v_batch;
end;
$$;

create or replace function public.reject_waste_batch(
  p_batch_id uuid,
  p_reason text,
  p_notes text default null
)
returns public.waste_batches
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  v_batch public.waste_batches;
  v_history_notes text;
begin
  if actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not public.has_minimum_role('operator') then
    raise exception 'insufficient role privileges' using errcode = '42501';
  end if;

  if p_reason is null or trim(p_reason) = '' then
    raise exception 'rejection reason is required' using errcode = '22023';
  end if;

  select * into v_batch from public.waste_batches where id = p_batch_id for update;
  if v_batch.id is null then
    raise exception 'batch not found' using errcode = 'P0002';
  end if;

  if v_batch.current_status = 'completed' or v_batch.current_status = 'rejected' then
    raise exception 'cannot reject completed or already rejected batch' using errcode = '22023';
  end if;

  v_history_notes := 'Rejection reason: ' || trim(p_reason) ||
    case when p_notes is not null and trim(p_notes) <> '' then ' - ' || trim(p_notes) else '' end;

  update public.waste_batches
  set current_status = 'rejected',
      updated_at = now()
  where id = p_batch_id
  returning * into v_batch;

  insert into public.batch_stage_history (
    batch_id,
    stage_name,
    entered_at,
    notes,
    performed_by
  )
  values (
    v_batch.id,
    'rejected',
    now(),
    v_history_notes,
    actor_id
  );

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    before_value,
    after_value
  )
  values (
    actor_id,
    'batch.rejected',
    'waste_batch',
    v_batch.id,
    jsonb_build_object('status', v_batch.current_status),
    jsonb_build_object('status', 'rejected', 'reason', p_reason, 'notes', p_notes)
  );

  return v_batch;
end;
$$;

revoke all on function public.create_waste_batch(text, uuid, numeric, date, text, text, text, integer, text) from public, anon;
grant execute on function public.create_waste_batch(text, uuid, numeric, date, text, text, text, integer, text) to authenticated;

revoke all on function public.advance_waste_batch_stage(uuid, text) from public, anon;
grant execute on function public.advance_waste_batch_stage(uuid, text) to authenticated;

revoke all on function public.reject_waste_batch(uuid, text, text) from public, anon;
grant execute on function public.reject_waste_batch(uuid, text, text) to authenticated;
