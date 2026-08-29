-- MangoCycle B5 Runtime Verification Suite for mangocycle-dev.
-- All fixtures roll back at the end of the transaction.
begin;

create temporary table b5_results (test text primary key, result text not null);
grant all on table b5_results to anon, authenticated;

-- Setup test users
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', email,
  extensions.crypt('B5-temporary-test-pwd', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', full_name), now(), now(), '', '', '', ''
from (values
  ('50000000-0000-0000-0000-000000000001'::uuid, 'b5-viewer@example.invalid', 'B5 Viewer'),
  ('50000000-0000-0000-0000-000000000002'::uuid, 'b5-operator@example.invalid', 'B5 Operator'),
  ('50000000-0000-0000-0000-000000000003'::uuid, 'b5-researcher@example.invalid', 'B5 Researcher'),
  ('50000000-0000-0000-0000-000000000004'::uuid, 'b5-admin@example.invalid', 'B5 Admin')
) as fixtures(id, email, full_name);

update public.profiles set role = 'operator' where id = '50000000-0000-0000-0000-000000000002';
update public.profiles set role = 'researcher' where id = '50000000-0000-0000-0000-000000000003';
update public.profiles set role = 'admin' where id = '50000000-0000-0000-0000-000000000004';

-- Setup target waste batch and product batch
insert into public.waste_sources (id, name, source_type)
values ('50000000-0000-0000-0000-000000000010', 'B5 Test Source', 'farm')
on conflict (name) do nothing;

insert into public.waste_batches (id, batch_code, waste_type, weight_kg, collection_date, created_by)
values ('50000000-0000-0000-0000-000000000020', 'MW-2098-001', 'mango_peel', 30.0, current_date, '50000000-0000-0000-0000-000000000002');

insert into public.product_batches (id, batch_code, product_name, product_type, status, created_by)
values ('50000000-0000-0000-0000-000000000030', 'BF-2098-001', 'B5 Test Biofungicide', 'Biofungicide', 'in_production', '50000000-0000-0000-0000-000000000003');

-- 1. Anonymous Access Denials
set local role anon;
do $$ begin
  if (select count(*) from public.laboratory_tests) <> 0 then raise exception 'anonymous read leaked laboratory tests'; end if;
  if (select count(*) from public.laboratory_attachments) <> 0 then raise exception 'anonymous read leaked laboratory attachments'; end if;
  begin
    perform public.create_laboratory_test('UV-Vis', '50000000-0000-0000-0000-000000000020'::uuid, null, current_date, 'pending', null, null, null, null);
    raise exception 'anonymous test creation succeeded';
  exception when insufficient_privilege then null; end;
  insert into b5_results values ('anonymous_read_write_denied', 'PASS');
end $$;
reset role;

-- 2. Viewer Role: Read allowed, Mutation denied
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"50000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
do $$ begin
  perform count(*) from public.laboratory_tests;
  -- Viewer cannot read attachments (restricted to researcher+)
  if (select count(*) from public.laboratory_attachments) <> 0 then
    raise exception 'viewer read leaked laboratory attachments';
  end if;

  begin
    perform public.create_laboratory_test('UV-Vis', '50000000-0000-0000-0000-000000000020'::uuid, null, current_date, 'pending', null, null, null, null);
    raise exception 'viewer test creation succeeded';
  exception when insufficient_privilege then null; end;

  insert into b5_results values ('viewer_read_allowed_write_denied', 'PASS');
end $$;
reset role;

-- 3. Operator Role: Operator cannot create or update laboratory tests, cannot download attachments under restrictive security rule
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"50000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
do $$ begin
  -- Operator can read tests
  perform count(*) from public.laboratory_tests;

  -- Operator cannot read attachments (enforcing researcher+ security rule)
  if (select count(*) from public.laboratory_attachments) <> 0 then
    raise exception 'operator read leaked laboratory attachments';
  end if;

  begin
    perform public.create_laboratory_test('UV-Vis', '50000000-0000-0000-0000-000000000020'::uuid, null, current_date, 'pending', null, null, null, null);
    raise exception 'operator test creation unexpectedly succeeded';
  exception when insufficient_privilege then null; end;

  insert into b5_results values ('operator_mutation_and_attachment_denied', 'PASS');
end $$;
reset role;

-- 4. Researcher Role: Full Lab Test Creation, Update, Attachment Linking, and Hard Delete Cascade Verification
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"50000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
do $$
declare
  v_test public.laboratory_tests;
  v_att public.laboratory_attachments;
  v_att_count integer;
begin
  -- Validation: Missing target batch rejected
  begin
    perform public.create_laboratory_test('UV-Vis', null, null, current_date, 'pending', null, null, null, null);
    raise exception 'test creation without target batch succeeded';
  exception when invalid_parameter_value then null; end;

  -- Validation: Invalid status rejected
  begin
    perform public.create_laboratory_test('UV-Vis', '50000000-0000-0000-0000-000000000020'::uuid, null, current_date, 'invalid_status', null, null, null, null);
    raise exception 'test creation with invalid status succeeded';
  exception when invalid_parameter_value then null; end;

  -- Validation: Non-existent waste UUID rejected
  begin
    perform public.create_laboratory_test('UV-Vis', '99999999-9999-9999-9999-999999999999'::uuid, null, current_date, 'pending', null, null, null, null);
    raise exception 'test creation with non-existent waste UUID succeeded';
  exception when foreign_key_violation then null; end;

  -- 1. Create Laboratory Test linked to Product Batch
  v_test := public.create_laboratory_test(
    'UV-Vis Spectroscopy',
    null,
    '50000000-0000-0000-0000-000000000030'::uuid,
    current_date,
    'completed',
    'Peak absorption observed at 420 nm indicating nanoparticle presence',
    420,
    'nm',
    'Spectra recorded using standard quartz cuvette with blank baseline correction'
  );

  if v_test.id is null or v_test.test_type <> 'UV-Vis Spectroscopy' then
    raise exception 'failed to create laboratory test';
  end if;

  -- 2. Add Attachment metadata via RPC
  v_att := public.add_laboratory_attachment(
    v_test.id,
    'uv_vis_spectra_420nm.pdf',
    'laboratory-attachments/' || v_test.id || '/test-spectra.pdf',
    245000,
    'application/pdf'
  );

  if v_att.id is null or v_att.file_name <> 'uv_vis_spectra_420nm.pdf' then
    raise exception 'failed to add laboratory attachment';
  end if;

  -- 3. Update Laboratory Test
  v_test := public.update_laboratory_test(
    v_test.id,
    'UV-Vis Spectroscopy - Final',
    null,
    null,
    null,
    'completed',
    'Peak absorption confirmed at 420 nm across 3 repeated scans',
    420,
    'nm',
    'Triplicate measurements completed'
  );

  if v_test.test_type <> 'UV-Vis Spectroscopy - Final' then
    raise exception 'failed to update laboratory test';
  end if;

  -- 4. Verify researcher can delete single attachment
  perform public.delete_laboratory_attachment(v_att.id);
  select count(*) into v_att_count from public.laboratory_attachments where id = v_att.id;
  if v_att_count <> 0 then
    raise exception 'attachment was not deleted';
  end if;

  insert into b5_results values ('researcher_laboratory_lifecycle', 'PASS');
end $$;
reset role;

-- 5. Admin Role: Hard Deletion of Test and Attachment Cascade Verification
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"50000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
do $$
declare
  v_test public.laboratory_tests;
  v_att public.laboratory_attachments;
  v_paths text[];
  v_test_count integer;
  v_att_count integer;
begin
  -- Create test with attachment
  v_test := public.create_laboratory_test('TEM Microscopy', '50000000-0000-0000-0000-000000000020'::uuid, null, current_date, 'completed', 'Spherical morphology', 25, 'nm', 'Internal notes');
  v_att := public.add_laboratory_attachment(v_test.id, 'tem_micrograph.png', 'laboratory-attachments/' || v_test.id || '/tem.png', 512000, 'image/png');

  -- Hard delete test via RPC
  v_paths := public.delete_laboratory_test(v_test.id);

  if array_length(v_paths, 1) <> 1 then
    raise exception 'expected 1 attachment path returned from delete, got %', array_length(v_paths, 1);
  end if;

  -- Verify hard deletion in DB
  select count(*) into v_test_count from public.laboratory_tests where id = v_test.id;
  select count(*) into v_att_count from public.laboratory_attachments where test_id = v_test.id;

  if v_test_count <> 0 or v_att_count <> 0 then
    raise exception 'hard deletion failed to cascade delete test and attachments';
  end if;

  insert into b5_results values ('admin_hard_delete_and_cascade', 'PASS');
end $$;
reset role;

select test, result from b5_results order by test;
rollback;
