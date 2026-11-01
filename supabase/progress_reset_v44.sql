-- v44: a one-time, scoped progress-reset marker. Server owns timestamp.
create table if not exists public.fp_progress_reset_marks (
 user_id uuid primary key references auth.users(id) on delete cascade,
 reset_at timestamptz not null default now()
);
alter table public.fp_progress_reset_marks enable row level security;
revoke all on public.fp_progress_reset_marks from public,anon,authenticated;
grant select on public.fp_progress_reset_marks to authenticated;
drop policy if exists fp_progress_reset_owner on public.fp_progress_reset_marks;
create policy fp_progress_reset_owner on public.fp_progress_reset_marks for select to authenticated using (user_id=(select auth.uid()));
create table if not exists private.fp_progress_reset_backup (
 user_id uuid not null,
 backup_at timestamptz not null default now(),
 previous_progress jsonb not null,
 previous_research_points integer,
 primary key(user_id,backup_at)
);
alter table private.fp_progress_reset_backup enable row level security;
revoke all on private.fp_progress_reset_backup from public,anon,authenticated;
