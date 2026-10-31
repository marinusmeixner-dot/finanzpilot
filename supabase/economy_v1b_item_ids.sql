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
   v_artifact := case p_module when 'kion-nachfrage' then 'industry-spark' when 'aixtron-auftraege' then 'silicon-lens' else 'cloud-compass' end;
   insert into public.fp_reward_claims(user_id,module_id,item_id) values(v_user,p_module,v_artifact) on conflict do nothing;
 end if;
 return jsonb_build_object('correct',v_correct,'verified',v_count,'mastered',v_count=4,'newReward',v_new_id is not null);
end;
$$;

-- KION full research artifact stays separately gated; this is the 4/4 practice reward.
