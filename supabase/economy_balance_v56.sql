-- FinanzPilot V56 – balanced XP and scarce FP, server authoritative.
-- Historical ledgers and balances stay intact, no retroactive deductions.
-- Foundation XP per stage 8/10/12/14/16/18; stage finale earns one FP.
-- Skill depth 1-5: cost 3/5/7/9/11 FP, earn 1/2/3/4/5 after verified completion.
-- Daily 1 FP, reviews 1 FP, weekly cases 3 FP.
-- Streak base EUR only; every seventh day earns one FP, days 10/20/30 earn 2/3/4 FP.
-- Level XP grows quadratically: 100*(L-1)+10*(L-1)*(L-2); +1 FP only each fifth, +2 each tenth.
-- Every genuine third-skill promotion: +2 FP, existing two artifact shards and cash bonus.
WITH RECURSIVE skill_depth AS (
 SELECT id,1 AS depth FROM public.fp_specialization_catalog WHERE parent_id IS NULL
 UNION ALL SELECT c.id,p.depth+1 FROM public.fp_specialization_catalog c JOIN skill_depth p ON c.parent_id=p.id
)
UPDATE public.fp_specialization_catalog t
SET cost_points=CASE d.depth WHEN 1 THEN 3 WHEN 2 THEN 5 WHEN 3 THEN 7 WHEN 4 THEN 9 ELSE 11 END,
    completion_points=CASE d.depth WHEN 1 THEN 1 WHEN 2 THEN 2 WHEN 3 THEN 3 WHEN 4 THEN 4 ELSE 5 END
FROM skill_depth d WHERE t.id=d.id;

CREATE OR REPLACE FUNCTION public.fp_foundation_complete_v55(p_module_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_user uuid:=auth.uid(); v_xp int:=case when p_module_id in ('geld-wofuer','was-ist-boerse','anlagearten') then 8 when p_module_id in ('unternehmen-geschaeft','umsatz-kosten','cashflow-einfach') then 10 when p_module_id in ('wachstum-marge','aktienpreis-wert','bewertungsvergleiche') then 12 when p_module_id in ('rechnen-veraenderung','rechnen-marge','rechnen-bewertung') then 14 when p_module_id in ('analysieren-fragestellung','analysieren-quellen','analysieren-kurzbericht') then 16 when p_module_id in ('urteil-fakt-vs-deutung','urteil-chancen-risiken','urteil-these-protokoll') then 18 else 0 end; v_fp int:=case when p_module_id in ('anlagearten','cashflow-einfach','bewertungsvergleiche','rechnen-bewertung','analysieren-kurzbericht','urteil-these-protokoll') then 1 else 0 end; v_new boolean:=false; v_profile int:=0;
begin
 if v_user is null then raise exception 'Anmeldung erforderlich.' using errcode='28000';end if;
 if p_module_id is null or p_module_id not in
 ('geld-wofuer','was-ist-boerse','anlagearten','unternehmen-geschaeft',
 'umsatz-kosten','cashflow-einfach','wachstum-marge','aktienpreis-wert',
 'bewertungsvergleiche','rechnen-veraenderung','rechnen-marge','rechnen-bewertung',
 'analysieren-fragestellung','analysieren-quellen','analysieren-kurzbericht',
 'urteil-fakt-vs-deutung','urteil-chancen-risiken','urteil-these-protokoll') then
 raise exception 'Ungültige Grundlageneinheit.' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text,81));
 insert into public.fp_foundation_rewards_v55(user_id,module_id,xp,fp) values(v_user,p_module_id,v_xp,v_fp)
 on conflict(user_id,module_id) do nothing;
 get diagnostics v_profile=row_count;
 v_new=v_profile=1;
 if v_new then
  insert into public.fp_specialization_profiles(user_id,xp) values(v_user,v_xp)
   on conflict(user_id) do update set xp=public.fp_specialization_profiles.xp+v_xp,updated_at=now();
  insert into public.fp_economy_accounts(user_id,research_points,virtual_euro_cents) values(v_user,v_fp,0)
   on conflict(user_id) do update set research_points=public.fp_economy_accounts.research_points+v_fp,updated_at=now();
 end if;
 select xp into v_profile from public.fp_specialization_profiles where user_id=v_user;
 return jsonb_build_object('ok',true,'awarded_now',v_new,'module_id',p_module_id,
 'xp_awarded',case when v_new then v_xp else 0 end,'fp_awarded',case when v_new then v_fp else 0 end,
 'xp_total',coalesce(v_profile,0));
end $function$;

CREATE OR REPLACE FUNCTION public.fp_level_claim_v55()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_user uuid:=auth.uid();v_xp int:=0;v_level int:=1;v_level_i int;v_fp int;v_new int:=0;
 v_reward_points int:=0;v_levels jsonb:='[]'::jsonb;v_existing int:=0;
begin
 if v_user is null then raise exception 'Anmeldung erforderlich.' using errcode='28000';end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text,81));
 select coalesce(xp,0) into v_xp from public.fp_specialization_profiles where user_id=v_user;
 v_xp:=coalesce(v_xp,0);
 select coalesce(max(g.l),1) into v_level from generate_series(1,100) as g(l) where 100*(g.l-1)+10*(g.l-1)*(g.l-2)<=v_xp;
 for v_level_i in 2..v_level loop
  v_fp:=case when mod(v_level_i,10)=0 then 2 when mod(v_level_i,5)=0 then 1 else 0 end;
  insert into public.fp_level_rewards_v55(user_id,level,points)
  values(v_user,v_level_i,v_fp) on conflict(user_id,level) do nothing;
  get diagnostics v_new=row_count;
  if v_new=1 then
   v_reward_points:=v_reward_points+v_fp;
   v_levels:=v_levels||jsonb_build_array(jsonb_build_object('level',v_level_i,'points',v_fp));
  end if;
 end loop;
 if v_reward_points>0 then
  insert into public.fp_economy_accounts(user_id,research_points,virtual_euro_cents)
  values(v_user,v_reward_points,0)
  on conflict(user_id) do update set research_points=public.fp_economy_accounts.research_points+excluded.research_points,updated_at=now();
 end if;
 select count(*) into v_existing from public.fp_foundation_rewards_v55 where user_id=v_user;
 return jsonb_build_object('ok',true,'xp',v_xp,'level',v_level,
 'next_xp',case when v_level>=100 then null else 100*v_level+10*v_level*(v_level-1) end,'level_points_awarded',v_reward_points,'new_levels',v_levels,
 'foundation_completed',v_existing);
end $function$;

CREATE OR REPLACE FUNCTION public.fp_specialization_action(p_action text, p_skill_id text, p_lesson_id text DEFAULT NULL::text, p_payment text DEFAULT NULL::text, p_answer integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_user uuid:=(select auth.uid());
 v_skill public.fp_specialization_catalog%rowtype;
 v_lesson public.fp_specialization_lesson_catalog%rowtype;
 v_wallet numeric(20,2);
 v_points integer;
 v_completed integer;
 v_mastered integer;
 v_old_count integer;
 v_promotions integer;
 v_promotion integer;
 v_reward_eur numeric(20,2);
 v_reward_points integer;
 v_correct boolean;
 v_award_xp integer;
 v_award_fp integer;
begin
 if v_user is null then raise exception 'Bitte zuerst anmelden.' using errcode='28000';end if;
 if p_action not in ('enroll','unlock','submit') then raise exception 'Unbekannter Spezialisierungsauftrag.' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text,81));
 select * into v_skill from public.fp_specialization_catalog where id=p_skill_id;
 if not found then raise exception 'Skill ist nicht vorhanden.' using errcode='22023';end if;
 insert into public.fp_economy_accounts(user_id,research_points,virtual_euro_cents)
 values(v_user,0,0) on conflict(user_id) do nothing;
 select research_points into v_points from public.fp_economy_accounts
 where user_id=v_user for update;
 if p_action='enroll' then
  if exists(select 1 from public.fp_specialization_enrollments where user_id=v_user and skill_id=v_skill.id)
  then return jsonb_build_object('ok',true,'unchanged',true,'message','Skill bereits ausgewählt.');end if;
  if v_skill.parent_id is not null and
   (select count(*) from public.fp_specialization_lesson_catalog c
    join public.fp_specialization_lessons l on l.lesson_id=c.id and l.user_id=v_user
    where c.skill_id=v_skill.parent_id and l.completed_at is not null)
   <(select count(*) from public.fp_specialization_lesson_catalog where skill_id=v_skill.parent_id)
  then raise exception 'Du musst zuerst den vorherigen Skill erlernen.' using errcode='22023';end if;
  if exists(
    select 1 from public.fp_specialization_prerequisites req
    where req.skill_id=v_skill.id and
      (select count(*) from public.fp_specialization_lessons passed
        join public.fp_specialization_lesson_catalog lesson on lesson.id=passed.lesson_id
        where passed.user_id=v_user and lesson.skill_id=req.required_skill_id and passed.completed_at is not null)
      <(select count(*) from public.fp_specialization_lesson_catalog catalog where catalog.skill_id=req.required_skill_id)
  ) then raise exception 'Du musst zuerst die weiteren fachlichen Voraussetzungen abschließen.' using errcode='22023';end if;
  if v_points<v_skill.cost_points then raise exception 'Zu wenige Forschungspunkte. Tages- und Wochenmissionen helfen dir weiter.' using errcode='22023';end if;
  update public.fp_economy_accounts set research_points=research_points-v_skill.cost_points,updated_at=now() where user_id=v_user;
  insert into public.fp_specialization_enrollments(user_id,skill_id) values(v_user,v_skill.id);
  return jsonb_build_object('ok',true,'points_spent',v_skill.cost_points,'message','Skill-Lernpfad freigeschaltet.');
 end if;
 if not exists(select 1 from public.fp_specialization_enrollments where user_id=v_user and skill_id=v_skill.id)
 then raise exception 'Erst den Skill-Lernpfad auswählen.' using errcode='22023';end if;
 select * into v_lesson from public.fp_specialization_lesson_catalog where id=p_lesson_id and skill_id=v_skill.id;
 if not found then raise exception 'Die Lektion gehört nicht zu diesem Skill.' using errcode='22023';end if;
 if p_action='unlock' then
  if exists(select 1 from public.fp_specialization_lessons where user_id=v_user and lesson_id=v_lesson.id)
  then return jsonb_build_object('ok',true,'unchanged',true,'message','Lektion bereits freigeschaltet.');end if;
  if v_lesson.sequence>1 and not exists(
   select 1 from public.fp_specialization_lessons l join public.fp_specialization_lesson_catalog c on c.id=l.lesson_id
   where l.user_id=v_user and l.completed_at is not null and c.skill_id=v_skill.id and c.sequence=v_lesson.sequence-1)
  then raise exception 'Die vorherige Lektion muss zuerst bestanden werden.' using errcode='22023';end if;
  if p_payment not in ('research','euro') then raise exception 'Wähle Forschungspunkte oder Euro-Spielgeld.' using errcode='22023';end if;
  if p_payment='research' then
   if v_points<1 then raise exception 'Ein Forschungspunkt fehlt.' using errcode='22023';end if;
   update public.fp_economy_accounts set research_points=research_points-1,updated_at=now() where user_id=v_user;
  else
   insert into public.fp_paper_wallets(user_id,currency,balance,starting_balance)
    values(v_user,'EUR',1000,1000) on conflict(user_id,currency) do nothing;
   select balance into v_wallet from public.fp_paper_wallets where user_id=v_user and currency='EUR' for update;
   if v_wallet<10 then raise exception 'Mindestens 10 € virtuelles Depotgeld erforderlich.' using errcode='22023';end if;
   update public.fp_paper_wallets set balance=balance-10 where user_id=v_user and currency='EUR';
  end if;
  insert into public.fp_specialization_lessons(user_id,lesson_id,skill_id,payment)
  values(v_user,v_lesson.id,v_skill.id,p_payment);
  return jsonb_build_object('ok',true,'lesson_id',v_lesson.id,'payment',p_payment,'message','Lektion freigeschaltet.');
 end if;
 if p_action='submit' then
  if not exists(select 1 from public.fp_specialization_lessons where user_id=v_user and lesson_id=v_lesson.id)
  then raise exception 'Lektion ist noch nicht freigeschaltet.' using errcode='22023';end if;
  if exists(select 1 from public.fp_specialization_lessons where user_id=v_user and lesson_id=v_lesson.id and completed_at is not null)
  then return jsonb_build_object('ok',true,'unchanged',true,'correct',true,'message','Bereits abgeschlossen.');end if;
  v_correct:=p_answer=v_lesson.answer;
  if not v_correct then return jsonb_build_object('ok',true,'correct',false,'message','Antwort noch nicht korrekt. Prüfe die Erklärung und versuche es erneut.');end if;
  v_award_xp:=v_lesson.xp;
  if exists(select 1 from public.fp_crafted_artifacts where user_id=v_user and redeemed_at is null and effect in ('xp_5','xp_fp_3')) then
   v_award_xp:=v_lesson.xp+greatest(1,ceil(v_lesson.xp*0.05)::integer);
  end if;
  update public.fp_specialization_lessons set completed_at=now(),xp_awarded=v_award_xp where user_id=v_user and lesson_id=v_lesson.id;
  insert into public.fp_specialization_profiles(user_id,xp) values(v_user,v_award_xp)
   on conflict(user_id) do update set xp=public.fp_specialization_profiles.xp+excluded.xp,updated_at=now();
  select count(*) into v_completed from public.fp_specialization_lessons
   where user_id=v_user and skill_id=v_skill.id and completed_at is not null;
  if v_completed=(select count(*) from public.fp_specialization_lesson_catalog where skill_id=v_skill.id) then
   v_award_fp:=v_skill.completion_points;
   if exists(select 1 from public.fp_crafted_artifacts where user_id=v_user and redeemed_at is null and effect in ('fp_5','xp_fp_3')) then
    v_award_fp:=v_award_fp+greatest(1,ceil(v_award_fp*0.05)::integer);
   end if;
   update public.fp_economy_accounts set research_points=research_points+v_award_fp,updated_at=now() where user_id=v_user;
   -- Count only truly completed specializations, not legacy unverified graph nodes.
   select count(*) into v_mastered from public.fp_specialization_enrollments e
   where e.user_id=v_user and
    (select count(*) from public.fp_specialization_lessons l where l.user_id=v_user and l.skill_id=e.skill_id and l.completed_at is not null)
    =(select count(*) from public.fp_specialization_lesson_catalog cl where cl.skill_id=e.skill_id);
   if v_mastered>0 and v_mastered%3=0 then
    v_promotion:=v_mastered/3;
    v_reward_eur:=100+(v_promotion-1)*35;
    v_reward_points:=2;
    insert into public.fp_specialization_promotions(user_id,promotion_number,rewarded_points,rewarded_euro)
     values(v_user,v_promotion,v_reward_points,v_reward_eur) on conflict do nothing;
    if found then
     update public.fp_economy_accounts set research_points=research_points+v_reward_points,updated_at=now() where user_id=v_user;
     insert into public.fp_paper_wallets(user_id,currency,balance,starting_balance)
      values(v_user,'EUR',1000,1000) on conflict(user_id,currency) do nothing;
     update public.fp_paper_wallets set balance=balance+v_reward_eur where user_id=v_user and currency='EUR';
     update public.fp_specialization_profiles set promotion_count=greatest(promotion_count,v_promotion),updated_at=now() where user_id=v_user;
     insert into public.fp_artifact_shards(user_id,shards) values(v_user,2)
      on conflict(user_id) do update set shards=public.fp_artifact_shards.shards+2,updated_at=now();
    end if;
   end if;
  end if;
  return jsonb_build_object('ok',true,'correct',true,'xp',v_award_xp,
    'skill_completed',v_completed=(select count(*) from public.fp_specialization_lesson_catalog where skill_id=v_skill.id),
    'skill_reward',case when v_completed=(select count(*) from public.fp_specialization_lesson_catalog where skill_id=v_skill.id) then v_award_fp else 0 end,
    'promotion',coalesce(v_promotion,0),'promotion_euro',coalesce(v_reward_eur,0),'message','Lektion erfolgreich abgeschlossen.');
 end if;
 raise exception 'Ungültiger Auftrag.' using errcode='22023';
end $function$;

CREATE OR REPLACE FUNCTION public.fp_missions_submit_v51(p_question_id text, p_index integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_user uuid:=auth.uid(); v_day date:=(now() at time zone 'Europe/Berlin')::date;
 v_kind text;v_period text;v_answer integer;v_reason text;v_prev public.fp_mission_attempts_v51%rowtype;
 v_correct boolean;v_tries integer;v_resolved boolean;v_count int;v_correct_count int;v_required int;v_points int;v_awarded int:=0;
begin
 if v_user is null then raise exception 'Bitte anmelden.' using errcode='28000'; end if;
 if p_question_id is null or length(p_question_id)>100 or p_index is null or p_index not between 0 and 3 then
  raise exception 'Ungültige Antwort.' using errcode='22023';
 end if;
 select a.mission_kind,a.period_key into v_kind,v_period
 from fp_mission_private.assignments_v51(v_user,v_day) a where a.question_id=p_question_id limit 1;
 if v_kind is null then raise exception 'Diese Mission ist nicht freigeschaltet oder nicht mehr aktuell.' using errcode='42501';end if;
 select correct_index,explanation into v_answer,v_reason from fp_mission_private.fp_answers_v51 where id=p_question_id;
 if v_answer is null then raise exception 'Antwortschlüssel fehlt.';end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text||':'||v_period||':'||p_question_id,0));
 select * into v_prev from public.fp_mission_attempts_v51
 where user_id=v_user and period_key=v_period and question_id=p_question_id for update;
 if found and v_prev.resolved then
  return jsonb_build_object('correct',v_prev.correct,'resolved',true,'tries',v_prev.tries,'explanation',v_reason,'correct_index',v_answer,'points_awarded',0,'dashboard',public.fp_missions_dashboard_v51());
 end if;
 v_tries=coalesce(v_prev.tries,0)+1;
 if v_tries>2 then raise exception 'Diese Frage wurde schon zweimal beantwortet.';end if;
 v_correct=(p_index=v_answer);
 v_resolved=v_correct or v_tries>=2;
 insert into public.fp_mission_attempts_v51 (user_id,period_key,mission_kind,question_id,selected_index,tries,correct,resolved,updated_at)
 values(v_user,v_period,v_kind,p_question_id,p_index,v_tries,v_correct,v_resolved,now())
 on conflict(user_id,period_key,question_id)
 do update set selected_index=excluded.selected_index,tries=excluded.tries,correct=excluded.correct,resolved=excluded.resolved,updated_at=excluded.updated_at;
 if v_resolved then
  select count(*),count(*) filter(where a.correct) into v_count,v_correct_count
  from fp_mission_private.assignments_v51(v_user,v_day) assigned
  join public.fp_mission_attempts_v51 a on a.user_id=v_user and a.question_id=assigned.question_id and a.period_key=assigned.period_key
  where assigned.mission_kind=v_kind and a.resolved;
  v_required=case v_kind when 'daily' then 3 when 'weekly' then 5 else 2 end;
  v_points=case v_kind when 'daily' then 1 when 'weekly' then 3 else 1 end;
  if v_count=v_required and v_correct_count=v_required then
    insert into public.fp_mission_rewards_v51(user_id,period_key,mission_kind,points)
    values(v_user,v_period,v_kind,v_points)
    on conflict(user_id,period_key,mission_kind) do nothing
    returning points into v_awarded;
    if v_awarded is not null then
      insert into public.fp_economy_accounts (user_id,research_points)
      values(v_user,v_awarded)
      on conflict (user_id) do update
      set research_points=public.fp_economy_accounts.research_points+excluded.research_points,updated_at=now();
    end if;
  end if;
 end if;
 return jsonb_build_object('correct',v_correct,'resolved',v_resolved,'tries',v_tries,
 'explanation',case when v_resolved then v_reason else null end,
 'correct_index',case when v_resolved then v_answer else null end,
 'points_awarded',coalesce(v_awarded,0),'dashboard',public.fp_missions_dashboard_v51());
end $function$;

CREATE OR REPLACE FUNCTION public.fp_streak_checkin()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_user uuid:=(select auth.uid());
 v_today date:=(now() at time zone 'Europe/Berlin')::date;
 v_prev int:=0;
 v_day int:=0;
 v_euros integer:=1000; -- 10 EUR per day
 v_points integer:=0;
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
 if exists(select 1 from public.fp_progress_resets r where r.user_id=v_user and r.reset_date=v_today) then
  return jsonb_build_object('day',0,'today',v_today,'awarded_now',false,
   'today_euros',0,'today_points',0,'milestone',0,'eur_cash',null,'research_total',0,
   'recent','[]'::jsonb,'max_days',30,'next_milestone',10,'progress_reset_today',true);
 end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text,47));
 select coalesce(promotion_count,0) into v_promotion_count from public.fp_specialization_profiles where user_id=v_user;
 v_bonus_euros:=least(7,coalesce(v_promotion_count,0))*200;
 v_bonus_points:=0;
 v_euros:=1000+v_bonus_euros;
 v_points:=0;
 select day_number into v_day from public.fp_streak_days
 where user_id=v_user and checkin_date=v_today;
 if not found then
  select day_number into v_prev from public.fp_streak_days
   where user_id=v_user and checkin_date=v_today-1;
  v_day:=least(30,coalesce(v_prev,0)+1);
  if mod(v_day,7)=0 and v_day<30 then v_points:=1;end if;
  -- Milestone reward only on the FIRST day that reaches a threshold.
  if v_day=10 and coalesce(v_prev,0)<10 then v_milestone:=10;v_euros:=11000+v_bonus_euros;v_points:=2;
  elsif v_day=20 and coalesce(v_prev,0)<20 then v_milestone:=20;v_euros:=13500+v_bonus_euros;v_points:=3;
  elsif v_day=30 and coalesce(v_prev,0)<30 then v_milestone:=30;v_euros:=16000+v_bonus_euros;v_points:=4;
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
end $function$;
DO $audit$ DECLARE v_bad integer; BEGIN
 SELECT count(*) INTO v_bad FROM public.fp_specialization_catalog WHERE cost_points<=completion_points OR cost_points<3 OR cost_points>11;
 IF v_bad<>0 THEN RAISE EXCEPTION 'Invalid FP inflation: % skills',v_bad;END IF;
END $audit$;
