-- FINANZPILOT V52: append-only weekly case pool rotation. Apply AFTER missions_v51.sql.
-- A user's already-started weekly case is bound by their recorded week attempts.
-- Only fully authored 5-step cases with 5 private answer keys enter the rotation.
-- Answer keys and new question authoring remain in Supabase private schema; do not commit keys to public GitHub.
create or replace function fp_mission_private.assignments_v51(p_user uuid,p_day date)
returns table(question_id text,mission_kind text,period_key text)
language sql stable security definer set search_path=''
as $$
 with daily_pool as (
  select q.id,q.topic, (row_number() over(partition by q.topic order by q.id)-1)::int as rn,
  count(*) over(partition by q.topic)::int as cnt
  from public.fp_mission_questions_v51 q where q.kind='daily'
 ),
 completed as (
  select c.id from public.fp_specialization_catalog c
  where exists(select 1 from public.fp_specialization_lesson_catalog lc where lc.skill_id=c.id)
  and not exists(
   select 1 from public.fp_specialization_lesson_catalog lc
   left join public.fp_specialization_lessons l on l.lesson_id=lc.id and l.user_id=p_user
   where lc.skill_id=c.id and l.completed_at is null
  )
 ),
 review_pool as (
  select q.id,coalesce(pr.last_day,date '2000-01-01') as last_day
  from public.fp_mission_questions_v51 q
  join completed c on c.id=q.skill_id
  left join lateral(
   select max(a.updated_at at time zone 'Europe/Berlin')::date as last_day, count(*)::int as visits
   from public.fp_mission_attempts_v51 a
   where a.user_id=p_user and a.mission_kind='review' and a.question_id=q.id
   and a.period_key <> 'r:'||to_char(p_day,'YYYY-MM-DD')
  ) pr on true
  where q.kind='review' and (pr.last_day is null or
   pr.last_day <= p_day - (case when pr.visits<1 then 1 when pr.visits<3 then 3 else 7 end))
  order by coalesce(pr.last_day,date '2000-01-01'),q.id limit 2
 ),
 monday as (
  select (p_day-(extract(isodow from p_day)::int-1))::date as day
 ),
 complete_cases as (
 select q.case_no from public.fp_mission_questions_v51 q
 left join fp_mission_private.fp_answers_v51 ans on ans.id=q.id
 where q.kind='weekly' and q.case_no>0
 group by q.case_no
 having count(*)=5 and count(ans.id)=5 and count(distinct q.step)=5
 ),case_count as (
 select greatest(count(*)::int,1) as n from complete_cases
 ),week_no as (
 select m.day,
  coalesce(
   (select q.case_no from public.fp_mission_attempts_v51 a
    join public.fp_mission_questions_v51 q on q.id=a.question_id
    where a.user_id=p_user and a.mission_kind='weekly'
     and a.period_key='w:'||to_char(m.day,'YYYY-MM-DD')
    order by a.updated_at asc limit 1),
   (select cc.case_no from complete_cases cc order by cc.case_no
    offset mod(mod(((m.day-date '2026-11-02')/7)::int,n)+n,n) limit 1)
  ) as case_no
 from monday m cross join case_count
 )
 select id,'daily'::text,'d:'||to_char(p_day,'YYYY-MM-DD') from daily_pool
 where rn=mod(mod((p_day-date '2026-11-02')::int,cnt)+cnt,cnt)
 union all
 select id,'review'::text,'r:'||to_char(p_day,'YYYY-MM-DD') from review_pool
 union all
 select q.id,'weekly'::text,'w:'||to_char(w.day,'YYYY-MM-DD')
 from public.fp_mission_questions_v51 q cross join week_no w
 where q.kind='weekly' and q.case_no=w.case_no
 $$;

revoke all on function fp_mission_private.assignments_v51(uuid,date) from public,anon,authenticated;
