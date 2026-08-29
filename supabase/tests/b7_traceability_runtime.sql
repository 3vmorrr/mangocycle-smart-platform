-- MangoCycle B7 Runtime Verification Suite for mangocycle-dev.
-- Verifies public traceability data relationships, anon table isolation, and RLS integrity.
-- All fixtures roll back at the end of the transaction.
begin;

create temporary table b7_results (test text primary key, result text not null);
grant all on table b7_results to anon, authenticated;

-- Setup test operator/researcher for seeding
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  ('70000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b7-researcher@example.invalid',
  extensions.crypt('B7-test-pwd', extensions.gen_salt('bf')), now(), '{"provider":"email"}'::jsonb, '{"full_name":"B7 Researcher"}'::jsonb, now(), now(), '', '', '', '');

update public.profiles set role = 'researcher' where id = '70000000-0000-0000-0000-000000000001';

-- Setup test waste source
insert into public.waste_sources (id, name, source_type, location, contact_info)
values ('70000000-0000-0000-0000-000000000010', 'B7 Test Farm', 'farm', 'Campus Sector 4', 'Private Contact: +1234567890, private@farm.example')
on conflict (name) do nothing;

-- 1. Seed controlled Waste Batches
insert into public.waste_batches (id, batch_code, waste_type, source_id, weight_kg, collection_date, current_status, created_by)
values
  ('70000000-0000-0000-0000-000000000021', 'MW-2096-001', 'mango_peel', '70000000-0000-0000-0000-000000000010', 75.0, current_date, 'completed', '70000000-0000-0000-0000-000000000001'),
  ('70000000-0000-0000-0000-000000000022', 'MW-2096-002', 'mango_seed', '70000000-0000-0000-0000-000000000010', 25.0, current_date, 'completed', '70000000-0000-0000-0000-000000000001');

-- Seed stage history for Batch 1
insert into public.batch_stage_history (batch_id, stage_name, entered_at, performed_by, notes)
values
  ('70000000-0000-0000-0000-000000000021', 'collected', now() - interval '2 days', '70000000-0000-0000-0000-000000000001', 'Private intake notes'),
  ('70000000-0000-0000-0000-000000000021', 'dried', now() - interval '1 day', '70000000-0000-0000-0000-000000000001', 'Private drying notes'),
  ('70000000-0000-0000-0000-000000000021', 'completed', now(), '70000000-0000-0000-0000-000000000001', 'Private completion notes');

-- 2. Seed controlled Product Batch
insert into public.product_batches (id, batch_code, product_name, product_type, production_date, status, lab_testing_status, created_by)
values
  ('70000000-0000-0000-0000-000000000031', 'BF-2096-001', 'B7 Biofungicide', 'Biofungicide', current_date, 'released', 'passed', '70000000-0000-0000-0000-000000000001');

-- 3. Link Product to both Waste Batches
insert into public.product_waste_links (product_batch_id, waste_batch_id)
values
  ('70000000-0000-0000-0000-000000000031', '70000000-0000-0000-0000-000000000021'),
  ('70000000-0000-0000-0000-000000000031', '70000000-0000-0000-0000-000000000022');

-- 1. Direct Anonymous Access Denial Tests
set local role anon;
do $$ begin
  if (select count(*) from public.waste_batches) <> 0 then raise exception 'anon read leaked waste_batches'; end if;
  if (select count(*) from public.product_batches) <> 0 then raise exception 'anon read leaked product_batches'; end if;
  if (select count(*) from public.product_waste_links) <> 0 then raise exception 'anon read leaked product_waste_links'; end if;
  if (select count(*) from public.batch_stage_history) <> 0 then raise exception 'anon read leaked batch_stage_history'; end if;
  if (select count(*) from public.laboratory_tests) <> 0 then raise exception 'anon read leaked laboratory_tests'; end if;
  if (select count(*) from public.laboratory_attachments) <> 0 then raise exception 'anon read leaked laboratory_attachments'; end if;
  if (select count(*) from public.audit_logs) <> 0 then raise exception 'anon read leaked audit_logs'; end if;
  if (select count(*) from public.app_settings) <> 0 then raise exception 'anon read leaked app_settings'; end if;
  if (select count(*) from public.iot_devices) <> 0 then raise exception 'anon read leaked iot_devices'; end if;

  insert into b7_results values ('direct_anon_table_access_denied', 'PASS');
end $$;
reset role;

-- 2. Traceability Relationship Verification
do $$
declare
  v_linked_waste_count integer;
  v_total_waste_weight numeric;
  v_linked_product_count integer;
begin
  -- Product -> Waste relationship
  select count(*), coalesce(sum(wb.weight_kg), 0)
  into v_linked_waste_count, v_total_waste_weight
  from public.product_waste_links pwl
  join public.waste_batches wb on pwl.waste_batch_id = wb.id
  where pwl.product_batch_id = '70000000-0000-0000-0000-000000000031';

  if v_linked_waste_count <> 2 or v_total_waste_weight <> 100.0 then
    raise exception 'expected 2 linked waste batches with 100.0 kg total, got % batches, % kg', v_linked_waste_count, v_total_waste_weight;
  end if;

  -- Waste -> Product relationship
  select count(*)
  into v_linked_product_count
  from public.product_waste_links
  where waste_batch_id = '70000000-0000-0000-0000-000000000021';

  if v_linked_product_count <> 1 then
    raise exception 'expected 1 linked product batch for waste 1, got %', v_linked_product_count;
  end if;

  insert into b7_results values ('bidirectional_traceability_verified', 'PASS');
end $$;

select test, result from b7_results order by test;
rollback;
