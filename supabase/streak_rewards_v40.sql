-- FinancePilot v40: authenticated daily app check-in, unified small rewards and 30-day cap.
-- All virtual cash bonuses use the SINGLE EUR wallet. No user-supplied date or reward amount.
create table if not exists public.fp_streak_days(
 user_id uuid not null references auth.users(id) on delete cascade,
 checkin_date date not null,
 day_number integer not null check(day_number between 1 and 30),
 euro_cents integer not null check(euro_cents between 0 and 100000),
 research_points integer not null check(research_points between 0 and 1000),
 milestone integer not null default 0 check(milestone in (0,10,20,30)),
 created_at timestamptz not null default now(),
 primary key(user_id,checkin_date)
);
create index if not exists fp_streak_days_by_date on public.fp_streak_days(user_id,checkin_date desc);
alter table public.fp_streak_days enable row level security;
revoke all on public.fp_streak_days from public,anon,authenticated;
grant select on public.fp_streak_days to authenticated;
drop policy if exists fp_streak_owner_select on public.fp_streak_days;
create policy fp_streak_owner_select on public.fp_streak_days for select to authenticated using(user_id=(select auth.uid()));

create or replace function public.fp_streak_checkin()
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
 v_user uuid:=(select auth.uid());
 v_today date:=(now() at time zone 'Europe/Berlin')::date;
 v_prev int:=0;
 v_day int:=0;
 v_euros integer:=1000; -- 10 EUR per day
 v_points integer:=1;
 v_milestone integer:=0;
 v_earned boolean:=false;
 v_cash numeric(20,2);
 v_rp integer;
 v_days jsonb;
begin
 if v_user is null then raise exception 'Anmeldung für virtuelle Tagesbelohnungen erforderlich.' using errcode='28000';end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text,47));
 select day_number into v_day from public.fp_streak_days
 where user_id=v_user and checkin_date=v_today;
 if not found then
  select day_number into v_prev from public.fp_streak_days
   where user_id=v_user and checkin_date=v_today-1;
  v_day:=least(30,coalesce(v_prev,0)+1);
  -- Milestone reward only on the FIRST day that reaches a threshold.
  if v_day=10 and coalesce(v_prev,0)<10 then v_milestone:=10;v_euros:=11000;v_points:=16;
  elsif v_day=20 and coalesce(v_prev,0)<20 then v_milestone:=20;v_euros:=13500;v_points:=21;
  elsif v_day=30 and coalesce(v_prev,0)<30 then v_milestone:=30;v_euros:=16000;v_points:=31;
  end if;
  insert into public.fp_streak_days(user_id,checkin_date,day_number,euro_cents,research_points,milestone)
    values(v_user,v_today,v_day,v_euros,v_points,v_milestone);
  insert into public.fp_economy_accounts(user_id,research_points,virtual_euro_cents)
    values(v_user,v_points,0)
  on conflict(user_id) do update
   set research_points=public.fp_economy_accounts.research_points+excluded.research_points,updated_at=now();
  insert into public.fp_paper_wallets(user_id,currency,balance,starting_balance)
    values(v_user,'EUR',1000,1000)
  on conflict(user_id,currency) do nothing;
  update public.fp_paper_wallets set balance=balance+v_euros::numeric/100
    where user_id=v_user and currency='EUR';
  v_earned:=true;
 else
  select euro_cents,research_points,milestone into v_euros,v_points,v_milestone
   from public.fp_streak_days where user_id=v_user and checkin_date=v_today;
 end if;
 select balance into v_cash from public.fp_paper_wallets where user_id=v_user and currency='EUR';
 select research_points into v_rp from public.fp_economy_accounts where user_id=v_user;
 select coalesce(jsonb_agg(jsonb_build_object('date',d.checkin_date,'day',d.day_number,'euros',d.euro_cents::numeric/100,
  'points',d.research_points,'milestone',d.milestone) order by d.checkin_date desc),'[]'::jsonb)
 into v_days from (select checkin_date,day_number,euro_cents,research_points,milestone
 from public.fp_streak_days where user_id=v_user order by checkin_date desc limit 30) d;
 return jsonb_build_object('day',v_day,'today',v_today,'awarded_now',v_earned,'today_euros',v_euros::numeric/100,
 'today_points',v_points,'milestone',v_milestone,'eur_cash',v_cash,'research_total',v_rp,'recent',v_days,
 'max_days',30,'next_milestone',case when v_day<10 then 10 when v_day<20 then 20 when v_day<30 then 30 else null end);
end $$;
revoke all on function public.fp_streak_checkin() from public,anon,authenticated;
grant execute on function public.fp_streak_checkin() to authenticated;
comment on function public.fp_streak_checkin() is
'Once per Europe/Berlin calendar day per authenticated user. Daily app visit +10 EUR paper cash +1 research point; milestone 10/20/30 pays larger rewards; cap 30; server idempotent.';
