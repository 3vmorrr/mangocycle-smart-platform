-- MangoCycle B4: Real Product Batch Backend + Waste <-> Product Traceability Relationship.
-- Concurrency-safe code generation grant, atomic Product creation with Waste links, and update RPCs.

grant execute on function public.generate_product_batch_code() to authenticated;

create or replace function public.create_product_batch_with_links(
  p_product_name text,
  p_product_type text default null,
  p_production_date date default null,
  p_quantity_produced numeric default null,
  p_unit text default null,
  p_status text default 'in_production',
  p_notes text default null,
  p_waste_batch_ids uuid[] default '{}'
)
returns public.product_batches
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  v_code text;
  v_batch public.product_batches;
  v_waste_id uuid;
  v_distinct_waste_ids uuid[];
begin
  if actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not public.has_minimum_role('researcher') then
    raise exception 'insufficient role privileges' using errcode = '42501';
  end if;

  if p_product_name is null or trim(p_product_name) = '' then
    raise exception 'product_name is required' using errcode = '22023';
  end if;

  if p_quantity_produced is not null and p_quantity_produced <= 0 then
    raise exception 'quantity_produced must be greater than 0' using errcode = '22003';
  end if;

  if p_status not in ('in_production', 'testing', 'completed', 'released', 'rejected') then
    raise exception 'invalid product status' using errcode = '22023';
  end if;

  -- Verify at least one input waste batch
  if p_waste_batch_ids is null or array_length(p_waste_batch_ids, 1) is null or array_length(p_waste_batch_ids, 1) < 1 then
    raise exception 'at least one source waste batch is required' using errcode = '22023';
  end if;

  -- Eliminate duplicates in input array
  select array_agg(distinct u) into v_distinct_waste_ids from unnest(p_waste_batch_ids) as u;

  -- Verify all referenced waste batches exist
  foreach v_waste_id in array v_distinct_waste_ids loop
    if not exists (select 1 from public.waste_batches where id = v_waste_id) then
      raise exception 'referenced waste batch % does not exist', v_waste_id using errcode = '23503';
    end if;
  end loop;

  v_code := public.generate_product_batch_code();

  insert into public.product_batches (
    batch_code,
    product_name,
    product_type,
    production_date,
    quantity_produced,
    unit,
    status,
    lab_testing_status,
    notes,
    created_by
  )
  values (
    v_code,
    trim(p_product_name),
    nullif(trim(p_product_type), ''),
    p_production_date,
    p_quantity_produced,
    nullif(trim(p_unit), ''),
    p_status,
    'pending',
    nullif(trim(p_notes), ''),
    actor_id
  )
  returning * into v_batch;

  -- Insert waste links
  foreach v_waste_id in array v_distinct_waste_ids loop
    insert into public.product_waste_links (product_batch_id, waste_batch_id)
    values (v_batch.id, v_waste_id);
  end loop;

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
    'product_batch.created',
    'product_batch',
    v_batch.id,
    null,
    jsonb_build_object(
      'batch_code', v_batch.batch_code,
      'product_name', v_batch.product_name,
      'linked_waste_count', array_length(v_distinct_waste_ids, 1)
    )
  );

  return v_batch;
end;
$$;

create or replace function public.update_product_batch_with_links(
  p_product_id uuid,
  p_product_name text default null,
  p_product_type text default null,
  p_production_date date default null,
  p_quantity_produced numeric default null,
  p_unit text default null,
  p_status text default null,
  p_lab_testing_status text default null,
  p_notes text default null,
  p_waste_batch_ids uuid[] default null
)
returns public.product_batches
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  v_batch public.product_batches;
  v_waste_id uuid;
  v_distinct_waste_ids uuid[];
begin
  if actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not public.has_minimum_role('researcher') then
    raise exception 'insufficient role privileges' using errcode = '42501';
  end if;

  select * into v_batch from public.product_batches where id = p_product_id for update;
  if v_batch.id is null then
    raise exception 'product batch not found' using errcode = 'P0002';
  end if;

  if p_product_name is not null and trim(p_product_name) = '' then
    raise exception 'product_name cannot be empty' using errcode = '22023';
  end if;

  if p_quantity_produced is not null and p_quantity_produced <= 0 then
    raise exception 'quantity_produced must be greater than 0' using errcode = '22003';
  end if;

  if p_status is not null and p_status not in ('in_production', 'testing', 'completed', 'released', 'rejected') then
    raise exception 'invalid product status' using errcode = '22023';
  end if;

  if p_lab_testing_status is not null and p_lab_testing_status not in ('pending', 'in_progress', 'passed', 'failed', 'not_applicable') then
    raise exception 'invalid lab testing status' using errcode = '22023';
  end if;

  update public.product_batches
  set product_name = coalesce(nullif(trim(p_product_name), ''), product_name),
      product_type = case when p_product_type is not null then nullif(trim(p_product_type), '') else product_type end,
      production_date = coalesce(p_production_date, production_date),
      quantity_produced = coalesce(p_quantity_produced, quantity_produced),
      unit = case when p_unit is not null then nullif(trim(p_unit), '') else unit end,
      status = coalesce(p_status, status),
      lab_testing_status = coalesce(p_lab_testing_status, lab_testing_status),
      notes = case when p_notes is not null then nullif(trim(p_notes), '') else notes end,
      updated_at = now()
  where id = p_product_id
  returning * into v_batch;

  -- If waste_batch_ids array is explicitly supplied, replace links
  if p_waste_batch_ids is not null then
    if array_length(p_waste_batch_ids, 1) is null or array_length(p_waste_batch_ids, 1) < 1 then
      raise exception 'at least one source waste batch is required' using errcode = '22023';
    end if;

    select array_agg(distinct u) into v_distinct_waste_ids from unnest(p_waste_batch_ids) as u;

    foreach v_waste_id in array v_distinct_waste_ids loop
      if not exists (select 1 from public.waste_batches where id = v_waste_id) then
        raise exception 'referenced waste batch % does not exist', v_waste_id using errcode = '23503';
      end if;
    end loop;

    delete from public.product_waste_links where product_batch_id = p_product_id;

    foreach v_waste_id in array v_distinct_waste_ids loop
      insert into public.product_waste_links (product_batch_id, waste_batch_id)
      values (p_product_id, v_waste_id);
    end loop;
  end if;

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
    'product_batch.updated',
    'product_batch',
    v_batch.id,
    null,
    jsonb_build_object(
      'batch_code', v_batch.batch_code,
      'status', v_batch.status,
      'lab_testing_status', v_batch.lab_testing_status
    )
  );

  return v_batch;
end;
$$;

revoke all on function public.create_product_batch_with_links(text, text, date, numeric, text, text, text, uuid[]) from public, anon;
grant execute on function public.create_product_batch_with_links(text, text, date, numeric, text, text, text, uuid[]) to authenticated;

revoke all on function public.update_product_batch_with_links(uuid, text, text, date, numeric, text, text, text, text, uuid[]) from public, anon;
grant execute on function public.update_product_batch_with_links(uuid, text, text, date, numeric, text, text, text, text, uuid[]) to authenticated;
