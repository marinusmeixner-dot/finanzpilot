-- V45: append-only cross-disciplinary skill graph, enforce all prerequisites in the authenticated server RPC.
create table if not exists public.fp_specialization_prerequisites(
 skill_id text not null references public.fp_specialization_catalog(id) on delete cascade,
 required_skill_id text not null references public.fp_specialization_catalog(id),
 primary key(skill_id,required_skill_id),
 check(skill_id<>required_skill_id)
);
alter table public.fp_specialization_prerequisites enable row level security;
revoke all on public.fp_specialization_prerequisites from public,anon,authenticated;
grant select on public.fp_specialization_prerequisites to authenticated;
drop policy if exists fp_spec_requirements_read on public.fp_specialization_prerequisites;
create policy fp_spec_requirements_read on public.fp_specialization_prerequisites for select to authenticated using(true);
insert into public.fp_specialization_catalog(id,parent_id,title,branch,cost_points,completion_points) values('konjunktur-lesen',null,'Konjunkturdaten verstehen','macro',3,8) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('konjunktur-lesen-1','konjunktur-lesen',1,18,0) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('konjunktur-lesen-2','konjunktur-lesen',2,24,1) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('konjunktur-lesen-3','konjunktur-lesen',3,34,0) on conflict(id) do nothing;
insert into public.fp_specialization_catalog(id,parent_id,title,branch,cost_points,completion_points) values('inflation-zinsen','konjunktur-lesen','Inflation & Geldpolitik','macro',3,11) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('inflation-zinsen-1','inflation-zinsen',1,22,1) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('inflation-zinsen-2','inflation-zinsen',2,28,0) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('inflation-zinsen-3','inflation-zinsen',3,38,1) on conflict(id) do nothing;
insert into public.fp_specialization_catalog(id,parent_id,title,branch,cost_points,completion_points) values('zinskurve-szenarien','inflation-zinsen','Zinskurven-Analyst','macro',3,11) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('zinskurve-szenarien-1','zinskurve-szenarien',1,26,0) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('zinskurve-szenarien-2','zinskurve-szenarien',2,32,1) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('zinskurve-szenarien-3','zinskurve-szenarien',3,42,1) on conflict(id) do nothing;
insert into public.fp_specialization_catalog(id,parent_id,title,branch,cost_points,completion_points) values('anleihen-rendite',null,'Anleihen & Renditen','etfs',3,8) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('anleihen-rendite-1','anleihen-rendite',1,18,1) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('anleihen-rendite-2','anleihen-rendite',2,24,0) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('anleihen-rendite-3','anleihen-rendite',3,34,1) on conflict(id) do nothing;
insert into public.fp_specialization_catalog(id,parent_id,title,branch,cost_points,completion_points) values('etf-strukturen',null,'ETFs unter der Haube','etfs',3,8) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('etf-strukturen-1','etf-strukturen',1,18,1) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('etf-strukturen-2','etf-strukturen',2,24,1) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('etf-strukturen-3','etf-strukturen',3,34,1) on conflict(id) do nothing;
insert into public.fp_specialization_catalog(id,parent_id,title,branch,cost_points,completion_points) values('etf-depotbau','etf-strukturen','ETF-Portfolio konstruieren','etfs',3,11) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('etf-depotbau-1','etf-depotbau',1,26,0) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('etf-depotbau-2','etf-depotbau',2,32,1) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('etf-depotbau-3','etf-depotbau',3,42,0) on conflict(id) do nothing;
insert into public.fp_specialization_catalog(id,parent_id,title,branch,cost_points,completion_points) values('orderbuch-liquiditaet',null,'Börsenorders verstehen','trading',3,8) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('orderbuch-liquiditaet-1','orderbuch-liquiditaet',1,18,1) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('orderbuch-liquiditaet-2','orderbuch-liquiditaet',2,24,1) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('orderbuch-liquiditaet-3','orderbuch-liquiditaet',3,34,0) on conflict(id) do nothing;
insert into public.fp_specialization_catalog(id,parent_id,title,branch,cost_points,completion_points) values('orderkosten-slippage','orderbuch-liquiditaet','Transaktionskosten messen','trading',3,11) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('orderkosten-slippage-1','orderkosten-slippage',1,26,1) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('orderkosten-slippage-2','orderkosten-slippage',2,32,0) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('orderkosten-slippage-3','orderkosten-slippage',3,42,1) on conflict(id) do nothing;
insert into public.fp_specialization_catalog(id,parent_id,title,branch,cost_points,completion_points) values('derivate-und-hebel','orderkosten-slippage','Hebel & Derivaterisiken','trading',3,11) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('derivate-und-hebel-1','derivate-und-hebel',1,26,1) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('derivate-und-hebel-2','derivate-und-hebel',2,32,0) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('derivate-und-hebel-3','derivate-und-hebel',3,42,1) on conflict(id) do nothing;
insert into public.fp_specialization_catalog(id,parent_id,title,branch,cost_points,completion_points) values('biases-mentalmodelle',null,'Denkfehler beim Investieren','psychology',3,8) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('biases-mentalmodelle-1','biases-mentalmodelle',1,18,1) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('biases-mentalmodelle-2','biases-mentalmodelle',2,24,0) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('biases-mentalmodelle-3','biases-mentalmodelle',3,34,1) on conflict(id) do nothing;
insert into public.fp_specialization_catalog(id,parent_id,title,branch,cost_points,completion_points) values('entscheidungsjournal','biases-mentalmodelle','Entscheidungsjournal führen','psychology',3,11) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('entscheidungsjournal-1','entscheidungsjournal',1,26,0) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('entscheidungsjournal-2','entscheidungsjournal',2,32,1) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('entscheidungsjournal-3','entscheidungsjournal',3,42,1) on conflict(id) do nothing;
insert into public.fp_specialization_catalog(id,parent_id,title,branch,cost_points,completion_points) values('prognosen-kalibrieren','entscheidungsjournal','Prognosen kalibrieren','psychology',3,11) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('prognosen-kalibrieren-1','prognosen-kalibrieren',1,26,0) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('prognosen-kalibrieren-2','prognosen-kalibrieren',2,32,1) on conflict(id) do nothing;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer) values('prognosen-kalibrieren-3','prognosen-kalibrieren',3,42,1) on conflict(id) do nothing;
insert into public.fp_specialization_prerequisites(skill_id,required_skill_id) values('zinskurve-szenarien','anleihen-rendite') on conflict do nothing;
insert into public.fp_specialization_prerequisites(skill_id,required_skill_id) values('etf-depotbau','portfolio-architekt') on conflict do nothing;
insert into public.fp_specialization_prerequisites(skill_id,required_skill_id) values('etf-depotbau','anleihen-rendite') on conflict do nothing;
insert into public.fp_specialization_prerequisites(skill_id,required_skill_id) values('orderkosten-slippage','etf-strukturen') on conflict do nothing;
insert into public.fp_specialization_prerequisites(skill_id,required_skill_id) values('derivate-und-hebel','risiko-basis') on conflict do nothing;
insert into public.fp_specialization_prerequisites(skill_id,required_skill_id) values('entscheidungsjournal','quellenfinder') on conflict do nothing;
insert into public.fp_specialization_prerequisites(skill_id,required_skill_id) values('prognosen-kalibrieren','investment-these') on conflict do nothing;
create or replace function public.fp_specialization_action(
 p_action text,p_skill_id text,p_lesson_id text default null,p_payment text default null,p_answer integer default null
) returns jsonb language plpgsql security definer set search_path=''
as $$
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
    v_reward_points:=6+v_promotion*2;
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
end $$;
revoke all on function public.fp_specialization_action(text,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.fp_specialization_action(text,text,text,text,integer) to authenticated;
comment on function public.fp_specialization_action(text,text,text,text,integer) is
'Authenticated server-validated skill paths, unique lesson completions, individually assigned XP, point or EUR unlocks, and promotions every 5 new skills.';
