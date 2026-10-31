create table if not exists public.fp_paper_artifact_credits(
 user_id uuid not null references auth.users(id) on delete cascade,
 module_id text not null,
 amount numeric(20,2) not null default 150.00 check(amount=150.00),
 credited_at timestamptz not null default now(),
 primary key(user_id,module_id)
);
alter table public.fp_paper_artifact_credits enable row level security;
revoke all on public.fp_paper_artifact_credits from public,anon,authenticated;
grant select on public.fp_paper_artifact_credits to authenticated;
drop policy if exists fp_paper_credits_owner_select on public.fp_paper_artifact_credits;
create policy fp_paper_credits_owner_select on public.fp_paper_artifact_credits for select to authenticated using(user_id=(select auth.uid()));
create or replace function public.fp_paper_claim_artifact_rewards()
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
 v_user uuid:=(select auth.uid());
 v_new int:=0;
 v_amount numeric(20,2):=0;
 v_balance numeric(20,2);
begin
 if v_user is null then raise exception 'Login erforderlich';end if;
 insert into public.fp_paper_wallets(user_id,currency,balance,starting_balance)
 values(v_user,'EUR',50000,50000) on conflict(user_id,currency) do nothing;
 perform 1 from public.fp_paper_wallets where user_id=v_user and currency='EUR' for update;
 with approved as(
  select c.module_id from public.fp_reward_claims c where c.user_id=v_user and c.choice='cash' and c.redeemed_at is not null
 ), added as(
  insert into public.fp_paper_artifact_credits(user_id,module_id,amount)
  select v_user,a.module_id,150.00 from approved a
  on conflict(user_id,module_id) do nothing
  returning amount
 )
 select count(*)::int,coalesce(sum(amount),0) into v_new,v_amount from added;
 if v_amount>0 then
  update public.fp_paper_wallets set balance=balance+v_amount
  where user_id=v_user and currency='EUR';
 end if;
 select balance into v_balance from public.fp_paper_wallets where user_id=v_user and currency='EUR';
 return jsonb_build_object('credits_added',v_new,'bonus_added_eur',v_amount,'eur_cash',v_balance);
end $$;
revoke all on function public.fp_paper_claim_artifact_rewards() from public,anon,authenticated;
grant execute on function public.fp_paper_claim_artifact_rewards() to authenticated;
