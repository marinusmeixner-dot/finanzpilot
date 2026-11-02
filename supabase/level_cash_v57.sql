-- V57: small, one-time virtual-cash reward for every achieved level.
-- Keep historical XP, FP, existing ledger rows and skill costs untouched.
alter table public.fp_level_rewards_v55
 add column if not exists cash_reward numeric(12,2) not null default 0,
 add column if not exists cash_claimed boolean not null default false;
create or replace function public.fp_level_claim_v55()
returns jsonb
language plpgsql security definer set search_path to ''
as $function$
declare
 v_user uuid:=auth.uid();v_xp int:=0;v_level int:=1;v_level_i int;
 v_fp int;v_cash numeric(12,2);v_issued_cash numeric(12,2);v_cash_total numeric(12,2):=0;
 v_new int:=0;v_reward_points int:=0;v_levels jsonb:='[]'::jsonb;v_existing int:=0;
begin
 if v_user is null then raise exception 'Anmeldung erforderlich.' using errcode='28000';end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text,81));
 select coalesce(xp,0) into v_xp from public.fp_specialization_profiles where user_id=v_user;
 v_xp:=coalesce(v_xp,0);
 select coalesce(max(g.l),1) into v_level from generate_series(1,100) as g(l)
  where 100*(g.l-1)+10*(g.l-1)*(g.l-2)<=v_xp;
 for v_level_i in 2..v_level loop
  v_fp:=case when mod(v_level_i,10)=0 then 2 when mod(v_level_i,5)=0 then 1 else 0 end;
  -- Less common research currency; every level does unlock a small amount of paper EUR.
  v_cash:=case when mod(v_level_i,10)=0 then 12 when mod(v_level_i,5)=0 then 8 else 5 end;
  insert into public.fp_level_rewards_v55(user_id,level,points,cash_reward,cash_claimed)
   values(v_user,v_level_i,v_fp,v_cash,false) on conflict(user_id,level) do nothing;
  get diagnostics v_new=row_count;
  if v_new=1 then
   v_reward_points:=v_reward_points+v_fp;
   v_levels:=v_levels||jsonb_build_array(jsonb_build_object('level',v_level_i,'points',v_fp,'euros',v_cash));
  end if;
  -- Also give already-awarded levels their previously missing virtual-cash reward once.
  v_issued_cash:=0;
  update public.fp_level_rewards_v55
   set cash_reward=v_cash,cash_claimed=true
   where user_id=v_user and level=v_level_i and cash_claimed=false
   returning cash_reward into v_issued_cash;
  v_cash_total:=v_cash_total+coalesce(v_issued_cash,0);
 end loop;
 if v_reward_points>0 then
  insert into public.fp_economy_accounts(user_id,research_points,virtual_euro_cents)
  values(v_user,v_reward_points,0)
  on conflict(user_id) do update
   set research_points=public.fp_economy_accounts.research_points+excluded.research_points,updated_at=now();
 end if;
 if v_cash_total>0 then
  insert into public.fp_paper_wallets(user_id,currency,balance,starting_balance)
   values(v_user,'EUR',1000,1000) on conflict(user_id,currency) do nothing;
  update public.fp_paper_wallets set balance=balance+v_cash_total
   where user_id=v_user and currency='EUR';
 end if;
 select count(*) into v_existing from public.fp_foundation_rewards_v55 where user_id=v_user;
 return jsonb_build_object('ok',true,'xp',v_xp,'level',v_level,
  'next_xp',case when v_level>=100 then null else 100*v_level+10*v_level*(v_level-1) end,
  'level_points_awarded',v_reward_points,'level_euros_awarded',v_cash_total,
  'new_levels',v_levels,'foundation_completed',v_existing);
end $function$;
revoke execute on function public.fp_level_claim_v55() from public,anon;
grant execute on function public.fp_level_claim_v55() to authenticated;
