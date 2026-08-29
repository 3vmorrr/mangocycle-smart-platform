-- Manual/local B1 negative verification script.
-- Run only against an isolated Supabase test database. The transaction is rolled back.

begin;

do $$
declare
  test_device_id uuid;
begin
  begin
    insert into public.profiles (id, email, role)
    values (gen_random_uuid(), 'b1-invalid-role@example.invalid', 'unknown');
    raise exception 'Expected unknown profile role to be rejected';
  exception when check_violation then
    null;
  end;

  begin
    insert into public.waste_sources (name, source_type)
    values ('B1 invalid source', 'unknown');
    raise exception 'Expected unknown source_type to be rejected';
  exception when check_violation then
    null;
  end;

  begin
    insert into public.waste_batches (
      batch_code, waste_type, weight_kg, collection_date, current_status
    ) values (
      'MW-2099-901', 'unknown', 1, date '2099-01-01', 'collected'
    );
    raise exception 'Expected unknown waste_type to be rejected';
  exception when check_violation then
    null;
  end;

  begin
    insert into public.waste_batches (
      batch_code, waste_type, weight_kg, collection_date, current_status
    ) values (
      'MW-2099-902', 'mango_peel', 0, date '2099-01-01', 'collected'
    );
    raise exception 'Expected zero Waste Batch weight to be rejected';
  exception when check_violation then
    null;
  end;

  begin
    insert into public.waste_batches (
      batch_code, waste_type, weight_kg, collection_date, current_status
    ) values (
      'MW-2099-903', 'mango_peel', 1, date '2099-01-01', 'unknown'
    );
    raise exception 'Expected unknown Waste Batch status to be rejected';
  exception when check_violation then
    null;
  end;

  insert into public.waste_batches (
    batch_code, waste_type, weight_kg, collection_date
  ) values (
    'MW-2099-904', 'mango_peel', 1, date '2099-01-01'
  );

  begin
    insert into public.waste_batches (
      batch_code, waste_type, weight_kg, collection_date
    ) values (
      'MW-2099-904', 'mango_seed', 1, date '2099-01-01'
    );
    raise exception 'Expected duplicate Waste Batch code to be rejected';
  exception when unique_violation then
    null;
  end;

  begin
    insert into public.product_batches (batch_code, product_name, status)
    values ('BF-2099-901', 'B1 invalid product', 'unknown');
    raise exception 'Expected unknown Product Batch status to be rejected';
  exception when check_violation then
    null;
  end;

  begin
    insert into public.product_batches (
      batch_code, product_name, lab_testing_status
    ) values (
      'BF-2099-905', 'B1 invalid lab status product', 'unknown'
    );
    raise exception 'Expected unknown Product Batch lab status to be rejected';
  exception when check_violation then
    null;
  end;

  insert into public.product_batches (batch_code, product_name)
  values ('BF-2099-902', 'B1 product');

  begin
    insert into public.product_batches (batch_code, product_name)
    values ('BF-2099-902', 'B1 duplicate product');
    raise exception 'Expected duplicate Product Batch code to be rejected';
  exception when unique_violation then
    null;
  end;

  begin
    insert into public.laboratory_tests (test_type, status)
    values ('B1 invalid lab test', 'unknown');
    raise exception 'Expected unknown Laboratory Test status to be rejected';
  exception when check_violation then
    null;
  end;

  begin
    insert into public.ai_analysis_records (analysis_type, status)
    values ('visual_assessment', 'unknown');
    raise exception 'Expected unknown AI analysis status to be rejected';
  exception when check_violation then
    null;
  end;

  insert into public.iot_devices (device_code, api_key_hash)
  values ('BIN-901', 'b1-test-hash')
  returning id into test_device_id;

  begin
    insert into public.iot_weight_readings (device_id, weight_kg, recorded_at)
    values (test_device_id, -1, now());
    raise exception 'Expected invalid IoT reading to be rejected';
  exception when check_violation then
    null;
  end;

  begin
    execute $invalid_iot_status$
      insert into public.iot_devices (device_code, api_key_hash, status)
      values ('BIN-902', 'b1-test-hash', 'unknown')
    $invalid_iot_status$;
    raise exception 'Expected undocumented IoT status column to be rejected';
  exception when undefined_column then
    null;
  end;

  begin
    insert into public.product_waste_links (product_batch_id, waste_batch_id)
    values (gen_random_uuid(), gen_random_uuid());
    raise exception 'Expected broken product/waste foreign keys to be rejected';
  exception when foreign_key_violation then
    null;
  end;

  if public.generate_waste_batch_code()
      !~ ('^MW-' || extract(year from now())::integer::text || '-[0-9]{3}$') then
    raise exception 'Waste Batch code helper returned an invalid external format';
  end if;

  if public.generate_product_batch_code()
      !~ ('^BF-' || extract(year from now())::integer::text || '-[0-9]{3}$') then
    raise exception 'Product Batch code helper returned an invalid external format';
  end if;

  if (
    select array_agg(name order by display_order)
    from public.processing_stages
  ) <> array[
    'collected',
    'sorted',
    'washed',
    'dried',
    'ground',
    'extraction',
    'production',
    'laboratory_testing',
    'completed'
  ]::text[] then
    raise exception 'Canonical processing stage order is incorrect';
  end if;
end;
$$;

rollback;
