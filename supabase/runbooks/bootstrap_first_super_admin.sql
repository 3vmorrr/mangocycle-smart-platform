-- OPTION A OPERATOR RUNBOOK — HUMAN EXECUTION ONLY.
-- Run in the linked mangocycle-dev SQL Editor only after replacing the UUID.
-- Never use an email address as the promotion identity.
begin;

do $$
declare
  target_id uuid := '00000000-0000-0000-0000-000000000000'; -- REPLACE with immutable Auth UUID
  affected integer;
begin
  if target_id = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'Replace target_id with the verified Auth UUID before execution';
  end if;

  if exists (select 1 from public.profiles where role = 'super_admin') then
    raise exception 'A Super Admin already exists; use normal authorized management instead';
  end if;

  update public.profiles
  set role = 'super_admin'
  where id = target_id and role = 'viewer' and is_active = true;
  get diagnostics affected = row_count;

  if affected <> 1 then
    raise exception 'Expected exactly one active Viewer profile for the supplied UUID';
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, before_value, after_value)
  values (
    null, 'user.role_changed', 'profile', target_id,
    jsonb_build_object('role', 'viewer', 'bootstrap', 'option_a'),
    jsonb_build_object('role', 'super_admin', 'bootstrap', 'option_a')
  );
end;
$$;

select id, email, role, is_active
from public.profiles
where id = '00000000-0000-0000-0000-000000000000'::uuid; -- REPLACE with same UUID

-- Change COMMIT to ROLLBACK if the single verification row is not exact.
commit;
