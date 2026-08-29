-- B2 destructive-free runtime suite for mangocycle-dev. All fixtures roll back.
begin;

create temporary table b2_results (test text primary key, result text not null);
grant all on table b2_results to anon, authenticated;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', email,
  extensions.crypt('B2-temporary-not-a-real-credential', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', full_name), now(), now(), '', '', '', ''
from (values
  ('10000000-0000-0000-0000-000000000001'::uuid, 'b2-viewer@example.invalid', 'B2 Viewer'),
  ('10000000-0000-0000-0000-000000000002'::uuid, 'b2-operator@example.invalid', 'B2 Operator'),
  ('10000000-0000-0000-0000-000000000003'::uuid, 'b2-researcher@example.invalid', 'B2 Researcher'),
  ('10000000-0000-0000-0000-000000000004'::uuid, 'b2-admin@example.invalid', 'B2 Admin'),
  ('10000000-0000-0000-0000-000000000005'::uuid, 'b2-super@example.invalid', 'B2 Super'),
  ('10000000-0000-0000-0000-000000000006'::uuid, 'b2-other-super@example.invalid', 'B2 Other Super'),
  ('10000000-0000-0000-0000-000000000007'::uuid, 'b2-inactive@example.invalid', 'B2 Inactive')
) as fixtures(id, email, full_name);

update public.profiles set role = 'operator' where id = '10000000-0000-0000-0000-000000000002';
update public.profiles set role = 'researcher' where id = '10000000-0000-0000-0000-000000000003';
update public.profiles set role = 'admin' where id = '10000000-0000-0000-0000-000000000004';
update public.profiles set role = 'super_admin' where id in (
  '10000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000006'
);
update public.profiles set is_active = false where id = '10000000-0000-0000-0000-000000000007';

insert into public.waste_sources (id, name, source_type)
values ('20000000-0000-0000-0000-000000000001', 'B2 Fixture Source', 'other');
insert into public.waste_batches (id, batch_code, waste_type, weight_kg, collection_date, created_by)
values ('20000000-0000-0000-0000-000000000002', 'MW-2098-991', 'mango_peel', 1, '2098-01-01', '10000000-0000-0000-0000-000000000002');
insert into public.product_batches (id, batch_code, product_name, created_by)
values ('20000000-0000-0000-0000-000000000003', 'BF-2098-991', 'B2 Fixture Product', '10000000-0000-0000-0000-000000000003');
insert into public.laboratory_tests (id, test_type, created_by)
values ('20000000-0000-0000-0000-000000000004', 'B2 fixture', '10000000-0000-0000-0000-000000000003');
insert into public.laboratory_attachments (id, test_id, file_name, file_path, uploaded_by)
values ('20000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000004', 'safe.txt', 'b2/safe.txt', '10000000-0000-0000-0000-000000000003');

set local role anon;
do $$ begin
  if (select count(*) from public.waste_batches) <> 0 then raise exception 'anonymous read leaked'; end if;
  begin
    insert into public.waste_sources (name, source_type) values ('B2 anon forbidden', 'other');
    raise exception 'anonymous write unexpectedly succeeded';
  exception when insufficient_privilege then null; end;
  insert into b2_results values ('anonymous_protected_read_write', 'PASS');
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
do $$ declare affected integer; begin
  if (select count(*) from public.processing_stages) <> 9 then raise exception 'viewer read failed'; end if;
  if (select count(*) from public.profiles) <> 1 then raise exception 'viewer profile isolation failed'; end if;
  begin
    insert into public.waste_batches (batch_code, waste_type, weight_kg, collection_date, created_by)
    values ('MW-2098-992', 'mango_peel', 1, '2098-01-01', auth.uid());
    raise exception 'viewer write unexpectedly succeeded';
  exception when insufficient_privilege then null; end;
  update public.profiles set role = 'super_admin' where id = auth.uid();
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'viewer changed own role'; end if;
  insert into b2_results values ('viewer_read_and_denials', 'PASS');
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
do $$ begin
  insert into public.waste_batches (batch_code, waste_type, weight_kg, collection_date, created_by)
  values ('MW-2098-993', 'mango_seed', 2, '2098-01-01', auth.uid());
  begin
    insert into public.product_batches (batch_code, product_name, created_by)
    values ('BF-2098-992', 'Forbidden operator product', auth.uid());
    raise exception 'operator product write unexpectedly succeeded';
  exception when insufficient_privilege then null; end;
  if (select count(*) from public.laboratory_attachments) <> 0 then raise exception 'operator attachment read leaked'; end if;
  insert into b2_results values ('operator_operational_boundary', 'PASS');
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
do $$ begin
  insert into public.product_batches (batch_code, product_name, created_by)
  values ('BF-2098-993', 'Allowed researcher product', auth.uid());
  insert into public.laboratory_tests (test_type, created_by) values ('B2 allowed', auth.uid());
  if (select count(*) from public.laboratory_attachments) <> 1 then raise exception 'researcher attachment read failed'; end if;
  begin
    insert into public.waste_sources (name, source_type) values ('B2 researcher forbidden', 'other');
    raise exception 'researcher admin write unexpectedly succeeded';
  exception when insufficient_privilege then null; end;
  insert into b2_results values ('researcher_research_boundary', 'PASS');
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
do $$ declare managed public.profiles; affected integer; begin
  insert into public.waste_sources (name, source_type) values ('B2 admin allowed', 'other');
  managed := public.manage_profile('10000000-0000-0000-0000-000000000002', null, 'researcher', null);
  if managed.role <> 'researcher' then raise exception 'admin role assignment failed'; end if;
  begin perform public.manage_profile('10000000-0000-0000-0000-000000000001', null, 'super_admin', null);
    raise exception 'admin assigned super admin'; exception when insufficient_privilege then null; end;
  begin perform public.manage_profile('10000000-0000-0000-0000-000000000005', 'Forbidden', null, false);
    raise exception 'admin managed super admin'; exception when insufficient_privilege then null; end;
  begin perform public.manage_profile(auth.uid(), null, 'super_admin', null);
    raise exception 'admin self-promoted'; exception when insufficient_privilege then null; end;
  begin perform public.manage_profile(auth.uid(), null, null, false);
    raise exception 'admin self-deactivated'; exception when insufficient_privilege then null; end;
  update public.profiles set role = 'super_admin' where id = auth.uid();
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'direct admin self-promotion succeeded'; end if;
  insert into b2_results values ('admin_rules_and_rpc', 'PASS');
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000005","role":"authenticated"}', true);
do $$ declare managed public.profiles; begin
  managed := public.manage_profile('10000000-0000-0000-0000-000000000006', 'Managed by Super', null, false);
  if managed.is_active then raise exception 'super admin could not manage other super admin'; end if;
  managed := public.manage_profile('10000000-0000-0000-0000-000000000001', null, 'super_admin', null);
  if managed.role <> 'super_admin' then raise exception 'super admin assignment failed'; end if;
  insert into public.app_settings (key, value, updated_by) values ('b2.test', 'true', auth.uid());
  insert into b2_results values ('super_admin_highest_boundary', 'PASS');
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000007","role":"authenticated"}', true);
do $$ begin
  if public.is_active_user() then raise exception 'inactive helper allowed user'; end if;
  if (select count(*) from public.waste_batches) <> 0 then raise exception 'inactive user retained data access'; end if;
  if (select count(*) from public.profiles) <> 1 then raise exception 'inactive self profile read unavailable'; end if;
  insert into b2_results values ('inactive_user_denied', 'PASS');
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000099","role":"authenticated"}', true);
do $$ begin
  if (select count(*) from public.waste_batches) <> 0 then raise exception 'invalid session identity leaked data'; end if;
  begin perform public.manage_profile('10000000-0000-0000-0000-000000000001', null, 'super_admin', null);
    raise exception 'invalid identity called management RPC'; exception when insufficient_privilege then null; end;
  insert into b2_results values ('invalid_identity_denied', 'PASS');
end $$;
reset role;

select test, result from b2_results order by test;
rollback;
