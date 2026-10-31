-- Deployed as Supabase migration fp_review_submissions_v1, 31 Oct 2026.
-- Signed-in users can read, submit and revoke ONLY their own opt-in text reviews.
-- The daily ChatGPT editorial automation reviews only consent=true and due submissions.
create table if not exists public.fp_review_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  task_id text not null check (length(task_id) between 6 and 140),
  task_date date not null,
  kind text not null check (kind in ('market','research','learning')),
  task_title text not null check (length(task_title) between 5 and 250),
  question text not null check (length(question) between 15 and 2500),
  rubric jsonb not null default '[]'::jsonb check (jsonb_typeof(rubric)='array'),
  answer text not null check (length(trim(answer)) between 60 and 5000),
  consent boolean not null default false check (consent is true),
  created_at timestamptz not null default now(),
  eligible_after date not null default (((now() at time zone 'Europe/Berlin')::date)+1),
  status text not null default 'pending' check (status in ('pending','reviewed','failed')),
  feedback jsonb check (feedback is null or jsonb_typeof(feedback)='object'),
  reviewed_at timestamptz,
  unique(user_id,task_id)
);
create index if not exists fp_review_submissions_due on public.fp_review_submissions(eligible_after,created_at) where status='pending' and consent;
create index if not exists fp_review_submissions_owner on public.fp_review_submissions(user_id,created_at desc);
alter table public.fp_review_submissions enable row level security;
revoke all on table public.fp_review_submissions from public,anon,authenticated;
grant select,delete on table public.fp_review_submissions to authenticated;
grant insert(task_id,task_date,kind,task_title,question,rubric,answer,consent) on table public.fp_review_submissions to authenticated;
drop policy if exists fp_review_owner_read on public.fp_review_submissions;
create policy fp_review_owner_read on public.fp_review_submissions for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists fp_review_owner_submit on public.fp_review_submissions;
create policy fp_review_owner_submit on public.fp_review_submissions for insert to authenticated with check ((select auth.uid())=user_id and consent is true and status='pending' and feedback is null and reviewed_at is null);
drop policy if exists fp_review_owner_delete on public.fp_review_submissions;
create policy fp_review_owner_delete on public.fp_review_submissions for delete to authenticated using ((select auth.uid())=user_id);
