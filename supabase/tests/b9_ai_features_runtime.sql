-- MangoCycle B9 AI Features Runtime RLS Test Suite

begin;

create temp table b9_test_results (
  test text primary key,
  result text not null
);
grant all on table b9_test_results to anon, authenticated;

-- 1. Setup Auth Users and Profiles
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  ('90000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b9-viewer@example.invalid',
  extensions.crypt('B9-test-pwd', extensions.gen_salt('bf')), now(), '{"provider":"email"}'::jsonb, '{"full_name":"B9 Viewer"}'::jsonb, now(), now(), '', '', '', ''),
  ('90000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b9-operator@example.invalid',
  extensions.crypt('B9-test-pwd', extensions.gen_salt('bf')), now(), '{"provider":"email"}'::jsonb, '{"full_name":"B9 Operator"}'::jsonb, now(), now(), '', '', '', ''),
  ('90000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b9-researcher@example.invalid',
  extensions.crypt('B9-test-pwd', extensions.gen_salt('bf')), now(), '{"provider":"email"}'::jsonb, '{"full_name":"B9 Researcher"}'::jsonb, now(), now(), '', '', '', '');

update public.profiles set role = 'viewer', is_active = true where id = '90000000-0000-0000-0000-000000000001';
update public.profiles set role = 'operator', is_active = true where id = '90000000-0000-0000-0000-000000000002';
update public.profiles set role = 'researcher', is_active = true where id = '90000000-0000-0000-0000-000000000003';

-- 2. Test Anonymous Access Denied
set local role anon;
select set_config('request.jwt.claims', '', true);

do $$
declare
  row_count int;
begin
  select count(*) into row_count from public.ai_analysis_records;
  if row_count <> 0 then
    insert into b9_test_results values ('anonymous_read_denied', 'FAIL: Anonymous saw records');
  else
    insert into b9_test_results values ('anonymous_read_denied', 'PASS');
  end if;

  begin
    insert into public.ai_analysis_records (analysis_type, requested_by)
    values ('sustainability_insights', null);
    insert into b9_test_results values ('anonymous_insert_denied', 'FAIL: Anonymous insert succeeded');
  exception when others then
    insert into b9_test_results values ('anonymous_insert_denied', 'PASS');
  end;
end $$;

-- 3. Test Viewer Insert & Select Own
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '90000000-0000-0000-0000-000000000001')::text, true);

insert into public.ai_analysis_records (id, analysis_type, requested_by, status)
values ('90000000-0000-0000-0000-000000000010', 'sustainability_insights', '90000000-0000-0000-0000-000000000001', 'completed');

do $$
declare
  row_count int;
begin
  select count(*) into row_count from public.ai_analysis_records where id = '90000000-0000-0000-0000-000000000010';
  if row_count = 1 then
    insert into b9_test_results values ('viewer_insert_and_select_own', 'PASS');
  else
    insert into b9_test_results values ('viewer_insert_and_select_own', 'FAIL');
  end if;
end $$;

-- 4. Test Operator Isolation
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '90000000-0000-0000-0000-000000000002')::text, true);

insert into public.ai_analysis_records (id, analysis_type, requested_by, status)
values ('90000000-0000-0000-0000-000000000020', 'processing_advice', '90000000-0000-0000-0000-000000000002', 'completed');

do $$
declare
  c_viewer int;
  c_own int;
begin
  select count(*) into c_viewer from public.ai_analysis_records where id = '90000000-0000-0000-0000-000000000010';
  select count(*) into c_own from public.ai_analysis_records where id = '90000000-0000-0000-0000-000000000020';

  if c_viewer = 0 then
    insert into b9_test_results values ('operator_isolated_from_viewer_record', 'PASS');
  else
    insert into b9_test_results values ('operator_isolated_from_viewer_record', 'FAIL');
  end if;

  if c_own = 1 then
    insert into b9_test_results values ('operator_insert_and_select_own', 'PASS');
  else
    insert into b9_test_results values ('operator_insert_and_select_own', 'FAIL');
  end if;
end $$;

-- 5. Test Researcher Global Visibility
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '90000000-0000-0000-0000-000000000003')::text, true);

do $$
declare
  row_count int;
begin
  select count(*) into row_count from public.ai_analysis_records
  where id in ('90000000-0000-0000-0000-000000000010', '90000000-0000-0000-0000-000000000020');

  if row_count = 2 then
    insert into b9_test_results values ('researcher_global_visibility', 'PASS');
  else
    insert into b9_test_results values ('researcher_global_visibility', 'FAIL');
  end if;
end $$;

select test, result from b9_test_results order by test;

rollback;
