-- MangoCycle B5: Laboratory Backend + Supabase Storage + Attachments
-- Creates the private storage bucket, sets storage policies, and implements atomic lab test/attachment RPCs.

-- 1. Create the private storage bucket for laboratory attachments
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'laboratory-attachments',
  'laboratory-attachments',
  false,
  10485760, -- 10 MB limit per 14-LABORATORY-MODULE.md §3.2
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/tiff',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/tiff',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

-- 2. Storage RLS Policies for laboratory-attachments
drop policy if exists "lab_storage_select" on storage.objects;
create policy "lab_storage_select" on storage.objects for select to authenticated
using (
  bucket_id = 'laboratory-attachments'
  and public.has_minimum_role('researcher')
);

drop policy if exists "lab_storage_insert" on storage.objects;
create policy "lab_storage_insert" on storage.objects for insert to authenticated
with check (
  bucket_id = 'laboratory-attachments'
  and public.has_minimum_role('researcher')
);

drop policy if exists "lab_storage_delete" on storage.objects;
create policy "lab_storage_delete" on storage.objects for delete to authenticated
using (
  bucket_id = 'laboratory-attachments'
  and public.has_minimum_role('researcher')
);

-- 3. Adjust RLS on laboratory_attachments to allow researcher deletion
drop policy if exists laboratory_attachments_delete on public.laboratory_attachments;
create policy laboratory_attachments_delete on public.laboratory_attachments for delete to authenticated
using (public.has_minimum_role('researcher'));

-- 4. Atomic RPCs for Laboratory Test and Attachment Lifecycle

-- Create Laboratory Test
create or replace function public.create_laboratory_test(
  p_test_type text,
  p_waste_batch_id uuid default null,
  p_product_batch_id uuid default null,
  p_test_date date default null,
  p_status text default 'pending',
  p_result_summary text default null,
  p_numeric_result numeric default null,
  p_result_unit text default null,
  p_researcher_notes text default null
)
returns public.laboratory_tests
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  v_test public.laboratory_tests;
begin
  if actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not public.has_minimum_role('researcher') then
    raise exception 'insufficient role privileges' using errcode = '42501';
  end if;

  if p_test_type is null or trim(p_test_type) = '' then
    raise exception 'test_type is required' using errcode = '22023';
  end if;

  if p_status not in ('pending', 'in_progress', 'completed', 'failed', 'cancelled') then
    raise exception 'invalid laboratory test status' using errcode = '22023';
  end if;

  if p_waste_batch_id is null and p_product_batch_id is null then
    raise exception 'at least one target batch (waste or product) is required' using errcode = '22023';
  end if;

  if p_waste_batch_id is not null and not exists (select 1 from public.waste_batches where id = p_waste_batch_id) then
    raise exception 'referenced waste batch does not exist' using errcode = '23503';
  end if;

  if p_product_batch_id is not null and not exists (select 1 from public.product_batches where id = p_product_batch_id) then
    raise exception 'referenced product batch does not exist' using errcode = '23503';
  end if;

  insert into public.laboratory_tests (
    test_type,
    waste_batch_id,
    product_batch_id,
    test_date,
    status,
    result_summary,
    numeric_result,
    result_unit,
    researcher_notes,
    created_by
  )
  values (
    trim(p_test_type),
    p_waste_batch_id,
    p_product_batch_id,
    p_test_date,
    p_status,
    nullif(trim(p_result_summary), ''),
    p_numeric_result,
    nullif(trim(p_result_unit), ''),
    nullif(trim(p_researcher_notes), ''),
    actor_id
  )
  returning * into v_test;

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
    'lab.test_created',
    'laboratory_test',
    v_test.id,
    null,
    jsonb_build_object(
      'test_type', v_test.test_type,
      'status', v_test.status,
      'waste_batch_id', v_test.waste_batch_id,
      'product_batch_id', v_test.product_batch_id
    )
  );

  return v_test;
end;
$$;

-- Update Laboratory Test
create or replace function public.update_laboratory_test(
  p_test_id uuid,
  p_test_type text default null,
  p_waste_batch_id uuid default null,
  p_product_batch_id uuid default null,
  p_test_date date default null,
  p_status text default null,
  p_result_summary text default null,
  p_numeric_result numeric default null,
  p_result_unit text default null,
  p_researcher_notes text default null
)
returns public.laboratory_tests
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  v_test public.laboratory_tests;
  v_before jsonb;
begin
  if actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not public.has_minimum_role('researcher') then
    raise exception 'insufficient role privileges' using errcode = '42501';
  end if;

  select * into v_test from public.laboratory_tests where id = p_test_id for update;
  if v_test.id is null then
    raise exception 'laboratory test not found' using errcode = 'P0002';
  end if;

  v_before := jsonb_build_object(
    'test_type', v_test.test_type,
    'status', v_test.status,
    'numeric_result', v_test.numeric_result,
    'result_unit', v_test.result_unit
  );

  if p_test_type is not null and trim(p_test_type) = '' then
    raise exception 'test_type cannot be empty' using errcode = '22023';
  end if;

  if p_status is not null and p_status not in ('pending', 'in_progress', 'completed', 'failed', 'cancelled') then
    raise exception 'invalid laboratory test status' using errcode = '22023';
  end if;

  if p_waste_batch_id is not null and not exists (select 1 from public.waste_batches where id = p_waste_batch_id) then
    raise exception 'referenced waste batch does not exist' using errcode = '23503';
  end if;

  if p_product_batch_id is not null and not exists (select 1 from public.product_batches where id = p_product_batch_id) then
    raise exception 'referenced product batch does not exist' using errcode = '23503';
  end if;

  update public.laboratory_tests
  set test_type = coalesce(nullif(trim(p_test_type), ''), test_type),
      waste_batch_id = case when p_waste_batch_id is not null then p_waste_batch_id else waste_batch_id end,
      product_batch_id = case when p_product_batch_id is not null then p_product_batch_id else product_batch_id end,
      test_date = coalesce(p_test_date, test_date),
      status = coalesce(p_status, status),
      result_summary = case when p_result_summary is not null then nullif(trim(p_result_summary), '') else result_summary end,
      numeric_result = coalesce(p_numeric_result, numeric_result),
      result_unit = case when p_result_unit is not null then nullif(trim(p_result_unit), '') else result_unit end,
      researcher_notes = case when p_researcher_notes is not null then nullif(trim(p_researcher_notes), '') else researcher_notes end,
      updated_at = now()
  where id = p_test_id
  returning * into v_test;

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
    'lab.result_updated',
    'laboratory_test',
    v_test.id,
    v_before,
    jsonb_build_object(
      'test_type', v_test.test_type,
      'status', v_test.status,
      'numeric_result', v_test.numeric_result,
      'result_unit', v_test.result_unit
    )
  );

  return v_test;
end;
$$;

-- Delete Laboratory Test (Hard delete with metadata cascade and returning attachment file paths for storage cleanup)
create or replace function public.delete_laboratory_test(
  p_test_id uuid
)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  v_paths text[];
begin
  if actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not public.has_minimum_role('admin') then
    raise exception 'insufficient role privileges' using errcode = '42501';
  end if;

  if not exists (select 1 from public.laboratory_tests where id = p_test_id) then
    raise exception 'laboratory test not found' using errcode = 'P0002';
  end if;

  -- Collect file paths of all attachments to be removed from storage
  select coalesce(array_agg(file_path), '{}') into v_paths
  from public.laboratory_attachments
  where test_id = p_test_id;

  -- Delete the test (FK cascade deletes laboratory_attachments records)
  delete from public.laboratory_tests where id = p_test_id;

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
    'lab.test_deleted',
    'laboratory_test',
    p_test_id,
    jsonb_build_object('attachment_count', array_length(v_paths, 1)),
    null
  );

  return v_paths;
end;
$$;

-- Add Laboratory Attachment
create or replace function public.add_laboratory_attachment(
  p_test_id uuid,
  p_file_name text,
  p_file_path text,
  p_file_size_bytes integer,
  p_mime_type text
)
returns public.laboratory_attachments
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  v_attachment public.laboratory_attachments;
begin
  if actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not public.has_minimum_role('researcher') then
    raise exception 'insufficient role privileges' using errcode = '42501';
  end if;

  if not exists (select 1 from public.laboratory_tests where id = p_test_id) then
    raise exception 'laboratory test not found' using errcode = '23503';
  end if;

  if p_file_name is null or trim(p_file_name) = '' then
    raise exception 'file_name is required' using errcode = '22023';
  end if;

  if p_file_path is null or trim(p_file_path) = '' then
    raise exception 'file_path is required' using errcode = '22023';
  end if;

  if p_file_size_bytes is not null and p_file_size_bytes <= 0 then
    raise exception 'file_size_bytes must be positive' using errcode = '22003';
  end if;

  insert into public.laboratory_attachments (
    test_id,
    file_name,
    file_path,
    file_size_bytes,
    mime_type,
    uploaded_by
  )
  values (
    p_test_id,
    trim(p_file_name),
    trim(p_file_path),
    p_file_size_bytes,
    nullif(trim(p_mime_type), ''),
    actor_id
  )
  returning * into v_attachment;

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
    'lab.attachment_added',
    'laboratory_test',
    p_test_id,
    null,
    jsonb_build_object(
      'attachment_id', v_attachment.id,
      'file_name', v_attachment.file_name,
      'file_size_bytes', v_attachment.file_size_bytes
    )
  );

  return v_attachment;
end;
$$;

-- Delete Laboratory Attachment
create or replace function public.delete_laboratory_attachment(
  p_attachment_id uuid
)
returns public.laboratory_attachments
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  v_attachment public.laboratory_attachments;
begin
  if actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not public.has_minimum_role('researcher') then
    raise exception 'insufficient role privileges' using errcode = '42501';
  end if;

  select * into v_attachment from public.laboratory_attachments where id = p_attachment_id;
  if v_attachment.id is null then
    raise exception 'attachment not found' using errcode = 'P0002';
  end if;

  delete from public.laboratory_attachments where id = p_attachment_id;

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
    'lab.attachment_removed',
    'laboratory_test',
    v_attachment.test_id,
    jsonb_build_object(
      'attachment_id', v_attachment.id,
      'file_name', v_attachment.file_name,
      'file_path', v_attachment.file_path
    ),
    null
  );

  return v_attachment;
end;
$$;

revoke all on function public.create_laboratory_test(text, uuid, uuid, date, text, text, numeric, text, text) from public, anon;
grant execute on function public.create_laboratory_test(text, uuid, uuid, date, text, text, numeric, text, text) to authenticated;

revoke all on function public.update_laboratory_test(uuid, text, uuid, uuid, date, text, text, numeric, text, text) from public, anon;
grant execute on function public.update_laboratory_test(uuid, text, uuid, uuid, date, text, text, numeric, text, text) to authenticated;

revoke all on function public.delete_laboratory_test(uuid) from public, anon;
grant execute on function public.delete_laboratory_test(uuid) to authenticated;

revoke all on function public.add_laboratory_attachment(uuid, text, text, integer, text) from public, anon;
grant execute on function public.add_laboratory_attachment(uuid, text, text, integer, text) to authenticated;

revoke all on function public.delete_laboratory_attachment(uuid) from public, anon;
grant execute on function public.delete_laboratory_attachment(uuid) to authenticated;
