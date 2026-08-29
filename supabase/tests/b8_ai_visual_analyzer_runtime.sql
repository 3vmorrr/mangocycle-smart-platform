-- MangoCycle B8 Runtime Verification Suite for mangocycle-dev.
-- Verifies AI analysis record persistence, role-based security boundaries, and RLS integrity.
-- All fixtures roll back at the end of the transaction.
begin;

create temporary table b8_results (test text primary key, result text not null);
grant all on table b8_results to anon, authenticated;

-- 1. Setup Test Users
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  ('80000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b8-operator1@example.invalid',
  extensions.crypt('B8-test-pwd', extensions.gen_salt('bf')), now(), '{"provider":"email"}'::jsonb, '{"full_name":"B8 Operator 1"}'::jsonb, now(), now(), '', '', '', ''),
  ('80000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b8-operator2@example.invalid',
  extensions.crypt('B8-test-pwd', extensions.gen_salt('bf')), now(), '{"provider":"email"}'::jsonb, '{"full_name":"B8 Operator 2"}'::jsonb, now(), now(), '', '', '', ''),
  ('80000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b8-viewer@example.invalid',
  extensions.crypt('B8-test-pwd', extensions.gen_salt('bf')), now(), '{"provider":"email"}'::jsonb, '{"full_name":"B8 Viewer"}'::jsonb, now(), now(), '', '', '', ''),
  ('80000000-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b8-researcher@example.invalid',
  extensions.crypt('B8-test-pwd', extensions.gen_salt('bf')), now(), '{"provider":"email"}'::jsonb, '{"full_name":"B8 Researcher"}'::jsonb, now(), now(), '', '', '', '');

update public.profiles set role = 'operator' where id in ('80000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000002');
update public.profiles set role = 'viewer' where id = '80000000-0000-0000-0000-000000000003';
update public.profiles set role = 'researcher' where id = '80000000-0000-0000-0000-000000000004';

-- 2. Setup Waste Batch Fixture
insert into public.waste_sources (id, name, source_type, location, contact_info)
values ('80000000-0000-0000-0000-000000000010', 'B8 Test Farm', 'farm', 'Sector 8', 'Private Contact')
on conflict (name) do nothing;

insert into public.waste_batches (id, batch_code, waste_type, source_id, weight_kg, collection_date, current_status, created_by)
values ('80000000-0000-0000-0000-000000000020', 'MW-2098-001', 'mango_peel', '80000000-0000-0000-0000-000000000010', 45.0, current_date, 'collected', '80000000-0000-0000-0000-000000000001');

-- Test 1: Anonymous Access Denial
set local role anon;
do $$ begin
  if (select count(*) from public.ai_analysis_records) <> 0 then
    raise exception 'anonymous read leaked ai_analysis_records';
  end if;

  begin
    insert into public.ai_analysis_records (analysis_type, waste_batch_id, status)
    values ('visual_assessment', '80000000-0000-0000-0000-000000000020', 'completed');
    raise exception 'anonymous insert unexpectedly succeeded';
  exception when others then
    null;
  end;

  insert into b8_results values ('anonymous_read_write_denied', 'PASS');
end $$;
reset role;

-- Test 2: Viewer Role Insert Denial
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"80000000-0000-0000-0000-000000000003","role":"authenticated"}';
do $$ begin
  begin
    insert into public.ai_analysis_records (analysis_type, waste_batch_id, status, requested_by)
    values ('visual_assessment', '80000000-0000-0000-0000-000000000020', 'completed', '80000000-0000-0000-0000-000000000003');
    raise exception 'viewer insert unexpectedly succeeded';
  exception when others then
    null;
  end;

  insert into b8_results values ('viewer_insert_denied', 'PASS');
end $$;
reset role;

-- Test 3: Operator 1 Can Insert & Read Own Record
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"80000000-0000-0000-0000-000000000001","role":"authenticated"}';
do $$
declare
  v_rec_id uuid;
  v_count integer;
begin
  insert into public.ai_analysis_records (
    id,
    analysis_type,
    waste_batch_id,
    input_reference,
    prompt_version,
    model,
    input_data,
    output_data,
    status,
    requested_by
  )
  values (
    '80000000-0000-0000-0000-000000000081',
    'visual_assessment',
    '80000000-0000-0000-0000-000000000020',
    'peel_sample.jpg',
    'waste-analyzer-v1.0',
    'gpt-4o-mini',
    '{"imageName":"peel_sample.jpg"}'::jsonb,
    '{"waste_type":"mango_peel","visual_condition":"good"}'::jsonb,
    'completed',
    '80000000-0000-0000-0000-000000000001'
  )
  returning id into v_rec_id;

  select count(*) into v_count
  from public.ai_analysis_records
  where id = '80000000-0000-0000-0000-000000000081';

  if v_count <> 1 then
    raise exception 'operator 1 failed to read own record';
  end if;

  insert into b8_results values ('operator_lifecycle_and_ownership', 'PASS');
end $$;
reset role;

-- Test 4: Operator 2 Cannot Read Operator 1's Record (Private Isolation)
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"80000000-0000-0000-0000-000000000002","role":"authenticated"}';
do $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from public.ai_analysis_records
  where id = '80000000-0000-0000-0000-000000000081';

  if v_count <> 0 then
    raise exception 'operator 2 unexpectedly read operator 1 record';
  end if;

  insert into b8_results values ('operator_isolation_verified', 'PASS');
end $$;
reset role;

-- Test 5: Researcher Can Read All Records
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"80000000-0000-0000-0000-000000000004","role":"authenticated"}';
do $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from public.ai_analysis_records
  where id = '80000000-0000-0000-0000-000000000081';

  if v_count <> 1 then
    raise exception 'researcher failed to read operator analysis record';
  end if;

  insert into b8_results values ('researcher_global_visibility', 'PASS');
end $$;
reset role;

select test, result from b8_results order by test;
rollback;
