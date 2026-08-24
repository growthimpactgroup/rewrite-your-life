-- Rewrite Your Life — raw response table (Section 6 of the build brief).
-- Run this once in the Supabase SQL editor for the project this app points to.
--
-- Insert-only by construction:
--   * No UPDATE/DELETE policy is created below, and RLS is enabled, so the
--     anon/public API key (which this app never even receives) cannot write,
--     read, edit, or delete rows.
--   * The app's only write path is app/api/submit/route.ts, which uses the
--     service role key (bypasses RLS) and only ever calls .insert(). There is
--     no update or delete route anywhere in the codebase.

create extension if not exists pgcrypto;

create table if not exists assessment_responses (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(), -- server time, never client time

  course     text not null default 'ryl',
  phase      text not null check (phase in ('first', 'retake', 'week10')),
  email      text not null,

  -- 27 frozen items, fixed order, matching lib/questions.ts ids 1-27.
  -- The five-button scale only ever produces 0, 3, 5, 8, or 10.
  item_1  smallint not null check (item_1  in (0,3,5,8,10)),
  item_2  smallint not null check (item_2  in (0,3,5,8,10)),
  item_3  smallint not null check (item_3  in (0,3,5,8,10)),
  item_4  smallint not null check (item_4  in (0,3,5,8,10)),
  item_5  smallint not null check (item_5  in (0,3,5,8,10)),
  item_6  smallint not null check (item_6  in (0,3,5,8,10)),
  item_7  smallint not null check (item_7  in (0,3,5,8,10)),
  item_8  smallint not null check (item_8  in (0,3,5,8,10)),
  item_9  smallint not null check (item_9  in (0,3,5,8,10)),
  item_10 smallint not null check (item_10 in (0,3,5,8,10)),
  item_11 smallint not null check (item_11 in (0,3,5,8,10)),
  item_12 smallint not null check (item_12 in (0,3,5,8,10)),
  item_13 smallint not null check (item_13 in (0,3,5,8,10)),
  item_14 smallint not null check (item_14 in (0,3,5,8,10)),
  item_15 smallint not null check (item_15 in (0,3,5,8,10)),
  item_16 smallint not null check (item_16 in (0,3,5,8,10)),
  item_17 smallint not null check (item_17 in (0,3,5,8,10)),
  item_18 smallint not null check (item_18 in (0,3,5,8,10)),
  item_19 smallint not null check (item_19 in (0,3,5,8,10)),
  item_20 smallint not null check (item_20 in (0,3,5,8,10)),
  item_21 smallint not null check (item_21 in (0,3,5,8,10)),
  item_22 smallint not null check (item_22 in (0,3,5,8,10)),
  item_23 smallint not null check (item_23 in (0,3,5,8,10)),
  item_24 smallint not null check (item_24 in (0,3,5,8,10)),
  item_25 smallint not null check (item_25 in (0,3,5,8,10)),
  item_26 smallint not null check (item_26 in (0,3,5,8,10)),
  item_27 smallint not null check (item_27 in (0,3,5,8,10)),

  consent boolean not null check (consent = true)
);

-- Return matching (Phase 3) will look responses up by course + email.
create index if not exists assessment_responses_course_email_idx
  on assessment_responses (course, email);

alter table assessment_responses enable row level security;
-- Intentionally no policies: nothing is grantable to anon/authenticated.
-- Only the service role (used solely by app/api/submit) can write, and it
-- bypasses RLS by design.

-- ---------------------------------------------------------------------------
-- Migration: unmatched-retake flag (Screen B build spec).
-- Safe to re-run — ADD COLUMN IF NOT EXISTS is idempotent.
--
-- Set server-side in app/api/submit when phase != 'first' and no prior row
-- exists for that email at submit time. The submission is still accepted
-- and stored normally — this is a flag for the weekly hygiene pass, not a
-- block. Run this once in the Supabase SQL editor.
alter table assessment_responses
  add column if not exists unmatched_retake boolean not null default false;

-- ---------------------------------------------------------------------------
-- Consent/decline architecture (Section 6 of the build brief).
-- A bare tally only — no answers, no email, no identifiers of any kind.
-- Written by app/api/decline when a participant taps "I'd rather not —
-- discard my answers" on the end-of-flow consent screen. Nothing is ever
-- written to assessment_responses for a declined session.
create table if not exists decline_log (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  course     text not null default 'ryl',
  phase      text not null check (phase in ('first', 'retake', 'week10'))
);

alter table decline_log enable row level security;
-- Intentionally no policies, same as assessment_responses: only the service
-- role (used solely by app/api/decline) can write, and it bypasses RLS.

-- ---------------------------------------------------------------------------
-- Public Outcome Record — Phase A, data layer.
-- GIG_Public_Record_Build_Instruction_Set_Frances.pdf, Section 4.
-- Run this whole block once in the Supabase SQL editor. Idempotent —
-- create-or-replace / drop-if-exists throughout, safe to re-run.

-- 1. Immutability on assessment_responses (Section 2: "no code path anywhere
--    that can update or delete a raw row"). Today RLS-with-no-policies only
--    blocks the anon key; the service role (the app's only DB credential)
--    still has implicit UPDATE/DELETE grants and nothing in Postgres stops a
--    future line of code from calling .update()/.delete(). Close both paths:
--    revoke the grant, and back it with a trigger that raises even if a
--    future migration re-grants the privilege by accident.
revoke update, delete on assessment_responses from service_role;

create or replace function prevent_assessment_responses_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception
    'assessment_responses is insert-only — % is not permitted (row id: %)',
    tg_op, coalesce(old.id, new.id);
end;
$$;

drop trigger if exists assessment_responses_immutable on assessment_responses;
create trigger assessment_responses_immutable
  before update or delete on assessment_responses
  for each row execute function prevent_assessment_responses_mutation();

-- 2. scored — private view. Reproduces lib/scoring.ts exactly, in SQL, per
--    row: items 8 and 14 reverse-scored (10 − answer), nine domain
--    percentages (pair sum ÷ 20 as %, matching DOMAIN_ORDER in
--    lib/scoring.ts), three life anchors (raw 0–10, never percentaged), the
--    AI index and Q-AI alone, and the straight-line flag (10+ consecutive
--    identical raw answers, run spanning item 8 or 14 — Meade & Craig 2012,
--    same rule as isStraightLined in lib/scoring.ts, checked across all 27
--    items).
create or replace view scored
  with (security_invoker = true) -- requires Postgres 15+; safe to drop this
                                  -- clause if your project is older — the
                                  -- explicit revokes below still hold.
as
select
  ar.id,
  ar.created_at,
  ar.course,
  ar.phase,
  lower(trim(ar.email)) as email_normalized,
  ar.unmatched_retake,

  round((ar.item_1 + ar.item_2) / 20.0 * 100)        as clear_thinking_pct,
  round((ar.item_3 + ar.item_4) / 20.0 * 100)        as emotional_pct,
  round((ar.item_5 + ar.item_6) / 20.0 * 100)        as adversity_pct,
  round((ar.item_7 + (10 - ar.item_8)) / 20.0 * 100) as frame_pct,
  round((ar.item_9 + ar.item_10) / 20.0 * 100)       as learning_pct,
  round((ar.item_11 + ar.item_12) / 20.0 * 100)      as situational_pct,
  round((ar.item_13 + (10 - ar.item_14)) / 20.0 * 100) as presence_pct,
  round((ar.item_15 + ar.item_16) / 20.0 * 100)      as purpose_pct,
  round((ar.item_17 + ar.item_18) / 20.0 * 100)      as execution_pct,

  ar.item_19 as life_satisfaction_raw,
  ar.item_20 as mornings_with_priority_raw,
  ar.item_21 as confidence_next_12mo_raw,

  round((ar.item_22 + ar.item_23 + ar.item_24 + ar.item_25 + ar.item_26 + ar.item_27) / 60.0 * 100) as ai_index_pct,
  round(ar.item_22 / 10.0 * 100) as qai_pct,

  coalesce(sl.straight_lined, false) as straight_lined
from assessment_responses ar
cross join lateral (
  select bool_or(run.len >= 10 and run.has_reverse) as straight_lined
  from (
    select count(*) as len, bool_or(idx in (8, 14)) as has_reverse
    from (
      -- Postgres forbids nesting a window function call (lag) inside the
      -- argument of another window function (sum) in one select list, so
      -- lag is resolved to a plain column here first...
      select idx,
        sum(is_new_run) over (order by idx) as grp
      from (
        select idx, val,
          case when val = lag(val) over (order by idx) then 0 else 1 end as is_new_run
        from unnest(array[
          ar.item_1, ar.item_2, ar.item_3, ar.item_4, ar.item_5, ar.item_6,
          ar.item_7, ar.item_8, ar.item_9, ar.item_10, ar.item_11, ar.item_12,
          ar.item_13, ar.item_14, ar.item_15, ar.item_16, ar.item_17, ar.item_18,
          ar.item_19, ar.item_20, ar.item_21, ar.item_22, ar.item_23, ar.item_24,
          ar.item_25, ar.item_26, ar.item_27
        ]) with ordinality as t(val, idx)
      ) with_flag
      -- ...and the cumulative sum (grp) is computed one level up from that.
    ) tagged
    group by grp
  ) run
) sl;

revoke all on scored from anon, authenticated;

-- 3. matched_pairs — private view. Earliest phase='first' row joined to the
--    latest phase='week10' row per (course, normalized email) — same
--    lower(trim(email)) normalization app/api/submit/route.ts already uses
--    for its unmatched-retake check. Interpretation call, flagged here:
--    straight-lined rows are excluded from being either side of a pair (the
--    spec's "excluded here" reads as excluding the pair, not one side of
--    it). retake rows never participate in matching.
create or replace view matched_pairs
  with (security_invoker = true)
as
select
  d0.course,
  d0.email_normalized,
  d0.id as day0_id,
  d0.created_at as day0_at,
  w10.id as week10_id,
  w10.created_at as week10_at,

  d0.clear_thinking_pct as day0_clear_thinking_pct, w10.clear_thinking_pct as week10_clear_thinking_pct,
  d0.emotional_pct as day0_emotional_pct,           w10.emotional_pct as week10_emotional_pct,
  d0.adversity_pct as day0_adversity_pct,           w10.adversity_pct as week10_adversity_pct,
  d0.frame_pct as day0_frame_pct,                   w10.frame_pct as week10_frame_pct,
  d0.learning_pct as day0_learning_pct,             w10.learning_pct as week10_learning_pct,
  d0.situational_pct as day0_situational_pct,       w10.situational_pct as week10_situational_pct,
  d0.presence_pct as day0_presence_pct,             w10.presence_pct as week10_presence_pct,
  d0.purpose_pct as day0_purpose_pct,               w10.purpose_pct as week10_purpose_pct,
  d0.execution_pct as day0_execution_pct,           w10.execution_pct as week10_execution_pct,

  d0.life_satisfaction_raw as day0_life_satisfaction_raw,           w10.life_satisfaction_raw as week10_life_satisfaction_raw,
  d0.mornings_with_priority_raw as day0_mornings_with_priority_raw, w10.mornings_with_priority_raw as week10_mornings_with_priority_raw,
  d0.confidence_next_12mo_raw as day0_confidence_next_12mo_raw,     w10.confidence_next_12mo_raw as week10_confidence_next_12mo_raw,

  d0.ai_index_pct as day0_ai_index_pct, w10.ai_index_pct as week10_ai_index_pct
from (
  select distinct on (course, email_normalized) *
  from scored
  where phase = 'first' and not straight_lined
  order by course, email_normalized, created_at asc
) d0
join (
  select distinct on (course, email_normalized) *
  from scored
  where phase = 'week10' and not straight_lined
  order by course, email_normalized, created_at desc
) w10
  on d0.course = w10.course and d0.email_normalized = w10.email_normalized;

revoke all on matched_pairs from anon, authenticated;

-- 4. public_aggregates — the only public-readable table (Section 2:
--    "aggregate-only reads"). One row per course. The spec's funnel and
--    distribution numbers are never suppressed ("the funnel is always
--    published", "decliners are always published") so they're plain
--    columns; the 13 per-metric day0/week10/delta rows (nine domains +
--    three anchors + AI index) each need their own independent N≥20 gate,
--    so they're nested as a jsonb array rather than forced into uniform
--    table columns.
create table if not exists public_aggregates (
  course                   text primary key,
  computed_at              timestamptz not null,
  measured_since           timestamptz,
  last_anchor_date         date,
  total_submissions        int not null,
  n_started                int not null,
  n_pairs                  int not null,
  completion_rate          numeric not null,
  pct_improved             numeric not null,
  pct_flat                 numeric not null,
  pct_declined             numeric not null,
  n_declined               int not null,
  n_excluded_straightline  int not null,
  metrics                  jsonb not null
  -- metrics shape: [{key, label, type, day0_avg, week10_avg, delta_pts,
  -- delta_pct, n, published}, ...] — 13 entries, domains/AI index rounded to
  -- whole numbers, anchors to one decimal (Section 3 display standard).
  -- published = (n >= 20); the page renders the collecting state when false.
);

alter table public_aggregates enable row level security;
drop policy if exists public_aggregates_read on public_aggregates;
create policy public_aggregates_read on public_aggregates
  for select to anon using (true);
grant select on public_aggregates to anon;
-- No insert/update/delete grant to anon or authenticated anywhere — only
-- refresh_public_aggregates() (service-role only, see below) ever writes
-- this table.

-- 5. refresh_public_aggregates(course) — recomputes and rewrites the single
--    row for that course in one transaction (Section 4/5). Phase B's
--    nightly job will just call this and then regenerate the static files —
--    no aggregation logic duplicated there. last_anchor_date is preserved
--    across refreshes; it's only ever set by Frances's monthly anchor step.
create or replace function refresh_public_aggregates(target_course text)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_total_submissions int;
  v_measured_since timestamptz;
  v_n_started int;
  v_n_pairs int;
  v_completion_rate numeric;
  v_pct_improved numeric;
  v_pct_flat numeric;
  v_pct_declined numeric;
  v_n_declined int;
  v_n_excluded_straightline int;
  v_metrics jsonb;
begin
  select count(*), min(created_at) into v_total_submissions, v_measured_since
  from assessment_responses where course = target_course;

  select count(*) into v_n_started
  from assessment_responses where course = target_course and phase = 'first';

  select count(*) into v_n_pairs
  from matched_pairs where course = target_course;

  v_completion_rate := case when v_n_started = 0 then 0
    else round((v_n_pairs::numeric / v_n_started) * 100) end;

  select count(*) into v_n_excluded_straightline
  from scored where course = target_course and straight_lined;

  with pair_deltas as (
    select (
      (week10_clear_thinking_pct - day0_clear_thinking_pct) +
      (week10_emotional_pct - day0_emotional_pct) +
      (week10_adversity_pct - day0_adversity_pct) +
      (week10_frame_pct - day0_frame_pct) +
      (week10_learning_pct - day0_learning_pct) +
      (week10_situational_pct - day0_situational_pct) +
      (week10_presence_pct - day0_presence_pct) +
      (week10_purpose_pct - day0_purpose_pct) +
      (week10_execution_pct - day0_execution_pct)
    ) / 9.0 as avg_domain_delta
    from matched_pairs where course = target_course
  )
  select
    case when v_n_pairs = 0 then 0 else round(100.0 * count(*) filter (where avg_domain_delta >= 5) / v_n_pairs) end,
    case when v_n_pairs = 0 then 0 else round(100.0 * count(*) filter (where avg_domain_delta > -5 and avg_domain_delta < 5) / v_n_pairs) end,
    case when v_n_pairs = 0 then 0 else round(100.0 * count(*) filter (where avg_domain_delta <= -5) / v_n_pairs) end,
    count(*) filter (where avg_domain_delta <= -5)
  into v_pct_improved, v_pct_flat, v_pct_declined, v_n_declined
  from pair_deltas;

  -- '- ord' strips the ordering helper column so the stored JSON matches
  -- the documented {key,label,type,day0_avg,week10_avg,delta_pts,delta_pct,
  -- n,published} shape exactly; order is preserved by jsonb_agg's ORDER BY.
  select jsonb_agg((to_jsonb(m) - 'ord') order by m.ord) into v_metrics
  from (
    select 1 as ord, 'clear_thinking' as key, 'Clear Thinking' as label, 'domain' as type,
      round(avg(day0_clear_thinking_pct)) as day0_avg, round(avg(week10_clear_thinking_pct)) as week10_avg,
      round(avg(week10_clear_thinking_pct) - avg(day0_clear_thinking_pct)) as delta_pts,
      case when avg(day0_clear_thinking_pct) = 0 then null
        else round((avg(week10_clear_thinking_pct) - avg(day0_clear_thinking_pct)) / avg(day0_clear_thinking_pct) * 100) end as delta_pct,
      count(*) as n, count(*) >= 20 as published
    from matched_pairs where course = target_course
    union all
    select 2, 'emotional', 'Emotional Steadiness', 'domain',
      round(avg(day0_emotional_pct)), round(avg(week10_emotional_pct)),
      round(avg(week10_emotional_pct) - avg(day0_emotional_pct)),
      case when avg(day0_emotional_pct) = 0 then null
        else round((avg(week10_emotional_pct) - avg(day0_emotional_pct)) / avg(day0_emotional_pct) * 100) end,
      count(*), count(*) >= 20
    from matched_pairs where course = target_course
    union all
    select 3, 'adversity', 'Adversity Recovery', 'domain',
      round(avg(day0_adversity_pct)), round(avg(week10_adversity_pct)),
      round(avg(week10_adversity_pct) - avg(day0_adversity_pct)),
      case when avg(day0_adversity_pct) = 0 then null
        else round((avg(week10_adversity_pct) - avg(day0_adversity_pct)) / avg(day0_adversity_pct) * 100) end,
      count(*), count(*) >= 20
    from matched_pairs where course = target_course
    union all
    select 4, 'frame', 'Frame Control', 'domain',
      round(avg(day0_frame_pct)), round(avg(week10_frame_pct)),
      round(avg(week10_frame_pct) - avg(day0_frame_pct)),
      case when avg(day0_frame_pct) = 0 then null
        else round((avg(week10_frame_pct) - avg(day0_frame_pct)) / avg(day0_frame_pct) * 100) end,
      count(*), count(*) >= 20
    from matched_pairs where course = target_course
    union all
    select 5, 'learning', 'Learning Agility', 'domain',
      round(avg(day0_learning_pct)), round(avg(week10_learning_pct)),
      round(avg(week10_learning_pct) - avg(day0_learning_pct)),
      case when avg(day0_learning_pct) = 0 then null
        else round((avg(week10_learning_pct) - avg(day0_learning_pct)) / avg(day0_learning_pct) * 100) end,
      count(*), count(*) >= 20
    from matched_pairs where course = target_course
    union all
    select 6, 'situational', 'Situational Awareness', 'domain',
      round(avg(day0_situational_pct)), round(avg(week10_situational_pct)),
      round(avg(week10_situational_pct) - avg(day0_situational_pct)),
      case when avg(day0_situational_pct) = 0 then null
        else round((avg(week10_situational_pct) - avg(day0_situational_pct)) / avg(day0_situational_pct) * 100) end,
      count(*), count(*) >= 20
    from matched_pairs where course = target_course
    union all
    select 7, 'presence', 'Presence', 'domain',
      round(avg(day0_presence_pct)), round(avg(week10_presence_pct)),
      round(avg(week10_presence_pct) - avg(day0_presence_pct)),
      case when avg(day0_presence_pct) = 0 then null
        else round((avg(week10_presence_pct) - avg(day0_presence_pct)) / avg(day0_presence_pct) * 100) end,
      count(*), count(*) >= 20
    from matched_pairs where course = target_course
    union all
    select 8, 'purpose', 'Purpose', 'domain',
      round(avg(day0_purpose_pct)), round(avg(week10_purpose_pct)),
      round(avg(week10_purpose_pct) - avg(day0_purpose_pct)),
      case when avg(day0_purpose_pct) = 0 then null
        else round((avg(week10_purpose_pct) - avg(day0_purpose_pct)) / avg(day0_purpose_pct) * 100) end,
      count(*), count(*) >= 20
    from matched_pairs where course = target_course
    union all
    select 9, 'execution', 'Execution', 'domain',
      round(avg(day0_execution_pct)), round(avg(week10_execution_pct)),
      round(avg(week10_execution_pct) - avg(day0_execution_pct)),
      case when avg(day0_execution_pct) = 0 then null
        else round((avg(week10_execution_pct) - avg(day0_execution_pct)) / avg(day0_execution_pct) * 100) end,
      count(*), count(*) >= 20
    from matched_pairs where course = target_course
    union all
    select 10, 'ai_index', 'AI Orchestration Index', 'domain',
      round(avg(day0_ai_index_pct)), round(avg(week10_ai_index_pct)),
      round(avg(week10_ai_index_pct) - avg(day0_ai_index_pct)),
      case when avg(day0_ai_index_pct) = 0 then null
        else round((avg(week10_ai_index_pct) - avg(day0_ai_index_pct)) / avg(day0_ai_index_pct) * 100) end,
      count(*), count(*) >= 20
    from matched_pairs where course = target_course
    union all
    select 11, 'life_satisfaction', 'Overall Life Satisfaction', 'anchor',
      round(avg(day0_life_satisfaction_raw), 1), round(avg(week10_life_satisfaction_raw), 1),
      round(avg(week10_life_satisfaction_raw) - avg(day0_life_satisfaction_raw), 1),
      case when avg(day0_life_satisfaction_raw) = 0 then null
        else round((avg(week10_life_satisfaction_raw) - avg(day0_life_satisfaction_raw)) / avg(day0_life_satisfaction_raw) * 100) end,
      count(*), count(*) >= 20
    from matched_pairs where course = target_course
    union all
    select 12, 'mornings_with_priority', 'Mornings With a Known Priority', 'anchor',
      round(avg(day0_mornings_with_priority_raw), 1), round(avg(week10_mornings_with_priority_raw), 1),
      round(avg(week10_mornings_with_priority_raw) - avg(day0_mornings_with_priority_raw), 1),
      case when avg(day0_mornings_with_priority_raw) = 0 then null
        else round((avg(week10_mornings_with_priority_raw) - avg(day0_mornings_with_priority_raw)) / avg(day0_mornings_with_priority_raw) * 100) end,
      count(*), count(*) >= 20
    from matched_pairs where course = target_course
    union all
    select 13, 'confidence_next_12mo', 'Confidence in the Next 12 Months', 'anchor',
      round(avg(day0_confidence_next_12mo_raw), 1), round(avg(week10_confidence_next_12mo_raw), 1),
      round(avg(week10_confidence_next_12mo_raw) - avg(day0_confidence_next_12mo_raw), 1),
      case when avg(day0_confidence_next_12mo_raw) = 0 then null
        else round((avg(week10_confidence_next_12mo_raw) - avg(day0_confidence_next_12mo_raw)) / avg(day0_confidence_next_12mo_raw) * 100) end,
      count(*), count(*) >= 20
    from matched_pairs where course = target_course
  ) m;

  insert into public_aggregates (
    course, computed_at, measured_since, last_anchor_date,
    total_submissions, n_started, n_pairs, completion_rate,
    pct_improved, pct_flat, pct_declined, n_declined,
    n_excluded_straightline, metrics
  ) values (
    target_course, now(), v_measured_since,
    (select last_anchor_date from public_aggregates where course = target_course),
    v_total_submissions, v_n_started, v_n_pairs, v_completion_rate,
    v_pct_improved, v_pct_flat, v_pct_declined, v_n_declined,
    v_n_excluded_straightline, coalesce(v_metrics, '[]'::jsonb)
  )
  on conflict (course) do update set
    computed_at = excluded.computed_at,
    measured_since = excluded.measured_since,
    total_submissions = excluded.total_submissions,
    n_started = excluded.n_started,
    n_pairs = excluded.n_pairs,
    completion_rate = excluded.completion_rate,
    pct_improved = excluded.pct_improved,
    pct_flat = excluded.pct_flat,
    pct_declined = excluded.pct_declined,
    n_declined = excluded.n_declined,
    n_excluded_straightline = excluded.n_excluded_straightline,
    metrics = excluded.metrics;
end;
$$;

revoke execute on function refresh_public_aggregates(text) from public;
grant execute on function refresh_public_aggregates(text) to service_role;

-- ---------------------------------------------------------------------------
-- Launch cutoff date. Raw data stays permanent and undeletable (Section 2 —
-- nothing about that changes), but the PUBLIC-FACING numbers can start their
-- clock at a real launch date instead of counting pre-launch/test
-- submissions. NULL (the default) means "count everything," today's
-- behavior. Set with one UPDATE whenever the real date is known:
--   update public_aggregates set record_starts_at = '2026-09-02' where course = 'ryl';
-- Preserved across nightly refreshes the same way last_anchor_date already
-- is — present in the insert's self-referential subquery, deliberately
-- absent from the on-conflict update list, so a refresh can never clobber it
-- once set.
alter table public_aggregates add column if not exists record_starts_at timestamptz;

create or replace function refresh_public_aggregates(target_course text)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_record_starts_at timestamptz;
  v_total_submissions int;
  v_measured_since timestamptz;
  v_n_started int;
  v_n_pairs int;
  v_completion_rate numeric;
  v_pct_improved numeric;
  v_pct_flat numeric;
  v_pct_declined numeric;
  v_n_declined int;
  v_n_excluded_straightline int;
  v_metrics jsonb;
begin
  select record_starts_at into v_record_starts_at
  from public_aggregates where course = target_course;

  select count(*), min(created_at) into v_total_submissions, v_measured_since
  from assessment_responses
  where course = target_course
    and (v_record_starts_at is null or created_at >= v_record_starts_at);

  select count(*) into v_n_started
  from assessment_responses
  where course = target_course and phase = 'first'
    and (v_record_starts_at is null or created_at >= v_record_starts_at);

  -- A pair only counts if BOTH sides of the journey happened on or after the
  -- cutoff — someone whose Day 0 predates launch doesn't get to count a
  -- post-launch Week 10 retake. Half-in-the-window doesn't count.
  select count(*) into v_n_pairs
  from matched_pairs
  where course = target_course
    and (v_record_starts_at is null or day0_at >= v_record_starts_at)
    and (v_record_starts_at is null or week10_at >= v_record_starts_at);

  v_completion_rate := case when v_n_started = 0 then 0
    else round((v_n_pairs::numeric / v_n_started) * 100) end;

  select count(*) into v_n_excluded_straightline
  from scored
  where course = target_course and straight_lined
    and (v_record_starts_at is null or created_at >= v_record_starts_at);

  with pair_deltas as (
    select (
      (week10_clear_thinking_pct - day0_clear_thinking_pct) +
      (week10_emotional_pct - day0_emotional_pct) +
      (week10_adversity_pct - day0_adversity_pct) +
      (week10_frame_pct - day0_frame_pct) +
      (week10_learning_pct - day0_learning_pct) +
      (week10_situational_pct - day0_situational_pct) +
      (week10_presence_pct - day0_presence_pct) +
      (week10_purpose_pct - day0_purpose_pct) +
      (week10_execution_pct - day0_execution_pct)
    ) / 9.0 as avg_domain_delta
    from matched_pairs
    where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
  )
  select
    case when v_n_pairs = 0 then 0 else round(100.0 * count(*) filter (where avg_domain_delta >= 5) / v_n_pairs) end,
    case when v_n_pairs = 0 then 0 else round(100.0 * count(*) filter (where avg_domain_delta > -5 and avg_domain_delta < 5) / v_n_pairs) end,
    case when v_n_pairs = 0 then 0 else round(100.0 * count(*) filter (where avg_domain_delta <= -5) / v_n_pairs) end,
    count(*) filter (where avg_domain_delta <= -5)
  into v_pct_improved, v_pct_flat, v_pct_declined, v_n_declined
  from pair_deltas;

  -- '- ord' strips the ordering helper column so the stored JSON matches
  -- the documented {key,label,type,day0_avg,week10_avg,delta_pts,delta_pct,
  -- n,published} shape exactly; order is preserved by jsonb_agg's ORDER BY.
  select jsonb_agg((to_jsonb(m) - 'ord') order by m.ord) into v_metrics
  from (
    select 1 as ord, 'clear_thinking' as key, 'Clear Thinking' as label, 'domain' as type,
      round(avg(day0_clear_thinking_pct)) as day0_avg, round(avg(week10_clear_thinking_pct)) as week10_avg,
      round(avg(week10_clear_thinking_pct) - avg(day0_clear_thinking_pct)) as delta_pts,
      case when avg(day0_clear_thinking_pct) = 0 then null
        else round((avg(week10_clear_thinking_pct) - avg(day0_clear_thinking_pct)) / avg(day0_clear_thinking_pct) * 100) end as delta_pct,
      count(*) as n, count(*) >= 20 as published
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 2, 'emotional', 'Emotional Steadiness', 'domain',
      round(avg(day0_emotional_pct)), round(avg(week10_emotional_pct)),
      round(avg(week10_emotional_pct) - avg(day0_emotional_pct)),
      case when avg(day0_emotional_pct) = 0 then null
        else round((avg(week10_emotional_pct) - avg(day0_emotional_pct)) / avg(day0_emotional_pct) * 100) end,
      count(*), count(*) >= 20
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 3, 'adversity', 'Adversity Recovery', 'domain',
      round(avg(day0_adversity_pct)), round(avg(week10_adversity_pct)),
      round(avg(week10_adversity_pct) - avg(day0_adversity_pct)),
      case when avg(day0_adversity_pct) = 0 then null
        else round((avg(week10_adversity_pct) - avg(day0_adversity_pct)) / avg(day0_adversity_pct) * 100) end,
      count(*), count(*) >= 20
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 4, 'frame', 'Frame Control', 'domain',
      round(avg(day0_frame_pct)), round(avg(week10_frame_pct)),
      round(avg(week10_frame_pct) - avg(day0_frame_pct)),
      case when avg(day0_frame_pct) = 0 then null
        else round((avg(week10_frame_pct) - avg(day0_frame_pct)) / avg(day0_frame_pct) * 100) end,
      count(*), count(*) >= 20
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 5, 'learning', 'Learning Agility', 'domain',
      round(avg(day0_learning_pct)), round(avg(week10_learning_pct)),
      round(avg(week10_learning_pct) - avg(day0_learning_pct)),
      case when avg(day0_learning_pct) = 0 then null
        else round((avg(week10_learning_pct) - avg(day0_learning_pct)) / avg(day0_learning_pct) * 100) end,
      count(*), count(*) >= 20
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 6, 'situational', 'Situational Awareness', 'domain',
      round(avg(day0_situational_pct)), round(avg(week10_situational_pct)),
      round(avg(week10_situational_pct) - avg(day0_situational_pct)),
      case when avg(day0_situational_pct) = 0 then null
        else round((avg(week10_situational_pct) - avg(day0_situational_pct)) / avg(day0_situational_pct) * 100) end,
      count(*), count(*) >= 20
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 7, 'presence', 'Presence', 'domain',
      round(avg(day0_presence_pct)), round(avg(week10_presence_pct)),
      round(avg(week10_presence_pct) - avg(day0_presence_pct)),
      case when avg(day0_presence_pct) = 0 then null
        else round((avg(week10_presence_pct) - avg(day0_presence_pct)) / avg(day0_presence_pct) * 100) end,
      count(*), count(*) >= 20
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 8, 'purpose', 'Purpose', 'domain',
      round(avg(day0_purpose_pct)), round(avg(week10_purpose_pct)),
      round(avg(week10_purpose_pct) - avg(day0_purpose_pct)),
      case when avg(day0_purpose_pct) = 0 then null
        else round((avg(week10_purpose_pct) - avg(day0_purpose_pct)) / avg(day0_purpose_pct) * 100) end,
      count(*), count(*) >= 20
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 9, 'execution', 'Execution', 'domain',
      round(avg(day0_execution_pct)), round(avg(week10_execution_pct)),
      round(avg(week10_execution_pct) - avg(day0_execution_pct)),
      case when avg(day0_execution_pct) = 0 then null
        else round((avg(week10_execution_pct) - avg(day0_execution_pct)) / avg(day0_execution_pct) * 100) end,
      count(*), count(*) >= 20
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 10, 'ai_index', 'AI Orchestration Index', 'domain',
      round(avg(day0_ai_index_pct)), round(avg(week10_ai_index_pct)),
      round(avg(week10_ai_index_pct) - avg(day0_ai_index_pct)),
      case when avg(day0_ai_index_pct) = 0 then null
        else round((avg(week10_ai_index_pct) - avg(day0_ai_index_pct)) / avg(day0_ai_index_pct) * 100) end,
      count(*), count(*) >= 20
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 11, 'life_satisfaction', 'Overall Life Satisfaction', 'anchor',
      round(avg(day0_life_satisfaction_raw), 1), round(avg(week10_life_satisfaction_raw), 1),
      round(avg(week10_life_satisfaction_raw) - avg(day0_life_satisfaction_raw), 1),
      case when avg(day0_life_satisfaction_raw) = 0 then null
        else round((avg(week10_life_satisfaction_raw) - avg(day0_life_satisfaction_raw)) / avg(day0_life_satisfaction_raw) * 100) end,
      count(*), count(*) >= 20
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 12, 'mornings_with_priority', 'Mornings With a Known Priority', 'anchor',
      round(avg(day0_mornings_with_priority_raw), 1), round(avg(week10_mornings_with_priority_raw), 1),
      round(avg(week10_mornings_with_priority_raw) - avg(day0_mornings_with_priority_raw), 1),
      case when avg(day0_mornings_with_priority_raw) = 0 then null
        else round((avg(week10_mornings_with_priority_raw) - avg(day0_mornings_with_priority_raw)) / avg(day0_mornings_with_priority_raw) * 100) end,
      count(*), count(*) >= 20
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 13, 'confidence_next_12mo', 'Confidence in the Next 12 Months', 'anchor',
      round(avg(day0_confidence_next_12mo_raw), 1), round(avg(week10_confidence_next_12mo_raw), 1),
      round(avg(week10_confidence_next_12mo_raw) - avg(day0_confidence_next_12mo_raw), 1),
      case when avg(day0_confidence_next_12mo_raw) = 0 then null
        else round((avg(week10_confidence_next_12mo_raw) - avg(day0_confidence_next_12mo_raw)) / avg(day0_confidence_next_12mo_raw) * 100) end,
      count(*), count(*) >= 20
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
  ) m;

  insert into public_aggregates (
    course, computed_at, measured_since, last_anchor_date, record_starts_at,
    total_submissions, n_started, n_pairs, completion_rate,
    pct_improved, pct_flat, pct_declined, n_declined,
    n_excluded_straightline, metrics
  ) values (
    target_course, now(), v_measured_since,
    (select last_anchor_date from public_aggregates where course = target_course),
    v_record_starts_at,
    v_total_submissions, v_n_started, v_n_pairs, v_completion_rate,
    v_pct_improved, v_pct_flat, v_pct_declined, v_n_declined,
    v_n_excluded_straightline, coalesce(v_metrics, '[]'::jsonb)
  )
  on conflict (course) do update set
    computed_at = excluded.computed_at,
    measured_since = excluded.measured_since,
    total_submissions = excluded.total_submissions,
    n_started = excluded.n_started,
    n_pairs = excluded.n_pairs,
    completion_rate = excluded.completion_rate,
    pct_improved = excluded.pct_improved,
    pct_flat = excluded.pct_flat,
    pct_declined = excluded.pct_declined,
    n_declined = excluded.n_declined,
    n_excluded_straightline = excluded.n_excluded_straightline,
    metrics = excluded.metrics;
    -- last_anchor_date and record_starts_at deliberately omitted here — a
    -- refresh must never clobber either once a human has set them.
end;
$$;

revoke execute on function refresh_public_aggregates(text) from public;
grant execute on function refresh_public_aggregates(text) to service_role;

-- ---------------------------------------------------------------------------
-- Change Order 01, Phase 1 — threshold consistency.
--
-- Fixes a real, already-live leak this phase's own audit step is designed to
-- catch: /aggregates.json was returning day0_avg/week10_avg/delta_pts/
-- delta_pct for every metric even when published=false — the page's UI
-- checked the flag, but the raw feed never did. With n=7 that was real
-- domain-level averages for 7 actual people, publicly fetchable. Fixed by
-- scrubbing at the single shared read path (lib/publicAggregates.ts), not
-- just the page — see that file's comment.
--
-- Also implements the Change Order's reversal of the original "decliners
-- always published regardless of N" rule: distribution now withholds below
-- threshold too, same as every per-metric figure. That's a deliberate
-- supersession of Section 2 of the original build brief, not an oversight.
--
-- publish_threshold() is the one exported gate everything imports —
-- everywhere that used to compare against a bare 20 now calls this instead.
create or replace function publish_threshold()
returns int
language sql
immutable
as $$
  select 20;
$$;

alter table public_aggregates add column if not exists distribution_published boolean not null default false;
-- Per-person average domain delta, one entry per finished pair, values only
-- — no identifiers, no submission-order correlation (sorted by value, not
-- by when the pair completed). Always computed; exposure gated the same way
-- as everything else — see lib/publicAggregates.ts.
alter table public_aggregates add column if not exists person_deltas jsonb;

create or replace function refresh_public_aggregates(target_course text)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_record_starts_at timestamptz;
  v_total_submissions int;
  v_measured_since timestamptz;
  v_n_started int;
  v_n_pairs int;
  v_completion_rate numeric;
  v_distribution_published boolean;
  v_pct_improved numeric;
  v_pct_flat numeric;
  v_pct_declined numeric;
  v_n_declined int;
  v_n_excluded_straightline int;
  v_metrics jsonb;
  v_person_deltas jsonb;
begin
  select record_starts_at into v_record_starts_at
  from public_aggregates where course = target_course;

  select count(*), min(created_at) into v_total_submissions, v_measured_since
  from assessment_responses
  where course = target_course
    and (v_record_starts_at is null or created_at >= v_record_starts_at);

  select count(*) into v_n_started
  from assessment_responses
  where course = target_course and phase = 'first'
    and (v_record_starts_at is null or created_at >= v_record_starts_at);

  select count(*) into v_n_pairs
  from matched_pairs
  where course = target_course
    and (v_record_starts_at is null or day0_at >= v_record_starts_at)
    and (v_record_starts_at is null or week10_at >= v_record_starts_at);

  v_completion_rate := case when v_n_started = 0 then 0
    else round((v_n_pairs::numeric / v_n_started) * 100) end;

  v_distribution_published := v_n_pairs >= publish_threshold();

  select count(*) into v_n_excluded_straightline
  from scored
  where course = target_course and straight_lined
    and (v_record_starts_at is null or created_at >= v_record_starts_at);

  with pair_deltas as (
    select (
      (week10_clear_thinking_pct - day0_clear_thinking_pct) +
      (week10_emotional_pct - day0_emotional_pct) +
      (week10_adversity_pct - day0_adversity_pct) +
      (week10_frame_pct - day0_frame_pct) +
      (week10_learning_pct - day0_learning_pct) +
      (week10_situational_pct - day0_situational_pct) +
      (week10_presence_pct - day0_presence_pct) +
      (week10_purpose_pct - day0_purpose_pct) +
      (week10_execution_pct - day0_execution_pct)
    ) / 9.0 as avg_domain_delta
    from matched_pairs
    where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
  )
  select
    case when v_n_pairs = 0 then 0 else round(100.0 * count(*) filter (where avg_domain_delta >= 5) / v_n_pairs) end,
    case when v_n_pairs = 0 then 0 else round(100.0 * count(*) filter (where avg_domain_delta > -5 and avg_domain_delta < 5) / v_n_pairs) end,
    case when v_n_pairs = 0 then 0 else round(100.0 * count(*) filter (where avg_domain_delta <= -5) / v_n_pairs) end,
    count(*) filter (where avg_domain_delta <= -5)
  into v_pct_improved, v_pct_flat, v_pct_declined, v_n_declined
  from pair_deltas;

  -- Values-only per-person deltas, sorted by value (not completion order) so
  -- nothing about *when* someone finished leaks alongside their outcome.
  with pair_deltas as (
    select (
      (week10_clear_thinking_pct - day0_clear_thinking_pct) +
      (week10_emotional_pct - day0_emotional_pct) +
      (week10_adversity_pct - day0_adversity_pct) +
      (week10_frame_pct - day0_frame_pct) +
      (week10_learning_pct - day0_learning_pct) +
      (week10_situational_pct - day0_situational_pct) +
      (week10_presence_pct - day0_presence_pct) +
      (week10_purpose_pct - day0_purpose_pct) +
      (week10_execution_pct - day0_execution_pct)
    ) / 9.0 as avg_domain_delta
    from matched_pairs
    where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
  )
  select jsonb_agg(round(avg_domain_delta) order by avg_domain_delta) into v_person_deltas
  from pair_deltas;

  select jsonb_agg((to_jsonb(m) - 'ord') order by m.ord) into v_metrics
  from (
    select 1 as ord, 'clear_thinking' as key, 'Clear Thinking' as label, 'domain' as type,
      round(avg(day0_clear_thinking_pct)) as day0_avg, round(avg(week10_clear_thinking_pct)) as week10_avg,
      round(avg(week10_clear_thinking_pct) - avg(day0_clear_thinking_pct)) as delta_pts,
      case when avg(day0_clear_thinking_pct) = 0 then null
        else round((avg(week10_clear_thinking_pct) - avg(day0_clear_thinking_pct)) / avg(day0_clear_thinking_pct) * 100) end as delta_pct,
      count(*) as n, count(*) >= publish_threshold() as published
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 2, 'emotional', 'Emotional Steadiness', 'domain',
      round(avg(day0_emotional_pct)), round(avg(week10_emotional_pct)),
      round(avg(week10_emotional_pct) - avg(day0_emotional_pct)),
      case when avg(day0_emotional_pct) = 0 then null
        else round((avg(week10_emotional_pct) - avg(day0_emotional_pct)) / avg(day0_emotional_pct) * 100) end,
      count(*), count(*) >= publish_threshold()
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 3, 'adversity', 'Adversity Recovery', 'domain',
      round(avg(day0_adversity_pct)), round(avg(week10_adversity_pct)),
      round(avg(week10_adversity_pct) - avg(day0_adversity_pct)),
      case when avg(day0_adversity_pct) = 0 then null
        else round((avg(week10_adversity_pct) - avg(day0_adversity_pct)) / avg(day0_adversity_pct) * 100) end,
      count(*), count(*) >= publish_threshold()
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 4, 'frame', 'Frame Control', 'domain',
      round(avg(day0_frame_pct)), round(avg(week10_frame_pct)),
      round(avg(week10_frame_pct) - avg(day0_frame_pct)),
      case when avg(day0_frame_pct) = 0 then null
        else round((avg(week10_frame_pct) - avg(day0_frame_pct)) / avg(day0_frame_pct) * 100) end,
      count(*), count(*) >= publish_threshold()
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 5, 'learning', 'Learning Agility', 'domain',
      round(avg(day0_learning_pct)), round(avg(week10_learning_pct)),
      round(avg(week10_learning_pct) - avg(day0_learning_pct)),
      case when avg(day0_learning_pct) = 0 then null
        else round((avg(week10_learning_pct) - avg(day0_learning_pct)) / avg(day0_learning_pct) * 100) end,
      count(*), count(*) >= publish_threshold()
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 6, 'situational', 'Situational Awareness', 'domain',
      round(avg(day0_situational_pct)), round(avg(week10_situational_pct)),
      round(avg(week10_situational_pct) - avg(day0_situational_pct)),
      case when avg(day0_situational_pct) = 0 then null
        else round((avg(week10_situational_pct) - avg(day0_situational_pct)) / avg(day0_situational_pct) * 100) end,
      count(*), count(*) >= publish_threshold()
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 7, 'presence', 'Presence', 'domain',
      round(avg(day0_presence_pct)), round(avg(week10_presence_pct)),
      round(avg(week10_presence_pct) - avg(day0_presence_pct)),
      case when avg(day0_presence_pct) = 0 then null
        else round((avg(week10_presence_pct) - avg(day0_presence_pct)) / avg(day0_presence_pct) * 100) end,
      count(*), count(*) >= publish_threshold()
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 8, 'purpose', 'Purpose', 'domain',
      round(avg(day0_purpose_pct)), round(avg(week10_purpose_pct)),
      round(avg(week10_purpose_pct) - avg(day0_purpose_pct)),
      case when avg(day0_purpose_pct) = 0 then null
        else round((avg(week10_purpose_pct) - avg(day0_purpose_pct)) / avg(day0_purpose_pct) * 100) end,
      count(*), count(*) >= publish_threshold()
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 9, 'execution', 'Execution', 'domain',
      round(avg(day0_execution_pct)), round(avg(week10_execution_pct)),
      round(avg(week10_execution_pct) - avg(day0_execution_pct)),
      case when avg(day0_execution_pct) = 0 then null
        else round((avg(week10_execution_pct) - avg(day0_execution_pct)) / avg(day0_execution_pct) * 100) end,
      count(*), count(*) >= publish_threshold()
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 10, 'ai_index', 'AI Orchestration Index', 'domain',
      round(avg(day0_ai_index_pct)), round(avg(week10_ai_index_pct)),
      round(avg(week10_ai_index_pct) - avg(day0_ai_index_pct)),
      case when avg(day0_ai_index_pct) = 0 then null
        else round((avg(week10_ai_index_pct) - avg(day0_ai_index_pct)) / avg(day0_ai_index_pct) * 100) end,
      count(*), count(*) >= publish_threshold()
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 11, 'life_satisfaction', 'Overall Life Satisfaction', 'anchor',
      round(avg(day0_life_satisfaction_raw), 1), round(avg(week10_life_satisfaction_raw), 1),
      round(avg(week10_life_satisfaction_raw) - avg(day0_life_satisfaction_raw), 1),
      case when avg(day0_life_satisfaction_raw) = 0 then null
        else round((avg(week10_life_satisfaction_raw) - avg(day0_life_satisfaction_raw)) / avg(day0_life_satisfaction_raw) * 100) end,
      count(*), count(*) >= publish_threshold()
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 12, 'mornings_with_priority', 'Mornings With a Known Priority', 'anchor',
      round(avg(day0_mornings_with_priority_raw), 1), round(avg(week10_mornings_with_priority_raw), 1),
      round(avg(week10_mornings_with_priority_raw) - avg(day0_mornings_with_priority_raw), 1),
      case when avg(day0_mornings_with_priority_raw) = 0 then null
        else round((avg(week10_mornings_with_priority_raw) - avg(day0_mornings_with_priority_raw)) / avg(day0_mornings_with_priority_raw) * 100) end,
      count(*), count(*) >= publish_threshold()
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 13, 'confidence_next_12mo', 'Confidence in the Next 12 Months', 'anchor',
      round(avg(day0_confidence_next_12mo_raw), 1), round(avg(week10_confidence_next_12mo_raw), 1),
      round(avg(week10_confidence_next_12mo_raw) - avg(day0_confidence_next_12mo_raw), 1),
      case when avg(day0_confidence_next_12mo_raw) = 0 then null
        else round((avg(week10_confidence_next_12mo_raw) - avg(day0_confidence_next_12mo_raw)) / avg(day0_confidence_next_12mo_raw) * 100) end,
      count(*), count(*) >= publish_threshold()
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
  ) m;

  insert into public_aggregates (
    course, computed_at, measured_since, last_anchor_date, record_starts_at,
    total_submissions, n_started, n_pairs, completion_rate,
    distribution_published, pct_improved, pct_flat, pct_declined, n_declined,
    n_excluded_straightline, metrics, person_deltas
  ) values (
    target_course, now(), v_measured_since,
    (select last_anchor_date from public_aggregates where course = target_course),
    v_record_starts_at,
    v_total_submissions, v_n_started, v_n_pairs, v_completion_rate,
    v_distribution_published, v_pct_improved, v_pct_flat, v_pct_declined, v_n_declined,
    v_n_excluded_straightline, coalesce(v_metrics, '[]'::jsonb), coalesce(v_person_deltas, '[]'::jsonb)
  )
  on conflict (course) do update set
    computed_at = excluded.computed_at,
    measured_since = excluded.measured_since,
    total_submissions = excluded.total_submissions,
    n_started = excluded.n_started,
    n_pairs = excluded.n_pairs,
    completion_rate = excluded.completion_rate,
    distribution_published = excluded.distribution_published,
    pct_improved = excluded.pct_improved,
    pct_flat = excluded.pct_flat,
    pct_declined = excluded.pct_declined,
    n_declined = excluded.n_declined,
    n_excluded_straightline = excluded.n_excluded_straightline,
    metrics = excluded.metrics,
    person_deltas = excluded.person_deltas;
    -- last_anchor_date and record_starts_at deliberately omitted here — a
    -- refresh must never clobber either once a human has set them.
end;
$$;

revoke execute on function refresh_public_aggregates(text) from public;
grant execute on function refresh_public_aggregates(text) to service_role;
revoke execute on function publish_threshold() from public;
grant execute on function publish_threshold() to service_role, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Change Order 01, Phase 2 — funnel restructure.
--
-- The old funnel conflated two different questions into one "completion
-- rate": what fraction of everyone who ever started finished (n_pairs /
-- n_started), which quietly counts people who haven't had a chance to reach
-- Week 10 yet as if they'd failed to. The new definition only measures
-- people who've actually had the full ten weeks to finish:
--
--   eligible     = Day-0 submission is 10+ weeks old (had the chance to
--                   reach Week 10, whether or not they did)
--   in_progress  = has a Day-0 baseline, but ten weeks hasn't elapsed yet
--                   (n_started - n_eligible; every starter is exactly one
--                   or the other)
--   completion_rate = n_pairs / n_eligible — never n_started. When
--                   n_eligible = 0 (a brand-new cohort, nobody's ten weeks
--                   old yet), completion_rate is null: the page renders an
--                   em dash, never a misleading 0% or a NaN.
create or replace function publish_threshold()
returns int
language sql
immutable
as $$
  select 20;
$$;

alter table public_aggregates alter column completion_rate drop not null;
alter table public_aggregates add column if not exists n_eligible int not null default 0;
alter table public_aggregates add column if not exists n_in_progress int not null default 0;

create or replace function refresh_public_aggregates(target_course text)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_record_starts_at timestamptz;
  v_total_submissions int;
  v_measured_since timestamptz;
  v_n_started int;
  v_n_eligible int;
  v_n_in_progress int;
  v_n_pairs int;
  v_completion_rate numeric;
  v_distribution_published boolean;
  v_pct_improved numeric;
  v_pct_flat numeric;
  v_pct_declined numeric;
  v_n_declined int;
  v_n_excluded_straightline int;
  v_metrics jsonb;
  v_person_deltas jsonb;
begin
  select record_starts_at into v_record_starts_at
  from public_aggregates where course = target_course;

  select count(*), min(created_at) into v_total_submissions, v_measured_since
  from assessment_responses
  where course = target_course
    and (v_record_starts_at is null or created_at >= v_record_starts_at);

  select count(*) into v_n_started
  from assessment_responses
  where course = target_course and phase = 'first'
    and (v_record_starts_at is null or created_at >= v_record_starts_at);

  select count(*) into v_n_eligible
  from assessment_responses
  where course = target_course and phase = 'first'
    and created_at <= now() - interval '10 weeks'
    and (v_record_starts_at is null or created_at >= v_record_starts_at);

  v_n_in_progress := v_n_started - v_n_eligible;

  select count(*) into v_n_pairs
  from matched_pairs
  where course = target_course
    and (v_record_starts_at is null or day0_at >= v_record_starts_at)
    and (v_record_starts_at is null or week10_at >= v_record_starts_at);

  v_completion_rate := case when v_n_eligible = 0 then null
    else round((v_n_pairs::numeric / v_n_eligible) * 100) end;

  v_distribution_published := v_n_pairs >= publish_threshold();

  select count(*) into v_n_excluded_straightline
  from scored
  where course = target_course and straight_lined
    and (v_record_starts_at is null or created_at >= v_record_starts_at);

  with pair_deltas as (
    select (
      (week10_clear_thinking_pct - day0_clear_thinking_pct) +
      (week10_emotional_pct - day0_emotional_pct) +
      (week10_adversity_pct - day0_adversity_pct) +
      (week10_frame_pct - day0_frame_pct) +
      (week10_learning_pct - day0_learning_pct) +
      (week10_situational_pct - day0_situational_pct) +
      (week10_presence_pct - day0_presence_pct) +
      (week10_purpose_pct - day0_purpose_pct) +
      (week10_execution_pct - day0_execution_pct)
    ) / 9.0 as avg_domain_delta
    from matched_pairs
    where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
  )
  select
    case when v_n_pairs = 0 then 0 else round(100.0 * count(*) filter (where avg_domain_delta >= 5) / v_n_pairs) end,
    case when v_n_pairs = 0 then 0 else round(100.0 * count(*) filter (where avg_domain_delta > -5 and avg_domain_delta < 5) / v_n_pairs) end,
    case when v_n_pairs = 0 then 0 else round(100.0 * count(*) filter (where avg_domain_delta <= -5) / v_n_pairs) end,
    count(*) filter (where avg_domain_delta <= -5)
  into v_pct_improved, v_pct_flat, v_pct_declined, v_n_declined
  from pair_deltas;

  with pair_deltas as (
    select (
      (week10_clear_thinking_pct - day0_clear_thinking_pct) +
      (week10_emotional_pct - day0_emotional_pct) +
      (week10_adversity_pct - day0_adversity_pct) +
      (week10_frame_pct - day0_frame_pct) +
      (week10_learning_pct - day0_learning_pct) +
      (week10_situational_pct - day0_situational_pct) +
      (week10_presence_pct - day0_presence_pct) +
      (week10_purpose_pct - day0_purpose_pct) +
      (week10_execution_pct - day0_execution_pct)
    ) / 9.0 as avg_domain_delta
    from matched_pairs
    where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
  )
  select jsonb_agg(round(avg_domain_delta) order by avg_domain_delta) into v_person_deltas
  from pair_deltas;

  select jsonb_agg((to_jsonb(m) - 'ord') order by m.ord) into v_metrics
  from (
    select 1 as ord, 'clear_thinking' as key, 'Clear Thinking' as label, 'domain' as type,
      round(avg(day0_clear_thinking_pct)) as day0_avg, round(avg(week10_clear_thinking_pct)) as week10_avg,
      round(avg(week10_clear_thinking_pct) - avg(day0_clear_thinking_pct)) as delta_pts,
      case when avg(day0_clear_thinking_pct) = 0 then null
        else round((avg(week10_clear_thinking_pct) - avg(day0_clear_thinking_pct)) / avg(day0_clear_thinking_pct) * 100) end as delta_pct,
      count(*) as n, count(*) >= publish_threshold() as published
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 2, 'emotional', 'Emotional Steadiness', 'domain',
      round(avg(day0_emotional_pct)), round(avg(week10_emotional_pct)),
      round(avg(week10_emotional_pct) - avg(day0_emotional_pct)),
      case when avg(day0_emotional_pct) = 0 then null
        else round((avg(week10_emotional_pct) - avg(day0_emotional_pct)) / avg(day0_emotional_pct) * 100) end,
      count(*), count(*) >= publish_threshold()
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 3, 'adversity', 'Adversity Recovery', 'domain',
      round(avg(day0_adversity_pct)), round(avg(week10_adversity_pct)),
      round(avg(week10_adversity_pct) - avg(day0_adversity_pct)),
      case when avg(day0_adversity_pct) = 0 then null
        else round((avg(week10_adversity_pct) - avg(day0_adversity_pct)) / avg(day0_adversity_pct) * 100) end,
      count(*), count(*) >= publish_threshold()
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 4, 'frame', 'Frame Control', 'domain',
      round(avg(day0_frame_pct)), round(avg(week10_frame_pct)),
      round(avg(week10_frame_pct) - avg(day0_frame_pct)),
      case when avg(day0_frame_pct) = 0 then null
        else round((avg(week10_frame_pct) - avg(day0_frame_pct)) / avg(day0_frame_pct) * 100) end,
      count(*), count(*) >= publish_threshold()
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 5, 'learning', 'Learning Agility', 'domain',
      round(avg(day0_learning_pct)), round(avg(week10_learning_pct)),
      round(avg(week10_learning_pct) - avg(day0_learning_pct)),
      case when avg(day0_learning_pct) = 0 then null
        else round((avg(week10_learning_pct) - avg(day0_learning_pct)) / avg(day0_learning_pct) * 100) end,
      count(*), count(*) >= publish_threshold()
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 6, 'situational', 'Situational Awareness', 'domain',
      round(avg(day0_situational_pct)), round(avg(week10_situational_pct)),
      round(avg(week10_situational_pct) - avg(day0_situational_pct)),
      case when avg(day0_situational_pct) = 0 then null
        else round((avg(week10_situational_pct) - avg(day0_situational_pct)) / avg(day0_situational_pct) * 100) end,
      count(*), count(*) >= publish_threshold()
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 7, 'presence', 'Presence', 'domain',
      round(avg(day0_presence_pct)), round(avg(week10_presence_pct)),
      round(avg(week10_presence_pct) - avg(day0_presence_pct)),
      case when avg(day0_presence_pct) = 0 then null
        else round((avg(week10_presence_pct) - avg(day0_presence_pct)) / avg(day0_presence_pct) * 100) end,
      count(*), count(*) >= publish_threshold()
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 8, 'purpose', 'Purpose', 'domain',
      round(avg(day0_purpose_pct)), round(avg(week10_purpose_pct)),
      round(avg(week10_purpose_pct) - avg(day0_purpose_pct)),
      case when avg(day0_purpose_pct) = 0 then null
        else round((avg(week10_purpose_pct) - avg(day0_purpose_pct)) / avg(day0_purpose_pct) * 100) end,
      count(*), count(*) >= publish_threshold()
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 9, 'execution', 'Execution', 'domain',
      round(avg(day0_execution_pct)), round(avg(week10_execution_pct)),
      round(avg(week10_execution_pct) - avg(day0_execution_pct)),
      case when avg(day0_execution_pct) = 0 then null
        else round((avg(week10_execution_pct) - avg(day0_execution_pct)) / avg(day0_execution_pct) * 100) end,
      count(*), count(*) >= publish_threshold()
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 10, 'ai_index', 'AI Orchestration Index', 'domain',
      round(avg(day0_ai_index_pct)), round(avg(week10_ai_index_pct)),
      round(avg(week10_ai_index_pct) - avg(day0_ai_index_pct)),
      case when avg(day0_ai_index_pct) = 0 then null
        else round((avg(week10_ai_index_pct) - avg(day0_ai_index_pct)) / avg(day0_ai_index_pct) * 100) end,
      count(*), count(*) >= publish_threshold()
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 11, 'life_satisfaction', 'Overall Life Satisfaction', 'anchor',
      round(avg(day0_life_satisfaction_raw), 1), round(avg(week10_life_satisfaction_raw), 1),
      round(avg(week10_life_satisfaction_raw) - avg(day0_life_satisfaction_raw), 1),
      case when avg(day0_life_satisfaction_raw) = 0 then null
        else round((avg(week10_life_satisfaction_raw) - avg(day0_life_satisfaction_raw)) / avg(day0_life_satisfaction_raw) * 100) end,
      count(*), count(*) >= publish_threshold()
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 12, 'mornings_with_priority', 'Mornings With a Known Priority', 'anchor',
      round(avg(day0_mornings_with_priority_raw), 1), round(avg(week10_mornings_with_priority_raw), 1),
      round(avg(week10_mornings_with_priority_raw) - avg(day0_mornings_with_priority_raw), 1),
      case when avg(day0_mornings_with_priority_raw) = 0 then null
        else round((avg(week10_mornings_with_priority_raw) - avg(day0_mornings_with_priority_raw)) / avg(day0_mornings_with_priority_raw) * 100) end,
      count(*), count(*) >= publish_threshold()
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
    union all
    select 13, 'confidence_next_12mo', 'Confidence in the Next 12 Months', 'anchor',
      round(avg(day0_confidence_next_12mo_raw), 1), round(avg(week10_confidence_next_12mo_raw), 1),
      round(avg(week10_confidence_next_12mo_raw) - avg(day0_confidence_next_12mo_raw), 1),
      case when avg(day0_confidence_next_12mo_raw) = 0 then null
        else round((avg(week10_confidence_next_12mo_raw) - avg(day0_confidence_next_12mo_raw)) / avg(day0_confidence_next_12mo_raw) * 100) end,
      count(*), count(*) >= publish_threshold()
    from matched_pairs where course = target_course
      and (v_record_starts_at is null or day0_at >= v_record_starts_at)
      and (v_record_starts_at is null or week10_at >= v_record_starts_at)
  ) m;

  insert into public_aggregates (
    course, computed_at, measured_since, last_anchor_date, record_starts_at,
    total_submissions, n_started, n_eligible, n_in_progress, n_pairs, completion_rate,
    distribution_published, pct_improved, pct_flat, pct_declined, n_declined,
    n_excluded_straightline, metrics, person_deltas
  ) values (
    target_course, now(), v_measured_since,
    (select last_anchor_date from public_aggregates where course = target_course),
    v_record_starts_at,
    v_total_submissions, v_n_started, v_n_eligible, v_n_in_progress, v_n_pairs, v_completion_rate,
    v_distribution_published, v_pct_improved, v_pct_flat, v_pct_declined, v_n_declined,
    v_n_excluded_straightline, coalesce(v_metrics, '[]'::jsonb), coalesce(v_person_deltas, '[]'::jsonb)
  )
  on conflict (course) do update set
    computed_at = excluded.computed_at,
    measured_since = excluded.measured_since,
    total_submissions = excluded.total_submissions,
    n_started = excluded.n_started,
    n_eligible = excluded.n_eligible,
    n_in_progress = excluded.n_in_progress,
    n_pairs = excluded.n_pairs,
    completion_rate = excluded.completion_rate,
    distribution_published = excluded.distribution_published,
    pct_improved = excluded.pct_improved,
    pct_flat = excluded.pct_flat,
    pct_declined = excluded.pct_declined,
    n_declined = excluded.n_declined,
    n_excluded_straightline = excluded.n_excluded_straightline,
    metrics = excluded.metrics,
    person_deltas = excluded.person_deltas;
    -- last_anchor_date and record_starts_at deliberately omitted here — a
    -- refresh must never clobber either once a human has set them.
end;
$$;

revoke execute on function refresh_public_aggregates(text) from public;
grant execute on function refresh_public_aggregates(text) to service_role;
revoke execute on function publish_threshold() from public;
grant execute on function publish_threshold() to service_role, anon, authenticated;
