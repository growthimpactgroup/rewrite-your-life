-- Migration: Purge test data and reset record (2026-09-12)
-- Requirement: Remove all test submissions, reset "measured_since" to first real row
-- Status: BACKUP BEFORE RUNNING - this is destructive

-- Step 1: Identify test data markers (run these SELECT queries first to verify)
-- Test submissions typically:
--  - Have identical or near-identical email patterns
--  - Created during development (specific date ranges)
--  - Have placeholder/test email domains (test@, admin@, etc.)

-- Example test data deletion (customize based on your actual test data):
-- DELETE FROM assessment_responses WHERE email LIKE 'test%' OR email LIKE 'admin%';
-- DELETE FROM assessment_responses WHERE created_at < '2026-09-07';

-- For the Fall 2026 launch, run these queries ONLY after verifying test data identification:

-- BEGIN TRANSACTION (can ROLLBACK if something looks wrong)
begin;

-- Step 2: Verify what you're about to delete
select count(*) as rows_to_delete, min(created_at) as earliest, max(created_at) as latest
from assessment_responses
where created_at < '2026-09-09'  -- adjust date threshold as needed
  or email like 'test%'
  or email like 'admin%'
  or email like 'demo%';

-- Step 3: Delete test data (UNCOMMENT ONLY AFTER VERIFICATION)
-- delete from assessment_responses
-- where created_at < '2026-09-09'
--   or email like 'test%'
--   or email like 'admin%'
--   or email like 'demo%';

-- delete from decline_log
-- where created_at < '2026-09-09';

-- Step 4: Reset public_aggregates.measured_since to the first real row
-- (This will be recomputed by refresh_public_aggregates, but set it explicitly)
-- UPDATE public_aggregates
-- SET measured_since = (
--   SELECT min(created_at) FROM assessment_responses WHERE phase = 'first'
-- )
-- WHERE course = 'ryl';

-- Step 5: Trigger nightly aggregation refresh to recompute all metrics
-- (Run from app/api/cron/nightly or manually in SQL:)
-- SELECT refresh_public_aggregates('ryl');

-- COMMIT (or ROLLBACK)
commit;

-- ─────────────────────────────────────────────────────────────────────────────
-- Verification queries (run AFTER commit to confirm)
-- ─────────────────────────────────────────────────────────────────────────────
-- Count real submissions by phase:
select phase, count(*) as count
from assessment_responses
group by phase
order by phase;

-- Verify measured_since and first real row:
select
  (select measured_since from public_aggregates where course = 'ryl') as measured_since_in_aggregates,
  (select min(created_at) from assessment_responses where phase = 'first') as actual_first_submission,
  (select count(*) from assessment_responses where phase = 'first') as total_day0;

-- Verify blockchain proof is after data purge:
select
  (select max(created_at) from assessment_responses) as latest_submission,
  (select date from public_aggregates where course = 'ryl') as last_anchor_date;
