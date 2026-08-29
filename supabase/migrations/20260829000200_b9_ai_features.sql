-- MangoCycle B9: AI Features RLS policies update
-- Allow viewer+ to insert and view their own AI analysis/insight records.

drop policy if exists ai_analysis_records_insert on public.ai_analysis_records;
drop policy if exists ai_analysis_records_select_own on public.ai_analysis_records;

create policy ai_analysis_records_insert on public.ai_analysis_records
for insert to authenticated
with check (
  public.has_minimum_role('viewer')
  and (requested_by is null or requested_by = auth.uid())
);

create policy ai_analysis_records_select_own on public.ai_analysis_records
for select to authenticated
using (
  public.has_minimum_role('viewer')
  and requested_by = auth.uid()
);
