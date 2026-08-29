-- MangoCycle B2: active-profile role resolution, controlled user management,
-- and least-privilege baseline RLS. No B3+ workflow implementation is included.

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles as p
  where p.id = auth.uid()
    and p.is_active = true
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles as p
    where p.id = auth.uid() and p.is_active = true
  )
$$;

create or replace function public.has_minimum_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case public.current_user_role()
    when 'super_admin' then 5
    when 'admin' then 4
    when 'researcher' then 3
    when 'operator' then 2
    when 'viewer' then 1
    else 0
  end >= case required_role
    when 'super_admin' then 5
    when 'admin' then 4
    when 'researcher' then 3
    when 'operator' then 2
    when 'viewer' then 1
    else 2147483647
  end
$$;

revoke all on function public.current_user_role() from public, anon;
revoke all on function public.is_active_user() from public, anon;
revoke all on function public.has_minimum_role(text) from public, anon;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.has_minimum_role(text) to authenticated;

create or replace function public.manage_profile(
  p_target_id uuid,
  p_full_name text default null,
  p_role text default null,
  p_is_active boolean default null
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
  target_before public.profiles;
  target_after public.profiles;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into actor from public.profiles where id = auth.uid() for update;
  if actor.id is null or not actor.is_active or actor.role not in ('admin', 'super_admin') then
    raise exception 'active administrator required' using errcode = '42501';
  end if;

  select * into target_before from public.profiles where id = p_target_id for update;
  if target_before.id is null then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;

  if actor.id = target_before.id and (
    (p_role is not null and p_role is distinct from target_before.role) or
    (p_is_active is not null and p_is_active is distinct from target_before.is_active)
  ) then
    raise exception 'users cannot change their own role or active state' using errcode = '42501';
  end if;

  if actor.role = 'admin' and (
    target_before.role = 'super_admin' or p_role = 'super_admin'
  ) then
    raise exception 'only a super admin may manage super admins' using errcode = '42501';
  end if;

  if p_role is not null and p_role not in ('super_admin', 'admin', 'researcher', 'operator', 'viewer') then
    raise exception 'invalid role' using errcode = '22023';
  end if;

  update public.profiles
  set full_name = coalesce(p_full_name, full_name),
      role = coalesce(p_role, role),
      is_active = coalesce(p_is_active, is_active)
  where id = p_target_id
  returning * into target_after;

  if target_after.role is distinct from target_before.role then
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, before_value, after_value)
    values (
      actor.id, 'user.role_changed', 'profile', target_after.id,
      jsonb_build_object('role', target_before.role),
      jsonb_build_object('role', target_after.role)
    );
  end if;

  if target_before.is_active and not target_after.is_active then
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, before_value, after_value)
    values (
      actor.id, 'user.deactivated', 'profile', target_after.id,
      jsonb_build_object('is_active', true),
      jsonb_build_object('is_active', false)
    );
  end if;

  return target_after;
end;
$$;

revoke all on function public.manage_profile(uuid, text, text, boolean) from public, anon;
grant execute on function public.manage_profile(uuid, text, text, boolean) to authenticated;

-- Profiles: self-read is retained even for inactive users so the server can
-- distinguish deactivation from a missing profile. Directory access is admin+.
create policy profiles_select_self_or_admin on public.profiles
for select to authenticated
using (id = auth.uid() or public.has_minimum_role('admin'));

-- Administrative profile mutation is intentionally RPC-only. No direct INSERT,
-- UPDATE, or DELETE policy exists for authenticated clients.

create policy waste_sources_select on public.waste_sources for select to authenticated
using (public.has_minimum_role('viewer'));
create policy waste_sources_insert on public.waste_sources for insert to authenticated
with check (public.has_minimum_role('admin'));
create policy waste_sources_update on public.waste_sources for update to authenticated
using (public.has_minimum_role('admin')) with check (public.has_minimum_role('admin'));
create policy waste_sources_delete on public.waste_sources for delete to authenticated
using (public.has_minimum_role('admin'));

create policy waste_batches_select on public.waste_batches for select to authenticated
using (public.has_minimum_role('viewer'));
create policy waste_batches_insert on public.waste_batches for insert to authenticated
with check (public.has_minimum_role('operator') and created_by = auth.uid());
create policy waste_batches_update on public.waste_batches for update to authenticated
using (public.has_minimum_role('operator')) with check (public.has_minimum_role('operator'));
create policy waste_batches_delete on public.waste_batches for delete to authenticated
using (public.has_minimum_role('admin'));

create policy processing_stages_select on public.processing_stages for select to authenticated
using (public.has_minimum_role('viewer'));
create policy processing_stages_insert on public.processing_stages for insert to authenticated
with check (public.has_minimum_role('admin'));
create policy processing_stages_update on public.processing_stages for update to authenticated
using (public.has_minimum_role('admin')) with check (public.has_minimum_role('admin'));
create policy processing_stages_delete on public.processing_stages for delete to authenticated
using (public.has_minimum_role('admin'));

create policy batch_stage_history_select on public.batch_stage_history for select to authenticated
using (public.has_minimum_role('viewer'));
create policy batch_stage_history_insert on public.batch_stage_history for insert to authenticated
with check (public.has_minimum_role('operator') and performed_by = auth.uid());

create policy product_batches_select on public.product_batches for select to authenticated
using (public.has_minimum_role('viewer'));
create policy product_batches_insert on public.product_batches for insert to authenticated
with check (public.has_minimum_role('researcher') and created_by = auth.uid());
create policy product_batches_update on public.product_batches for update to authenticated
using (public.has_minimum_role('researcher')) with check (public.has_minimum_role('researcher'));
create policy product_batches_delete on public.product_batches for delete to authenticated
using (public.has_minimum_role('admin'));

create policy product_waste_links_select on public.product_waste_links for select to authenticated
using (public.has_minimum_role('viewer'));
create policy product_waste_links_insert on public.product_waste_links for insert to authenticated
with check (public.has_minimum_role('researcher'));
create policy product_waste_links_delete on public.product_waste_links for delete to authenticated
using (public.has_minimum_role('researcher'));

create policy laboratory_tests_select on public.laboratory_tests for select to authenticated
using (public.has_minimum_role('viewer'));
create policy laboratory_tests_insert on public.laboratory_tests for insert to authenticated
with check (public.has_minimum_role('researcher') and created_by = auth.uid());
create policy laboratory_tests_update on public.laboratory_tests for update to authenticated
using (public.has_minimum_role('researcher')) with check (public.has_minimum_role('researcher'));
create policy laboratory_tests_delete on public.laboratory_tests for delete to authenticated
using (public.has_minimum_role('admin'));

-- Documentation conflict: 07 allows operator downloads while 08 requires
-- researcher+. The restrictive security-authority interpretation is applied.
create policy laboratory_attachments_select on public.laboratory_attachments for select to authenticated
using (public.has_minimum_role('researcher'));
create policy laboratory_attachments_insert on public.laboratory_attachments for insert to authenticated
with check (public.has_minimum_role('researcher') and uploaded_by = auth.uid());
create policy laboratory_attachments_delete on public.laboratory_attachments for delete to authenticated
using (public.has_minimum_role('admin'));

-- History access only; AI writes remain closed until their canonical phases add
-- validated server workflows.
create policy ai_analysis_records_select on public.ai_analysis_records for select to authenticated
using (public.has_minimum_role('researcher'));

create policy iot_devices_select on public.iot_devices for select to authenticated
using (public.has_minimum_role('viewer'));
create policy iot_weight_readings_select on public.iot_weight_readings for select to authenticated
using (public.has_minimum_role('viewer'));

-- Prevent authenticated PostgREST clients from selecting device credential hashes.
revoke select on public.iot_devices from authenticated;
grant select (id, device_code, name, location, is_active, last_seen_at, created_at, updated_at)
on public.iot_devices to authenticated;

create policy audit_logs_select on public.audit_logs for select to authenticated
using (public.has_minimum_role('admin'));

-- Settings may mix sensitive and non-sensitive keys. Until row classification is
-- defined, only Super Admin receives direct access.
create policy app_settings_select on public.app_settings for select to authenticated
using (public.has_minimum_role('super_admin'));
create policy app_settings_insert on public.app_settings for insert to authenticated
with check (public.has_minimum_role('super_admin') and updated_by = auth.uid());
create policy app_settings_update on public.app_settings for update to authenticated
using (public.has_minimum_role('super_admin'))
with check (public.has_minimum_role('super_admin') and updated_by = auth.uid());

