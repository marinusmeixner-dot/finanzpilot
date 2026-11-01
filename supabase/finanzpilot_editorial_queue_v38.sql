-- FinanzPilot v38: private, event-driven editorial queue.
-- Never store user identifiers or raw free-text answers in a public GitHub issue.
create table if not exists private.fp_editorial_queue (
 id bigint generated always as identity primary key,
 kind text not null check (kind in ('watchlist_added','review_submitted')),
 symbol text,
 submission_id uuid,
 review_eligible_after date,
 status text not null default 'pending' check (status in ('pending','in_progress','waiting','completed','failed')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 completed_at timestamptz,
 note text,
 check (
  (kind='watchlist_added' and symbol is not null and submission_id is null)
  or (kind='review_submitted' and submission_id is not null and symbol is null)
 )
);
create unique index if not exists fp_editorial_watch_pending_unique
 on private.fp_editorial_queue(symbol)
 where kind='watchlist_added' and status in ('pending','in_progress','waiting');
create unique index if not exists fp_editorial_review_once
 on private.fp_editorial_queue(submission_id) where kind='review_submitted';
create index if not exists fp_editorial_queue_status_time
 on private.fp_editorial_queue(status,created_at);
alter table private.fp_editorial_queue enable row level security;
revoke all on private.fp_editorial_queue from public, anon, authenticated;
revoke all on sequence private.fp_editorial_queue_id_seq from public, anon, authenticated;

create or replace function private.fp_queue_watchlist_add()
returns trigger language plpgsql security definer
set search_path=''
as $$
begin
 insert into private.fp_editorial_queue(kind,symbol)
 values('watchlist_added', upper(new.symbol))
 on conflict do nothing;
 return new;
end;
$$;
revoke all on function private.fp_queue_watchlist_add() from public,anon,authenticated;
drop trigger if exists fp_watchlist_after_insert_queue on public.fp_paper_watchlist;
create trigger fp_watchlist_after_insert_queue after insert on public.fp_paper_watchlist
for each row execute function private.fp_queue_watchlist_add();

create or replace function private.fp_queue_review_submission()
returns trigger language plpgsql security definer
set search_path=''
as $$
begin
 if new.consent is true and new.status='pending' then
  insert into private.fp_editorial_queue(kind,submission_id,review_eligible_after)
  values('review_submitted',new.id,new.eligible_after)
  on conflict do nothing;
 end if;
 return new;
end;
$$;
revoke all on function private.fp_queue_review_submission() from public,anon,authenticated;
drop trigger if exists fp_review_after_insert_queue on public.fp_review_submissions;
create trigger fp_review_after_insert_queue after insert on public.fp_review_submissions
for each row execute function private.fp_queue_review_submission();

-- On first installation include existing, still-watchlisted symbols,
-- not personal data. Existing reviewed submissions need no backfill.
insert into private.fp_editorial_queue(kind,symbol)
select 'watchlist_added',upper(symbol)
from public.fp_paper_watchlist
group by upper(symbol)
on conflict do nothing;

comment on table private.fp_editorial_queue is
'Editor-only event inbox. Watchlist event contains stock ticker only; review event has private submission UUID, never free-text or owner ID. Not exposed to client Data API.';
