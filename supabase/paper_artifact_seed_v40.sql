-- Update the artifact cash credit helper for the new EUR 1,000 wallet.
CREATE OR REPLACE FUNCTION public.fp_paper_claim_artifact_rewards()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_user uuid:=(select auth.uid());
 v_new int:=0;
 v_amount numeric(20,2):=0;
 v_balance numeric(20,2);
begin
 if v_user is null then raise exception 'Login erforderlich';end if;
 insert into public.fp_paper_wallets(user_id,currency,balance,starting_balance)
 values(v_user,'EUR',1000,1000) on conflict(user_id,currency) do nothing;
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
end $function$
;
