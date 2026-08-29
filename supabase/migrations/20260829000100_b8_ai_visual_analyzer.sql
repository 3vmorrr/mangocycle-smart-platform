-- MangoCycle B8: AI Waste Visual Analysis RLS policies.

create policy ai_analysis_records_insert on public.ai_analysis_records
for insert to authenticated
with check (
  public.has_minimum_role('operator')
  and (requested_by is null or requested_by = auth.uid())
);

create policy ai_analysis_records_select_own on public.ai_analysis_records
for select to authenticated
using (
  public.has_minimum_role('operator')
  and requested_by = auth.uid()
);
