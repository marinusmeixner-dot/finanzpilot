-- v41: A verified promotion makes the independent login streak pay a slightly larger daily reward (+2 virtual EUR and +1 research point per rank). The 10/20/30 milestone bonus remains unchanged. No retroactive top-ups.
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
 v_promotion_count integer:=0;
 v_bonus_euros integer:=0;
 v_bonus_points integer:=0;
 v_days jsonb;
begin
 if v_user is null then raise exception 'Anmeldung für virtuelle Tagesbelohnungen erforderlich.' using errcode='28000';end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text,47));
 select coalesce(promotion_count,0) into v_promotion_count from public.fp_specialization_profiles where user_id=v_user;
 v_bonus_euros:=least(7,coalesce(v_promotion_count,0))*200;
 v_bonus_points:=least(7,coalesce(v_promotion_count,0));
 v_euros:=1000+v_bonus_euros;
 v_points:=1+v_bonus_points;
 select day_number into v_day from public.fp_streak_days
 where user_id=v_user and checkin_date=v_today;
 if not found then
  select day_number into v_prev from public.fp_streak_days
   where user_id=v_user and checkin_date=v_today-1;
  v_day:=least(30,coalesce(v_prev,0)+1);
  -- Milestone reward only on the FIRST day that reaches a threshold.
  if v_day=10 and coalesce(v_prev,0)<10 then v_milestone:=10;v_euros:=11000+v_bonus_euros;v_points:=16+v_bonus_points;
  elsif v_day=20 and coalesce(v_prev,0)<20 then v_milestone:=20;v_euros:=13500+v_bonus_euros;v_points:=21+v_bonus_points;
  elsif v_day=30 and coalesce(v_prev,0)<30 then v_milestone:=30;v_euros:=16000+v_bonus_euros;v_points:=31+v_bonus_points;
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
 'max_days',30,'promotion_count',v_promotion_count,'daily_euro_bonus',v_bonus_euros::numeric/100,'daily_points_bonus',v_bonus_points,'next_milestone',case when v_day<10 then 10 when v_day<20 then 20 when v_day<30 then 30 else null end);
end $$;

