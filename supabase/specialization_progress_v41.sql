-- FinanzPilot v41 - actual private specialization progression, idempotent XP and research points.
-- Separate ledger from legacy concept/career records; no previous mastery is deleted.
create table if not exists public.fp_specialization_catalog(
 id text primary key, parent_id text references public.fp_specialization_catalog(id),
 title text not null, branch text not null, cost_points integer not null check(cost_points>=0),
 completion_points integer not null check(completion_points between 0 and 1000));
create table if not exists public.fp_specialization_lesson_catalog(
 id text primary key, skill_id text not null references public.fp_specialization_catalog(id),
 sequence integer not null check(sequence between 1 and 10),
 xp integer not null check(xp between 1 and 200), answer integer not null check(answer between 0 and 9),
 unique(skill_id,sequence));
create table if not exists public.fp_specialization_enrollments(
 user_id uuid not null references auth.users(id) on delete cascade,
 skill_id text not null references public.fp_specialization_catalog(id),
 created_at timestamptz not null default now(),
 primary key(user_id,skill_id));
create table if not exists public.fp_specialization_lessons(
 user_id uuid not null references auth.users(id) on delete cascade,
 lesson_id text not null references public.fp_specialization_lesson_catalog(id),
 skill_id text not null references public.fp_specialization_catalog(id),
 payment text not null check(payment in ('research','euro')),
 completed_at timestamptz,
 xp_awarded integer not null default 0 check(xp_awarded>=0),
 unlocked_at timestamptz not null default now(),
 primary key(user_id,lesson_id));
create index if not exists fp_specialization_lessons_user_skill on public.fp_specialization_lessons(user_id,skill_id);
create table if not exists public.fp_specialization_profiles(
 user_id uuid primary key references auth.users(id) on delete cascade,
 xp integer not null default 0 check(xp>=0),
 promotion_count integer not null default 0 check(promotion_count between 0 and 30),
 updated_at timestamptz not null default now());
create table if not exists public.fp_specialization_promotions(
 user_id uuid not null references auth.users(id) on delete cascade,
 promotion_number integer not null check(promotion_number between 1 and 30),
 rewarded_points integer not null,
 rewarded_euro numeric(20,2) not null,
 awarded_at timestamptz not null default now(),
 primary key(user_id,promotion_number));
do $$
declare t text;
begin
 foreach t in array ARRAY['fp_specialization_catalog','fp_specialization_lesson_catalog','fp_specialization_enrollments','fp_specialization_lessons','fp_specialization_profiles','fp_specialization_promotions'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
 end loop;
end $$;
grant select on public.fp_specialization_catalog,public.fp_specialization_lesson_catalog,
public.fp_specialization_enrollments,public.fp_specialization_lessons,
public.fp_specialization_profiles,public.fp_specialization_promotions to authenticated;
drop policy if exists fp_spec_catalog_read on public.fp_specialization_catalog;
create policy fp_spec_catalog_read on public.fp_specialization_catalog for select to authenticated using(true);
drop policy if exists fp_spec_lesson_catalog_read on public.fp_specialization_lesson_catalog;
create policy fp_spec_lesson_catalog_read on public.fp_specialization_lesson_catalog for select to authenticated using(true);
drop policy if exists fp_spec_enrollment_owner on public.fp_specialization_enrollments;
create policy fp_spec_enrollment_owner on public.fp_specialization_enrollments for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists fp_spec_lesson_owner on public.fp_specialization_lessons;
create policy fp_spec_lesson_owner on public.fp_specialization_lessons for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists fp_spec_profile_owner on public.fp_specialization_profiles;
create policy fp_spec_profile_owner on public.fp_specialization_profiles for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists fp_spec_promotions_owner on public.fp_specialization_promotions;
create policy fp_spec_promotions_owner on public.fp_specialization_promotions for select to authenticated using(user_id=(select auth.uid()));
insert into public.fp_specialization_catalog(id,parent_id,title,branch,cost_points,completion_points)
 values('berichte-lesen',null,'Berichte sicher lesen','reporting',3,7)
 on conflict(id) do update set title=excluded.title,branch=excluded.branch,cost_points=excluded.cost_points,completion_points=excluded.completion_points;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('berichte-lesen-1','berichte-lesen',1,0,Letzter Aktienkurs)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('berichte-lesen-2','berichte-lesen',2,0,Eine Meinungsäußerung ohne Originalzahlen)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('berichte-lesen-3','berichte-lesen',3,1,Der Verkauf hat keinen Einfluss auf den Cashflow)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_catalog(id,parent_id,title,branch,cost_points,completion_points)
 values('cashflow-architekt','berichte-lesen','Cashflow-Architekt','reporting',3,9)
 on conflict(id) do update set title=excluded.title,branch=excluded.branch,cost_points=excluded.cost_points,completion_points=excluded.completion_points;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('cashflow-architekt-1','cashflow-architekt',1,1,Er erhöht automatisch den Gewinn)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('cashflow-architekt-2','cashflow-architekt',2,1,65 Mio. €)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('cashflow-architekt-3','cashflow-architekt',3,1,Jede Investition dauerhaft ignorieren)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_catalog(id,parent_id,title,branch,cost_points,completion_points)
 values('bilanz-pruefer','cashflow-architekt','Bilanz- und Schuldenprüfer','reporting',3,11)
 on conflict(id) do update set title=excluded.title,branch=excluded.branch,cost_points=excluded.cost_points,completion_points=excluded.completion_points;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('bilanz-pruefer-1','bilanz-pruefer',1,1,180 Mio. €)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('bilanz-pruefer-2','bilanz-pruefer',2,0,Nur die Anzahl neuer Produkte)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('bilanz-pruefer-3','bilanz-pruefer',3,0,Das Eigenkapital ist automatisch null)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_catalog(id,parent_id,title,branch,cost_points,completion_points)
 values('bewertung-multiples',null,'Relative Bewertung','valuation',3,7)
 on conflict(id) do update set title=excluded.title,branch=excluded.branch,cost_points=excluded.cost_points,completion_points=excluded.completion_points;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('bewertung-multiples-1','bewertung-multiples',1,0,6)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('bewertung-multiples-2','bewertung-multiples',2,0,Nur der gestrige Kurs)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('bewertung-multiples-3','bewertung-multiples',3,0,Nur den Firmenname vergleichen)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_catalog(id,parent_id,title,branch,cost_points,completion_points)
 values('werttreiber','bewertung-multiples','Werttreiber verstehen','valuation',3,9)
 on conflict(id) do update set title=excluded.title,branch=excluded.branch,cost_points=excluded.cost_points,completion_points=excluded.completion_points;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('werttreiber-1','werttreiber',1,0,200 %)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('werttreiber-2','werttreiber',2,0,Zukünftige Euro sind immer genauso viel wert)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('werttreiber-3','werttreiber',3,0,Nur die Zahl der Mitarbeitenden)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_catalog(id,parent_id,title,branch,cost_points,completion_points)
 values('unternehmenswert','werttreiber','DCF- und Szenarioanalyse','valuation',3,11)
 on conflict(id) do update set title=excluded.title,branch=excluded.branch,cost_points=excluded.cost_points,completion_points=excluded.completion_points;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('unternehmenswert-1','unternehmenswert',1,0,Nur ein Kursziel aus sozialen Medien)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('unternehmenswert-2','unternehmenswert',2,0,Die Angabe von Risiken)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('unternehmenswert-3','unternehmenswert',3,0,Den höchsten Wert immer als sicher annehmen)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_catalog(id,parent_id,title,branch,cost_points,completion_points)
 values('risiko-basis',null,'Verlust und Risikotragfähigkeit','risk',3,7)
 on conflict(id) do update set title=excluded.title,branch=excluded.branch,cost_points=excluded.cost_points,completion_points=excluded.completion_points;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('risiko-basis-1','risiko-basis',1,0,Vergangene Kursschwankungen)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('risiko-basis-2','risiko-basis',2,0,Jede Position gleich benennen)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('risiko-basis-3','risiko-basis',3,0,Nur die heutige Kursschwankung)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_catalog(id,parent_id,title,branch,cost_points,completion_points)
 values('portfolio-architekt','risiko-basis','Portfolio-Architekt','risk',3,9)
 on conflict(id) do update set title=excluded.title,branch=excluded.branch,cost_points=excluded.cost_points,completion_points=excluded.completion_points;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('portfolio-architekt-1','portfolio-architekt',1,0,2,5 %)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('portfolio-architekt-2','portfolio-architekt',2,0,Sie ist gleichbedeutend mit einer sicheren Rendite)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('portfolio-architekt-3','portfolio-architekt',3,0,+12 %)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_catalog(id,parent_id,title,branch,cost_points,completion_points)
 values('makro-risiken','portfolio-architekt','Makro- und Liquiditätsrisiken','risk',3,11)
 on conflict(id) do update set title=excluded.title,branch=excluded.branch,cost_points=excluded.cost_points,completion_points=excluded.completion_points;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('makro-risiken-1','makro-risiken',1,0,Nur das letzte Tageshoch)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('makro-risiken-2','makro-risiken',2,0,Weil alle Broker gleiche Währungen zeigen)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('makro-risiken-3','makro-risiken',3,0,Mehr Zeit für die Rückzahlung)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_catalog(id,parent_id,title,branch,cost_points,completion_points)
 values('quellenfinder',null,'Primärquellen-Forscher','research',3,7)
 on conflict(id) do update set title=excluded.title,branch=excluded.branch,cost_points=excluded.cost_points,completion_points=excluded.completion_points;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('quellenfinder-1','quellenfinder',1,0,Ein beliebiger Social-Media-Post)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('quellenfinder-2','quellenfinder',2,0,Nur das Datum des Aktienkurses)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('quellenfinder-3','quellenfinder',3,0,Beide Werte addieren)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_catalog(id,parent_id,title,branch,cost_points,completion_points)
 values('nachrichten-einordnen','quellenfinder','Nachrichten-Analyst','research',3,9)
 on conflict(id) do update set title=excluded.title,branch=excluded.branch,cost_points=excluded.cost_points,completion_points=excluded.completion_points;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('nachrichten-einordnen-1','nachrichten-einordnen',1,0,Die Börse hat keine Nachrichten verarbeitet)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('nachrichten-einordnen-2','nachrichten-einordnen',2,0,Welche Farbe hat die Börsenanzeige?)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('nachrichten-einordnen-3','nachrichten-einordnen',3,0,Nur den heutigen Kurs)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_catalog(id,parent_id,title,branch,cost_points,completion_points)
 values('investment-these','nachrichten-einordnen','Investmentkomitee','research',3,11)
 on conflict(id) do update set title=excluded.title,branch=excluded.branch,cost_points=excluded.cost_points,completion_points=excluded.completion_points;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('investment-these-1','investment-these',1,0,Nur die Zahl der Besucher)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('investment-these-2','investment-these',2,0,Nur den letzten Depotgewinn betrachten)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;
insert into public.fp_specialization_lesson_catalog(id,skill_id,sequence,xp,answer)
 values('investment-these-3','investment-these',3,0,Nie, denn gute Analysen müssen zum Kauf führen)
 on conflict(id) do update set xp=excluded.xp,answer=excluded.answer;

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
  update public.fp_specialization_lessons set completed_at=now(),xp_awarded=v_lesson.xp where user_id=v_user and lesson_id=v_lesson.id;
  insert into public.fp_specialization_profiles(user_id,xp) values(v_user,v_lesson.xp)
   on conflict(user_id) do update set xp=public.fp_specialization_profiles.xp+excluded.xp,updated_at=now();
  select count(*) into v_completed from public.fp_specialization_lessons
   where user_id=v_user and skill_id=v_skill.id and completed_at is not null;
  if v_completed=(select count(*) from public.fp_specialization_lesson_catalog where skill_id=v_skill.id) then
   update public.fp_economy_accounts set research_points=research_points+v_skill.completion_points,updated_at=now() where user_id=v_user;
   -- Count only truly completed specializations, not legacy unverified graph nodes.
   select count(*) into v_mastered from public.fp_specialization_enrollments e
   where e.user_id=v_user and
    (select count(*) from public.fp_specialization_lessons l where l.user_id=v_user and l.skill_id=e.skill_id and l.completed_at is not null)
    =(select count(*) from public.fp_specialization_lesson_catalog cl where cl.skill_id=e.skill_id);
   if v_mastered>0 and v_mastered%5=0 then
    v_promotion:=v_mastered/5;
    v_reward_eur:=150+(v_promotion-1)*50;
    v_reward_points:=10+v_promotion*5;
    insert into public.fp_specialization_promotions(user_id,promotion_number,rewarded_points,rewarded_euro)
     values(v_user,v_promotion,v_reward_points,v_reward_eur) on conflict do nothing;
    if found then
     update public.fp_economy_accounts set research_points=research_points+v_reward_points,updated_at=now() where user_id=v_user;
     insert into public.fp_paper_wallets(user_id,currency,balance,starting_balance)
      values(v_user,'EUR',1000,1000) on conflict(user_id,currency) do nothing;
     update public.fp_paper_wallets set balance=balance+v_reward_eur where user_id=v_user and currency='EUR';
     update public.fp_specialization_profiles set promotion_count=greatest(promotion_count,v_promotion),updated_at=now() where user_id=v_user;
    end if;
   end if;
  end if;
  return jsonb_build_object('ok',true,'correct',true,'xp',v_lesson.xp,
    'skill_completed',v_completed=(select count(*) from public.fp_specialization_lesson_catalog where skill_id=v_skill.id),
    'skill_reward',case when v_completed=(select count(*) from public.fp_specialization_lesson_catalog where skill_id=v_skill.id) then v_skill.completion_points else 0 end,
    'promotion',coalesce(v_promotion,0),'promotion_euro',coalesce(v_reward_eur,0),'message','Lektion erfolgreich abgeschlossen.');
 end if;
 raise exception 'Ungültiger Auftrag.' using errcode='22023';
end $$;
revoke all on function public.fp_specialization_action(text,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.fp_specialization_action(text,text,text,text,integer) to authenticated;
comment on function public.fp_specialization_action(text,text,text,text,integer) is
'Authenticated server-validated skill paths, unique lesson completions, individually assigned XP, point or EUR unlocks, and promotions every 5 new skills.';
