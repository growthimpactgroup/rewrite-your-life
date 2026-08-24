-- Launch cutoff date — verification.
-- Paste into the Supabase SQL editor AFTER the "Launch cutoff date" block
-- has been run. Entirely inside begin/rollback against an isolated fake
-- course ('ryl_cutoff_test') — nothing here touches real 'ryl' data or its
-- aggregate row, and nothing persists after the rollback.

begin;

-- Pair A: both Day 0 and Week 10 dated well BEFORE the intended cutoff.
-- Expect: excluded once a cutoff is set.
insert into assessment_responses (course, phase, email, consent, created_at,
  item_1,item_2,item_3,item_4,item_5,item_6,item_7,item_8,item_9,item_10,
  item_11,item_12,item_13,item_14,item_15,item_16,item_17,item_18,
  item_19,item_20,item_21,item_22,item_23,item_24,item_25,item_26,item_27)
values
  ('ryl_cutoff_test', 'first', 'pair-a@example.com', true, '2026-01-01',
   3,3,3,3,3,3,3,8,3,3, 3,3,3,8,3,3,3,3, 3,3,3,3,3,3,3,3,3),
  ('ryl_cutoff_test', 'week10', 'pair-a@example.com', true, '2026-01-15',
   8,8,8,8,8,8,8,3,8,8, 8,8,8,3,8,8,8,8, 8,8,8,8,8,8,8,8,8);

-- Pair B: both Day 0 and Week 10 dated well AFTER the intended cutoff.
-- Expect: always counted, cutoff or not.
insert into assessment_responses (course, phase, email, consent, created_at,
  item_1,item_2,item_3,item_4,item_5,item_6,item_7,item_8,item_9,item_10,
  item_11,item_12,item_13,item_14,item_15,item_16,item_17,item_18,
  item_19,item_20,item_21,item_22,item_23,item_24,item_25,item_26,item_27)
values
  ('ryl_cutoff_test', 'first', 'pair-b@example.com', true, '2026-09-05',
   3,3,3,3,3,3,3,8,3,3, 3,3,3,8,3,3,3,3, 3,3,3,3,3,3,3,3,3),
  ('ryl_cutoff_test', 'week10', 'pair-b@example.com', true, '2026-09-20',
   8,8,8,8,8,8,8,3,8,8, 8,8,8,3,8,8,8,8, 8,8,8,8,8,8,8,8,8);

-- Pair C — the subtle case: Day 0 BEFORE the cutoff, Week 10 AFTER it.
-- Expect: excluded once a cutoff is set — half-in-the-window doesn't count.
insert into assessment_responses (course, phase, email, consent, created_at,
  item_1,item_2,item_3,item_4,item_5,item_6,item_7,item_8,item_9,item_10,
  item_11,item_12,item_13,item_14,item_15,item_16,item_17,item_18,
  item_19,item_20,item_21,item_22,item_23,item_24,item_25,item_26,item_27)
values
  ('ryl_cutoff_test', 'first', 'pair-c@example.com', true, '2026-01-10',
   3,3,3,3,3,3,3,8,3,3, 3,3,3,8,3,3,3,3, 3,3,3,3,3,3,3,3,3),
  ('ryl_cutoff_test', 'week10', 'pair-c@example.com', true, '2026-09-10',
   8,8,8,8,8,8,8,3,8,8, 8,8,8,3,8,8,8,8, 8,8,8,8,8,8,8,8,8);

-- Step 1: refresh with NO cutoff set (record_starts_at is NULL by default
-- for a brand-new course row). Expect n_pairs = 3 — all three count,
-- matching today's real behavior exactly.
select refresh_public_aggregates('ryl_cutoff_test');
select course, n_pairs, record_starts_at from public_aggregates where course = 'ryl_cutoff_test';

-- Step 2: set a cutoff between the "before" and "after" timestamps, refresh
-- again. Expect n_pairs = 1 — only Pair B. Pair A (fully before) and Pair C
-- (half before, half after) are both correctly excluded.
update public_aggregates set record_starts_at = '2026-09-01' where course = 'ryl_cutoff_test';
select refresh_public_aggregates('ryl_cutoff_test');
select course, n_pairs, record_starts_at, measured_since from public_aggregates where course = 'ryl_cutoff_test';

rollback; -- nothing above this line persists.
