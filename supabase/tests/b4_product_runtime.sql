-- MangoCycle B4 Runtime Verification Suite for mangocycle-dev.
-- All fixtures roll back at the end of the transaction.
begin;

create temporary table b4_results (test text primary key, result text not null);
grant all on table b4_results to anon, authenticated;

-- Setup test users
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', email,
  extensions.crypt('B4-temporary-test-pwd', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', full_name), now(), now(), '', '', '', ''
from (values
  ('40000000-0000-0000-0000-000000000001'::uuid, 'b4-viewer@example.invalid', 'B4 Viewer'),
  ('40000000-0000-0000-0000-000000000002'::uuid, 'b4-operator@example.invalid', 'B4 Operator'),
  ('40000000-0000-0000-0000-000000000003'::uuid, 'b4-researcher@example.invalid', 'B4 Researcher'),
  ('40000000-0000-0000-0000-000000000004'::uuid, 'b4-admin@example.invalid', 'B4 Admin')
) as fixtures(id, email, full_name);

update public.profiles set role = 'operator' where id = '40000000-0000-0000-0000-000000000002';
update public.profiles set role = 'researcher' where id = '40000000-0000-0000-0000-000000000003';
update public.profiles set role = 'admin' where id = '40000000-0000-0000-0000-000000000004';

-- Setup 2 source waste batches
insert into public.waste_sources (id, name, source_type)
values ('40000000-0000-0000-0000-000000000010', 'B4 Test Source', 'farm')
on conflict (name) do nothing;

insert into public.waste_batches (id, batch_code, waste_type, weight_kg, collection_date, created_by)
values
  ('40000000-0000-0000-0000-000000000020', 'MW-2099-001', 'mango_peel', 25.0, current_date, '40000000-0000-0000-0000-000000000002'),
  ('40000000-0000-0000-0000-000000000021', 'MW-2099-002', 'mango_seed', 15.0, current_date, '40000000-0000-0000-0000-000000000002');

-- 1. Anonymous Access Denials
set local role anon;
do $$ begin
  if (select count(*) from public.product_batches) <> 0 then raise exception 'anonymous read leaked product batches'; end if;
  if (select count(*) from public.product_waste_links) <> 0 then raise exception 'anonymous read leaked product waste links'; end if;
  begin
    perform public.create_product_batch_with_links('Anon Biofungicide', null, current_date, 5, 'L', 'in_production', null, array['40000000-0000-0000-0000-000000000020'::uuid]);
    raise exception 'anonymous product creation succeeded';
  exception when insufficient_privilege then null; end;
  insert into b4_results values ('anonymous_read_write_denied', 'PASS');
end $$;
reset role;

-- 2. Viewer Role: Read allowed, Mutation denied
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"40000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
do $$ begin
  -- Viewer can read product tables
  perform count(*) from public.product_batches;
  perform count(*) from public.product_waste_links;

  -- Viewer cannot create product batch
  begin
    perform public.create_product_batch_with_links('Viewer Biofungicide', null, current_date, 5, 'L', 'in_production', null, array['40000000-0000-0000-0000-000000000020'::uuid]);
    raise exception 'viewer product creation succeeded';
  exception when insufficient_privilege then null; end;

  insert into b4_results values ('viewer_read_allowed_write_denied', 'PASS');
end $$;
reset role;

-- 3. Operator Role: Operator cannot create product batches (requires researcher+)
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"40000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
do $$ begin
  begin
    perform public.create_product_batch_with_links('Operator Biofungicide', null, current_date, 5, 'L', 'in_production', null, array['40000000-0000-0000-0000-000000000020'::uuid]);
    raise exception 'operator product creation unexpectedly succeeded';
  exception when insufficient_privilege then null; end;

  insert into b4_results values ('operator_product_creation_denied', 'PASS');
end $$;
reset role;

-- 4. Researcher Role: Full Product Creation, BF Code Generation, Multi-Waste Linking, Many-to-Many
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"40000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
do $$
declare
  v_prod1 public.product_batches;
  v_prod2 public.product_batches;
  v_link_count integer;
  v_waste_prod_count integer;
begin
  -- Validation: Empty waste array rejected
  begin
    perform public.create_product_batch_with_links('No Waste Product', null, current_date, 5, 'L', 'in_production', null, '{}'::uuid[]);
    raise exception 'product creation without waste inputs succeeded';
  exception when invalid_parameter_value then null; end;

  -- Validation: Non-existent waste UUID rejected
  begin
    perform public.create_product_batch_with_links('Bad Waste Product', null, current_date, 5, 'L', 'in_production', null, array['99999999-9999-9999-9999-999999999999'::uuid]);
    raise exception 'product creation with invalid waste UUID succeeded';
  exception when foreign_key_violation then null; end;

  -- Validation: Negative or zero quantity rejected
  begin
    perform public.create_product_batch_with_links('Zero Qty Product', null, current_date, 0, 'L', 'in_production', null, array['40000000-0000-0000-0000-000000000020'::uuid]);
    raise exception 'zero quantity product succeeded';
  exception when numeric_value_out_of_range then null; end;

  -- 1. Create Product 1 linking to BOTH Waste Batches (Multi-waste feed)
  v_prod1 := public.create_product_batch_with_links(
    'Biofungicide Formulation A1',
    'Biofungicide',
    current_date,
    10.5,
    'L',
    'in_production',
    'Formulated from peel and seed extracts',
    array['40000000-0000-0000-0000-000000000020'::uuid, '40000000-0000-0000-0000-000000000021'::uuid]
  );

  if v_prod1.batch_code not like 'BF-%' then
    raise exception 'invalid generated product batch code: %', v_prod1.batch_code;
  end if;

  if v_prod1.lab_testing_status <> 'pending' then
    raise exception 'initial lab status is not pending';
  end if;

  -- Verify 2 links created for Product 1
  select count(*) into v_link_count from public.product_waste_links where product_batch_id = v_prod1.id;
  if v_link_count <> 2 then
    raise exception 'expected 2 waste links for product 1, found %', v_link_count;
  end if;

  -- 2. Create Product 2 linking to Waste Batch 1 (Proves one waste batch feeds multiple products)
  v_prod2 := public.create_product_batch_with_links(
    'NanoBiovera Extract B2',
    'Nanoparticles',
    current_date,
    5.0,
    'L',
    'testing',
    'Nano-extract formulation',
    array['40000000-0000-0000-0000-000000000020'::uuid]
  );

  -- Verify Waste Batch 1 links to 2 distinct products (Reverse lookup)
  select count(*) into v_waste_prod_count from public.product_waste_links where waste_batch_id = '40000000-0000-0000-0000-000000000020'::uuid;
  if v_waste_prod_count <> 2 then
    raise exception 'expected waste batch 1 to link to 2 products, found %', v_waste_prod_count;
  end if;

  -- 3. Test Update RPC: update notes, status, and modify waste links
  v_prod1 := public.update_product_batch_with_links(
    v_prod1.id,
    'Biofungicide Formulation A1 - Revised',
    null,
    null,
    12.0,
    'L',
    'testing',
    'in_progress',
    'Advanced to testing phase',
    array['40000000-0000-0000-0000-000000000021'::uuid]
  );

  if v_prod1.status <> 'testing' or v_prod1.lab_testing_status <> 'in_progress' then
    raise exception 'product update failed to persist status';
  end if;

  select count(*) into v_link_count from public.product_waste_links where product_batch_id = v_prod1.id;
  if v_link_count <> 1 then
    raise exception 'expected 1 waste link after update, found %', v_link_count;
  end if;

  insert into b4_results values ('researcher_product_and_links_lifecycle', 'PASS');
end $$;
reset role;

select test, result from b4_results order by test;
rollback;
