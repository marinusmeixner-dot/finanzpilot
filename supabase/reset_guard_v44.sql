-- v44: older cached app builds must not revive a user-requested reset.
create or replace function public.fp_guard_progress_reset() returns trigger
language plpgsql security definer set search_path='' as $$
declare stamp timestamptz;
begin
 select reset_at into stamp from public.fp_progress_reset_marks where user_id=new.user_id;
 if stamp is not null and (new.progress_data->>'__reset_confirmed')::timestamptz is distinct from stamp then
  raise exception 'Dein Lernstand wurde zurückgesetzt. Bitte die neueste FinanzPilot-Version öffnen.' using errcode='22023';
 end if;
 return new;
end $$;
drop trigger if exists fp_guard_progress_reset_trigger on public.finanzpilot_progress;
create trigger fp_guard_progress_reset_trigger before insert or update of progress_data on public.finanzpilot_progress
for each row execute function public.fp_guard_progress_reset();
