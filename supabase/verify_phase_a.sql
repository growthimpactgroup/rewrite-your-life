-- Public Outcome Record — Phase A verification.
-- Paste this into the Supabase SQL editor AFTER the Phase A block in
-- schema.sql has been run. Two parts:
--
--   1. A synthetic edge-case test, entirely inside begin/rollback, using
--      isolated fake course names ('ryl_test', 'ryl_test_small') so it can
--      never collide with or pollute the real 'ryl' data or aggregate row.
--      Nothing from this part persists.
--   2. A real refresh against the real 'ryl' data — this part DOES persist
--      (it's exactly what the nightly job will do in Phase B) and produces
--      the actual Phase A output to report back.
--
-- Run the whole file at once, or part 1 and part 2 as separate statements —
-- either way, only part 2's effects remain afterward.

begin;

-- Case 1: 20 clean, strongly-improving pairs — should cross the N>=20
-- threshold (every metrics[].published should read true) and show large
-- positive deltas.
insert into assessment_responses (course, phase, email, consent,
  item_1,item_2,item_3,item_4,item_5,item_6,item_7,item_8,item_9,item_10,
  item_11,item_12,item_13,item_14,item_15,item_16,item_17,item_18,
  item_19,item_20,item_21,item_22,item_23,item_24,item_25,item_26,item_27)
select 'ryl_test', 'first', 'test-pair-' || n || '@example.com', true,
  3,3,3,3,3,3,3,8,3,3, 3,3,3,8,3,3,3,3, 3,3,3,3,3,3,3,3,3
from generate_series(1, 20) as n;

insert into assessment_responses (course, phase, email, consent,
  item_1,item_2,item_3,item_4,item_5,item_6,item_7,item_8,item_9,item_10,
  item_11,item_12,item_13,item_14,item_15,item_16,item_17,item_18,
  item_19,item_20,item_21,item_22,item_23,item_24,item_25,item_26,item_27)
select 'ryl_test', 'week10', 'test-pair-' || n || '@example.com', true,
  8,8,8,8,8,8,8,3,8,8, 8,8,8,3,8,8,8,8, 8,8,8,8,8,8,8,8,8
from generate_series(1, 20) as n;

-- Case 2: a straight-lined day-0 row (12 identical answers, run spans item
-- 8) paired with an otherwise-normal week10 row for the same email — this
-- pair must NOT appear in matched_pairs at all, and this row must count
-- toward n_excluded_straightline.
insert into assessment_responses (course, phase, email, consent,
  item_1,item_2,item_3,item_4,item_5,item_6,item_7,item_8,item_9,item_10,
  item_11,item_12,item_13,item_14,item_15,item_16,item_17,item_18,
  item_19,item_20,item_21,item_22,item_23,item_24,item_25,item_26,item_27)
values
  ('ryl_test', 'first', 'straightliner@example.com', true,
   5,5,5,5,5,5,5,5,5,5, 5,5,3,8,3,3,3,3, 3,3,3,3,3,3,3,3,3),
  ('ryl_test', 'week10', 'straightliner@example.com', true,
   8,8,8,8,8,8,8,3,8,8, 8,8,8,3,8,8,8,8, 8,8,8,8,8,8,8,8,8);

-- Case 3: one clear DECLINE pair (week10 scores lower than day0 across the
-- board) — proves the decliner distribution and negative delta math. This
-- section can never be filtered or hidden per Section 2, so it must show up
-- honestly in pct_declined / n_declined.
insert into assessment_responses (course, phase, email, consent,
  item_1,item_2,item_3,item_4,item_5,item_6,item_7,item_8,item_9,item_10,
  item_11,item_12,item_13,item_14,item_15,item_16,item_17,item_18,
  item_19,item_20,item_21,item_22,item_23,item_24,item_25,item_26,item_27)
values
  ('ryl_test', 'first', 'decliner@example.com', true,
   8,8,8,8,8,8,8,3,8,8, 8,8,8,3,8,8,8,8, 8,8,8,8,8,8,8,8,8),
  ('ryl_test', 'week10', 'decliner@example.com', true,
   3,3,3,3,3,3,3,8,3,3, 3,3,3,8,3,3,3,3, 3,3,3,3,3,3,3,3,3);

-- Case 4: a second, smaller test course with only 5 pairs — every
-- metrics[].published must stay false (below the N>=20 threshold).
insert into assessment_responses (course, phase, email, consent,
  item_1,item_2,item_3,item_4,item_5,item_6,item_7,item_8,item_9,item_10,
  item_11,item_12,item_13,item_14,item_15,item_16,item_17,item_18,
  item_19,item_20,item_21,item_22,item_23,item_24,item_25,item_26,item_27)
select 'ryl_test_small', 'first', 'small-pair-' || n || '@example.com', true,
  3,3,3,3,3,3,3,8,3,3, 3,3,3,8,3,3,3,3, 3,3,3,3,3,3,3,3,3
from generate_series(1, 5) as n;

insert into assessment_responses (course, phase, email, consent,
  item_1,item_2,item_3,item_4,item_5,item_6,item_7,item_8,item_9,item_10,
  item_11,item_12,item_13,item_14,item_15,item_16,item_17,item_18,
  item_19,item_20,item_21,item_22,item_23,item_24,item_25,item_26,item_27)
select 'ryl_test_small', 'week10', 'small-pair-' || n || '@example.com', true,
  8,8,8,8,8,8,8,3,8,8, 8,8,8,3,8,8,8,8, 8,8,8,8,8,8,8,8,8
from generate_series(1, 5) as n;

-- Sanity check on the straight-line row count and pair exclusion before
-- even running the refresh function:
--   expect: n_excluded_straightline = 1 for ryl_test (the day-0 row of
--   'straightliner@example.com' only — its week10 row isn't straight-lined),
--   and the straightliner's email never appears in matched_pairs.
select
  (select count(*) from scored where course = 'ryl_test' and straight_lined) as straight_lined_rows,
  (select count(*) from matched_pairs where course = 'ryl_test' and email_normalized = 'straightliner@example.com') as straightliner_pair_count;

select refresh_public_aggregates('ryl_test');
select refresh_public_aggregates('ryl_test_small');

-- Expect for ryl_test: n_pairs = 21 (20 from case 1 + 1 decliner from case
-- 3; the straightliner is excluded), every metrics[].published = true
-- (n=21 >= 20), pct_declined reflects exactly the 1 decliner out of 21,
-- n_excluded_straightline = 1.
select course, n_pairs, completion_rate, pct_improved, pct_flat, pct_declined,
       n_declined, n_excluded_straightline, jsonb_pretty(metrics)
from public_aggregates
where course in ('ryl_test', 'ryl_test_small')
order by course;

-- Expect for ryl_test_small: n_pairs = 5, every metrics[].published = false.

-- Immutability check: both of these must raise
-- "assessment_responses is insert-only — ... is not permitted".
update assessment_responses set consent = consent where course = 'ryl_test'; -- expect: exception
delete from assessment_responses where course = 'ryl_test'; -- expect: exception (never reached if the line above already raised)

rollback; -- nothing above this line persists.

-- ---------------------------------------------------------------------------
-- Part 2 — real refresh, persists for real. This is exactly what the
-- nightly job will call in Phase B. Right now, with 7 real matched pairs,
-- expect every metrics[].published = false (all under 20) while funnel and
-- distribution numbers are populated and shown regardless, per the
-- "always published" rules in Section 2.
select refresh_public_aggregates('ryl');

select course, computed_at, measured_since, total_submissions, n_started,
       n_pairs, completion_rate, pct_improved, pct_flat, pct_declined,
       n_declined, n_excluded_straightline, jsonb_pretty(metrics)
from public_aggregates
where course = 'ryl';
