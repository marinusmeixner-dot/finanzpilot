-- FinanzPilot secure economy v1 (2026-10-31)
-- Every grant and reward is owned by auth.uid(); browser-supplied balances are never trusted.
begin;

create table if not exists public.fp_economy_accounts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 research_points integer not null default 0 check(research_points >= 0),
 virtual_euro_cents bigint not null default 0 check(virtual_euro_cents >= 0),
 updated_at timestamptz not null default now()
);
create table if not exists public.fp_verified_training (
 user_id uuid not null references auth.users(id) on delete cascade,
 module_id text not null check(module_id in ('kion-nachfrage','aixtron-auftraege','alphabet-cloud')),
 step_index integer not null check(step_index between 1 and 4),
 verified_at timestamptz not null default now(),
 primary key(user_id,module_id,step_index)
);
create table if not exists public.fp_reward_claims (
 user_id uuid not null references auth.users(id) on delete cascade,
 module_id text not null check(module_id in ('kion-nachfrage','aixtron-auftraege','alphabet-cloud')),
 item_id text not null,
 earned_at timestamptz not null default now(),
 choice text check(choice in ('tool','path','cash')),
 redeemed_at timestamptz,
 primary key(user_id,module_id),
 check ((choice is null and redeemed_at is null) or (choice is not null and redeemed_at is not null))
);
create table if not exists public.fp_reward_perks (
 user_id uuid not null references auth.users(id) on delete cascade,
 perk_key text not null,
 granted_at timestamptz not null default now(),
 primary key(user_id,perk_key)
);
create table if not exists public.fp_reward_ledger (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 event_key text not null,
 event_type text not null check(event_type in ('module_mastery','item_redemption','points_purchase')),
 points_delta integer not null default 0,
 euro_cents_delta bigint not null default 0,
 created_at timestamptz not null default now(),
 unique(user_id,event_key)
);
create index if not exists fp_reward_ledger_owner_date on public.fp_reward_ledger(user_id,created_at desc);
create index if not exists fp_verified_training_owner on public.fp_verified_training(user_id,module_id);

alter table public.fp_economy_accounts enable row level security;
alter table public.fp_verified_training enable row level security;
alter table public.fp_reward_claims enable row level security;
alter table public.fp_reward_perks enable row level security;
alter table public.fp_reward_ledger enable row level security;
-- No mutations through the browser Data API. Only tightly-scoped RPCs below write.
revoke all on table
 public.fp_economy_accounts,
 public.fp_verified_training,
 public.fp_reward_claims,
 public.fp_reward_perks,
 public.fp_reward_ledger
from PUBLIC,anon,authenticated;
grant select on table
 public.fp_economy_accounts,
 public.fp_verified_training,
 public.fp_reward_claims,
 public.fp_reward_perks,
 public.fp_reward_ledger
to authenticated;
create policy fp_economy_own on public.fp_economy_accounts for select to authenticated using ((select auth.uid())=user_id);
create policy fp_training_own on public.fp_verified_training for select to authenticated using ((select auth.uid())=user_id);
create policy fp_claims_own on public.fp_reward_claims for select to authenticated using ((select auth.uid())=user_id);
create policy fp_perks_own on public.fp_reward_perks for select to authenticated using ((select auth.uid())=user_id);
create policy fp_ledger_own on public.fp_reward_ledger for select to authenticated using ((select auth.uid())=user_id);

create or replace function public.fp_submit_training_answer(
 p_module text, p_step integer, p_answer jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 v_user uuid := auth.uid();
 v_correct boolean := false;
 v_count integer := 0;
 v_new_id bigint;
 v_artifact text;
begin
 if v_user is null then raise exception 'Anmeldung erforderlich' using errcode='28000'; end if;
 if p_module not in ('kion-nachfrage','aixtron-auftraege','alphabet-cloud') or p_step not between 1 and 4 then
   raise exception 'Unbekannte Kursaufgabe' using errcode='22023';
 end if;
 if p_answer is null or length(p_answer::text)>250 then
   raise exception 'Antwortformat ungültig' using errcode='22023';
 end if;
 -- Static public lesson answer key, verified server-side. No caller-supplied score.
 if p_step=1 then
   if jsonb_typeof(p_answer)='number' then
     v_correct := case p_module
       when 'kion-nachfrage' then abs((p_answer #>> '{}')::numeric - (-4.9))<=0.15
       when 'aixtron-auftraege' then abs((p_answer #>> '{}')::numeric - 121.7)<=0.15
       when 'alphabet-cloud' then abs((p_answer #>> '{}')::numeric - 24.1)<=0.15
       else false end;
   end if;
 elsif p_step=2 then
   if jsonb_typeof(p_answer)='array' and jsonb_array_length(p_answer)=2 then
     v_correct := case p_module
       when 'aixtron-auftraege' then p_answer @> '[1,3]'::jsonb
       else p_answer @> '[0,2]'::jsonb end;
   end if;
 elsif p_step=3 then
   v_correct := p_answer = case p_module
     when 'kion-nachfrage' then '[3,1,2,0]'::jsonb
     when 'aixtron-auftraege' then '[1,3,0,2]'::jsonb
     else '[2,3,1,0]'::jsonb end;
 elsif p_step=4 then
   v_correct := p_answer = case p_module
     when 'kion-nachfrage' then '2'::jsonb
     when 'aixtron-auftraege' then '1'::jsonb
     else '1'::jsonb end;
 end if;
 -- Serialize per user before counting evidence or minting anything.
 insert into public.fp_economy_accounts(user_id) values(v_user) on conflict do nothing;
 perform 1 from public.fp_economy_accounts where user_id=v_user for update;
 if v_correct then
   insert into public.fp_verified_training(user_id,module_id,step_index) values(v_user,p_module,p_step) on conflict do nothing;
 end if;
 select count(*) into v_count from public.fp_verified_training where user_id=v_user and module_id=p_module;
 if v_count=4 then
   insert into public.fp_reward_ledger(user_id,event_key,event_type,points_delta)
     values(v_user,'mastery:'||p_module,'module_mastery',100)
     on conflict(user_id,event_key) do nothing returning id into v_new_id;
   if v_new_id is not null then
     update public.fp_economy_accounts set research_points=research_points+100,updated_at=now() where user_id=v_user;
   end if;
   v_artifact := case p_module when 'kion-nachfrage' then 'industry-core' when 'aixtron-auftraege' then 'silicon-lens' else 'cloud-compass' end;
   insert into public.fp_reward_claims(user_id,module_id,item_id) values(v_user,p_module,v_artifact) on conflict do nothing;
 end if;
 return jsonb_build_object('correct',v_correct,'verified',v_count,'mastered',v_count=4,'newReward',v_new_id is not null);
end;
$$;
revoke all on function public.fp_submit_training_answer(text,integer,jsonb) from PUBLIC,anon;
grant execute on function public.fp_submit_training_answer(text,integer,jsonb) to authenticated;

create or replace function public.fp_redeem_artifact(
 p_module text,p_choice text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_user uuid := auth.uid();
 v_item text;
 v_perk text;
 v_credit bigint := 0;
begin
 if v_user is null then raise exception 'Anmeldung erforderlich' using errcode='28000'; end if;
 if p_module not in ('kion-nachfrage','aixtron-auftraege','alphabet-cloud') or p_choice not in ('tool','path','cash') then
   raise exception 'Ungültiger Gegenstand oder Verwendung' using errcode='22023';
 end if;
 perform 1 from public.fp_economy_accounts where user_id=v_user for update;
 update public.fp_reward_claims set choice=p_choice,redeemed_at=now()
   where user_id=v_user and module_id=p_module and choice is null
   returning item_id into v_item;
 if v_item is null then raise exception 'Gegenstand fehlt oder wurde bereits eingelöst' using errcode='22023'; end if;
 if p_choice='cash' then
   v_credit := 15000;
   update public.fp_economy_accounts set virtual_euro_cents=virtual_euro_cents+v_credit,updated_at=now() where user_id=v_user;
 else
   v_perk := p_choice||':'||p_module;
   insert into public.fp_reward_perks(user_id,perk_key) values(v_user,v_perk) on conflict do nothing;
 end if;
 insert into public.fp_reward_ledger(user_id,event_key,event_type,euro_cents_delta)
   values(v_user,'redeem:'||p_module,'item_redemption',v_credit);
 return jsonb_build_object('success',true,'choice',p_choice,'item',v_item,'euroCentsGranted',v_credit,'perk',v_perk);
end;
$$;
revoke all on function public.fp_redeem_artifact(text,text) from PUBLIC,anon;
grant execute on function public.fp_redeem_artifact(text,text) to authenticated;

create or replace function public.fp_purchase_reward(
 p_perk text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_user uuid := auth.uid();
 v_cost integer;
begin
 if v_user is null then raise exception 'Anmeldung erforderlich' using errcode='28000'; end if;
 v_cost := case p_perk
   when 'theme:mint' then 150
   when 'theme:gold' then 200
   else null end;
 if v_cost is null then raise exception 'Unbekannter Gegenstand' using errcode='22023'; end if;
 perform 1 from public.fp_economy_accounts where user_id=v_user for update;
 if exists(select 1 from public.fp_reward_perks where user_id=v_user and perk_key=p_perk) then
   raise exception 'Bereits freigeschaltet' using errcode='22023';
 end if;
 update public.fp_economy_accounts set research_points=research_points-v_cost,updated_at=now()
   where user_id=v_user and research_points>=v_cost;
 if not found then raise exception 'Nicht genug Forschungspunkte' using errcode='22023'; end if;
 insert into public.fp_reward_perks(user_id,perk_key) values(v_user,p_perk);
 insert into public.fp_reward_ledger(user_id,event_key,event_type,points_delta)
   values(v_user,'purchase:'||p_perk,'points_purchase',-v_cost);
 return jsonb_build_object('success',true,'perk',p_perk,'cost',v_cost);
end;
$$;
revoke all on function public.fp_purchase_reward(text) from PUBLIC,anon;
grant execute on function public.fp_purchase_reward(text) to authenticated;
commit;
