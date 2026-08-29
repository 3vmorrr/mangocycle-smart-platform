-- MangoCycle B6 Runtime Verification Suite for mangocycle-dev.
-- Tests deterministic metric calculations, date range filtering, and RBAC boundaries.
-- All fixtures roll back at the end of the transaction.
begin;

create temporary table b6_results (test text primary key, result text not null);
grant all on table b6_results to anon, authenticated;

-- Setup test users
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', email,
  extensions.crypt('B6-temporary-test-pwd', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', full_name), now(), now(), '', '', '', ''
from (values
  ('60000000-0000-0000-0000-000000000001'::uuid, 'b6-viewer@example.invalid', 'B6 Viewer'),
  ('60000000-0000-0000-0000-000000000002'::uuid, 'b6-operator@example.invalid', 'B6 Operator'),
  ('60000000-0000-0000-0000-000000000003'::uuid, 'b6-researcher@example.invalid', 'B6 Researcher'),
  ('60000000-0000-0000-0000-000000000004'::uuid, 'b6-admin@example.invalid', 'B6 Admin')
) as fixtures(id, email, full_name);

update public.profiles set role = 'operator' where id = '60000000-0000-0000-0000-000000000002';
update public.profiles set role = 'researcher' where id = '60000000-0000-0000-0000-000000000003';
update public.profiles set role = 'admin' where id = '60000000-0000-0000-0000-000000000004';

-- Setup test waste source
insert into public.waste_sources (id, name, source_type)
values ('60000000-0000-0000-0000-000000000010', 'B6 Test Source', 'juice_factory')
on conflict (name) do nothing;

-- 1. Seed controlled Waste Batches
insert into public.waste_batches (id, batch_code, waste_type, source_id, weight_kg, collection_date, current_status, created_by)
values
  ('60000000-0000-0000-0000-000000000021', 'MW-2097-001', 'mango_peel', '60000000-0000-0000-0000-000000000010', 50.0, current_date, 'completed', '60000000-0000-0000-0000-000000000002'),
  ('60000000-0000-0000-0000-000000000022', 'MW-2097-002', 'mango_seed', '60000000-0000-0000-0000-000000000010', 30.0, current_date, 'sorted', '60000000-0000-0000-0000-000000000002'),
  ('60000000-0000-0000-0000-000000000023', 'MW-2097-003', 'mixed_mango_waste', '60000000-0000-0000-0000-000000000010', 20.0, current_date - 15, 'rejected', '60000000-0000-0000-0000-000000000002');

-- 2. Seed controlled Product Batches
insert into public.product_batches (id, batch_code, product_name, product_type, production_date, status, created_by)
values
  ('60000000-0000-0000-0000-000000000031', 'BF-2097-001', 'B6 Biofungicide 1', 'Biofungicide', current_date, 'completed', '60000000-0000-0000-0000-000000000003'),
  ('60000000-0000-0000-0000-000000000032', 'BF-2097-002', 'B6 Biofungicide 2', 'Biofungicide', current_date, 'in_production', '60000000-0000-0000-0000-000000000003');

-- 1. Anonymous Access Denials
set local role anon;
do $$ begin
  if (select count(*) from public.waste_batches where id in ('60000000-0000-0000-0000-000000000021','60000000-0000-0000-0000-000000000022','60000000-0000-0000-0000-000000000023')) <> 0 then
    raise exception 'anonymous read leaked waste batches';
  end if;
  insert into b6_results values ('anonymous_read_denied', 'PASS');
end $$;
reset role;

-- 2. Authenticated Viewer: Exact Metric Aggregation Tests
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"60000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
do $$
declare
  v_total_waste numeric;
  v_total_batches integer;
  v_completed_batches integer;
  v_active_batches integer;
  v_diverted_waste numeric;
  v_product_batches integer;
  v_7d_waste numeric;
  v_7d_batches integer;
begin
  -- All-time calculations on seeded fixtures
  select coalesce(sum(weight_kg), 0), count(*)
  into v_total_waste, v_total_batches
  from public.waste_batches
  where id in ('60000000-0000-0000-0000-000000000021','60000000-0000-0000-0000-000000000022','60000000-0000-0000-0000-000000000023');

  if v_total_waste <> 100.0 or v_total_batches <> 3 then
    raise exception 'expected total waste = 100.0, total batches = 3; got % kg, % batches', v_total_waste, v_total_batches;
  end if;

  select count(*) into v_completed_batches
  from public.waste_batches
  where id in ('60000000-0000-0000-0000-000000000021','60000000-0000-0000-0000-000000000022','60000000-0000-0000-0000-000000000023')
    and current_status = 'completed';

  if v_completed_batches <> 1 then
    raise exception 'expected 1 completed batch, got %', v_completed_batches;
  end if;

  select count(*) into v_active_batches
  from public.waste_batches
  where id in ('60000000-0000-0000-0000-000000000021','60000000-0000-0000-0000-000000000022','60000000-0000-0000-0000-000000000023')
    and current_status not in ('completed', 'rejected');

  if v_active_batches <> 1 then
    raise exception 'expected 1 active batch, got %', v_active_batches;
  end if;

  -- Diverted Waste: all intake entering system = diverted from disposal per 11-WASTE-TRACEABILITY.md §5
  select coalesce(sum(weight_kg), 0) into v_diverted_waste
  from public.waste_batches
  where id in ('60000000-0000-0000-0000-000000000021','60000000-0000-0000-0000-000000000022','60000000-0000-0000-0000-000000000023');

  if v_diverted_waste <> 100.0 then
    raise exception 'expected 100.0 kg diverted waste (total intake), got %', v_diverted_waste;
  end if;

  select count(*) into v_product_batches
  from public.product_batches
  where id in ('60000000-0000-0000-0000-000000000031','60000000-0000-0000-0000-000000000032');

  if v_product_batches <> 2 then
    raise exception 'expected 2 product batches, got %', v_product_batches;
  end if;

  -- 7-Day Date Range Filter test (excludes batch 3 collected 15 days ago)
  select coalesce(sum(weight_kg), 0), count(*)
  into v_7d_waste, v_7d_batches
  from public.waste_batches
  where id in ('60000000-0000-0000-0000-000000000021','60000000-0000-0000-0000-000000000022','60000000-0000-0000-0000-000000000023')
    and collection_date >= current_date - 7;

  if v_7d_waste <> 80.0 or v_7d_batches <> 2 then
    raise exception 'expected 7d waste = 80.0 kg, 7d batches = 2; got % kg, % batches', v_7d_waste, v_7d_batches;
  end if;

  insert into b6_results values ('viewer_deterministic_metrics_verified', 'PASS');
end $$;
reset role;

select test, result from b6_results order by test;
rollback;
