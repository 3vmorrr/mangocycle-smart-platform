-- MangoCycle B3 Runtime Verification Suite for mangocycle-dev.
-- All fixtures roll back at the end of the transaction.
begin;

create temporary table b3_results (test text primary key, result text not null);
grant all on table b3_results to anon, authenticated;

-- Setup test users
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', email,
  extensions.crypt('B3-temporary-test-pwd', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', full_name), now(), now(), '', '', '', ''
from (values
  ('30000000-0000-0000-0000-000000000001'::uuid, 'b3-viewer@example.invalid', 'B3 Viewer'),
  ('30000000-0000-0000-0000-000000000002'::uuid, 'b3-operator@example.invalid', 'B3 Operator'),
  ('30000000-0000-0000-0000-000000000003'::uuid, 'b3-admin@example.invalid', 'B3 Admin')
) as fixtures(id, email, full_name);

update public.profiles set role = 'operator' where id = '30000000-0000-0000-0000-000000000002';
update public.profiles set role = 'admin' where id = '30000000-0000-0000-0000-000000000003';

-- 1. Anonymous Access Denials
set local role anon;
do $$ begin
  if (select count(*) from public.waste_batches) <> 0 then raise exception 'anonymous read leaked batches'; end if;
  if (select count(*) from public.batch_stage_history) <> 0 then raise exception 'anonymous read leaked stage history'; end if;
  begin
    perform public.create_waste_batch('mango_peel', null, 5, current_date, null, null, null, 0, 'anon test');
    raise exception 'anonymous batch creation succeeded';
  exception when insufficient_privilege then null; end;
  insert into b3_results values ('anonymous_read_write_denied', 'PASS');
end $$;
reset role;

-- 2. Viewer Role: Read allowed, Mutation denied
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
do $$ begin
  -- Viewer can read sources and stages
  if (select count(*) from public.waste_sources) < 1 then raise exception 'viewer failed to read waste sources'; end if;
  if (select count(*) from public.processing_stages) <> 9 then raise exception 'viewer failed to read processing stages'; end if;

  -- Viewer cannot create waste batch
  begin
    perform public.create_waste_batch('mango_peel', null, 5, current_date, null, null, null, 0, 'viewer forbidden');
    raise exception 'viewer batch creation succeeded';
  exception when insufficient_privilege then null; end;

  insert into b3_results values ('viewer_read_allowed_write_denied', 'PASS');
end $$;
reset role;

-- 3. Operator Role: Create, Code Generation, Detail, Update, Sequential Stage Advancement, History
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
do $$
declare
  v_source_id uuid;
  v_batch public.waste_batches;
  v_updated public.waste_batches;
  v_history_count integer;
begin
  select id into v_source_id from public.waste_sources limit 1;

  -- Validation: Reject zero/negative weight
  begin
    perform public.create_waste_batch('mango_peel', v_source_id, 0, current_date, null, null, null, 0, 'bad weight');
    raise exception 'zero weight succeeded';
  exception when numeric_value_out_of_range then null; end;

  -- Validation: Reject future collection date
  begin
    perform public.create_waste_batch('mango_peel', v_source_id, 10, current_date + 1, null, null, null, 0, 'future date');
    raise exception 'future date succeeded';
  exception when datetime_field_overflow then null; end;

  -- Create Batch successfully
  v_batch := public.create_waste_batch(
    'mango_peel',
    v_source_id,
    15.5,
    current_date,
    'Orchard Row 4',
    'good',
    'dry',
    1,
    'B3 Runtime Test Batch Intake'
  );

  if v_batch.batch_code not like 'MW-%' then
    raise exception 'invalid generated batch code: %', v_batch.batch_code;
  end if;

  if v_batch.current_status <> 'collected' then
    raise exception 'initial status is not collected';
  end if;

  -- Check initial history entry
  select count(*) into v_history_count from public.batch_stage_history where batch_id = v_batch.id;
  if v_history_count <> 1 then
    raise exception 'expected 1 initial history record, found %', v_history_count;
  end if;

  -- Permitted update
  update public.waste_batches
  set notes = 'Updated notes by operator',
      visual_condition = 'moderate',
      storage_duration_days = 2
  where id = v_batch.id
  returning * into v_updated;

  if v_updated.notes <> 'Updated notes by operator' then
    raise exception 'permitted update failed';
  end if;

  -- Sequential Stage Advancement: collected -> sorted -> washed -> dried -> ground -> extraction -> production -> laboratory_testing -> completed
  v_batch := public.advance_waste_batch_stage(v_batch.id, 'Sorted and inspected');
  if v_batch.current_status <> 'sorted' then raise exception 'stage did not advance to sorted'; end if;

  v_batch := public.advance_waste_batch_stage(v_batch.id, 'Washed with clean water');
  if v_batch.current_status <> 'washed' then raise exception 'stage did not advance to washed'; end if;

  v_batch := public.advance_waste_batch_stage(v_batch.id, 'Dried in moisture chamber');
  if v_batch.current_status <> 'dried' then raise exception 'stage did not advance to dried'; end if;

  v_batch := public.advance_waste_batch_stage(v_batch.id, 'Milled into powder');
  if v_batch.current_status <> 'ground' then raise exception 'stage did not advance to ground'; end if;

  v_batch := public.advance_waste_batch_stage(v_batch.id, 'Supercritical extraction performed');
  if v_batch.current_status <> 'extraction' then raise exception 'stage did not advance to extraction'; end if;

  v_batch := public.advance_waste_batch_stage(v_batch.id, 'Formulated in production line');
  if v_batch.current_status <> 'production' then raise exception 'stage did not advance to production'; end if;

  v_batch := public.advance_waste_batch_stage(v_batch.id, 'Assays sent for lab testing');
  if v_batch.current_status <> 'laboratory_testing' then raise exception 'stage did not advance to laboratory_testing'; end if;

  v_batch := public.advance_waste_batch_stage(v_batch.id, 'Process fully completed');
  if v_batch.current_status <> 'completed' then raise exception 'stage did not advance to completed'; end if;

  -- Total history entries: initial (1) + 8 transitions = 9 entries
  select count(*) into v_history_count from public.batch_stage_history where batch_id = v_batch.id;
  if v_history_count <> 9 then
    raise exception 'expected 9 history entries, found %', v_history_count;
  end if;

  -- Cannot advance completed batch
  begin
    perform public.advance_waste_batch_stage(v_batch.id, 'Try advance completed');
    raise exception 'advancing completed batch unexpectedly succeeded';
  exception when invalid_parameter_value then null; end;

  insert into b3_results values ('operator_full_lifecycle_and_history', 'PASS');
end $$;
reset role;

-- 4. Rejection Workflow
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
do $$
declare
  v_batch public.waste_batches;
  v_history_count integer;
begin
  -- Create another batch to test rejection
  v_batch := public.create_waste_batch('mango_seed', null, 8, current_date, null, 'poor', 'high', 3, 'Contaminated seed lot');

  -- Validation: Rejection requires a reason
  begin
    perform public.reject_waste_batch(v_batch.id, '', null);
    raise exception 'empty rejection reason succeeded';
  exception when invalid_parameter_value then null; end;

  -- Reject batch
  v_batch := public.reject_waste_batch(v_batch.id, 'Excessive spoilage and foreign debris', 'Discarded safely');
  if v_batch.current_status <> 'rejected' then
    raise exception 'status did not change to rejected';
  end if;

  -- Cannot advance rejected batch
  begin
    perform public.advance_waste_batch_stage(v_batch.id, 'Try advance rejected');
    raise exception 'advancing rejected batch unexpectedly succeeded';
  exception when invalid_parameter_value then null; end;

  -- Cannot reject already rejected batch
  begin
    perform public.reject_waste_batch(v_batch.id, 'Reject again', null);
    raise exception 'double rejection unexpectedly succeeded';
  exception when invalid_parameter_value then null; end;

  insert into b3_results values ('rejection_workflow_and_terminal_state', 'PASS');
end $$;
reset role;

select test, result from b3_results order by test;
rollback;
