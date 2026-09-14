-- Migration: Cohort-based Week 10 eligibility (2026-09-12)
-- Implements: Tie Week 10 eligibility to cohort final module dates instead of fixed 10-week timer
-- Status: Ready for deployment before Sep 21 launch

-- Create cohorts table
create table if not exists cohorts (
  id text primary key,
  course text not null default 'ryl',
  start_date timestamptz not null,
  final_module_date timestamptz not null,
  week10_window_open timestamptz not null,  -- earliest submission time for Week 10
  week10_window_close timestamptz not null, -- latest submission time to be counted as eligible
  created_at timestamptz not null default now(),
  unique(course, id)
);

-- Add cohort_id column to assessment_responses (nullable, for backwards compatibility)
alter table assessment_responses
  add column if not exists cohort_id text;

-- Index for fast cohort lookup by course
create index if not exists cohorts_course_idx on cohorts(course);

-- Fall 2026 cohort: Sep 21 start → Dec 16 final module → Dec 13-30 Week 10 window
insert into cohorts (id, course, start_date, final_module_date, week10_window_open, week10_window_close)
values (
  'fall-2026',
  'ryl',
  '2026-09-21 00:00:00 UTC',
  '2026-12-16 00:00:00 UTC',
  '2026-12-13 00:00:00 UTC',
  '2026-12-30 23:59:59 UTC'
)
on conflict do nothing;

-- Helper: assign cohort based on Day 0 submission date
-- If we add a cohort_question later, this can be replaced with direct assignment
create or replace function assign_cohort_by_date(day0_date timestamptz)
returns text as $$
  select id from cohorts
  where course = 'ryl'
  and start_date <= day0_date
  and day0_date < (final_module_date + interval '1 day')
  limit 1
$$ language sql immutable;

-- Helper: check if a submission is within a cohort's Week 10 window
create or replace function is_week10_eligible(submission_date timestamptz, cohort_id_param text)
returns boolean as $$
  select
    week10_window_open <= submission_date
    and submission_date <= week10_window_close
  from cohorts
  where id = cohort_id_param
  limit 1
$$ language sql immutable;

-- Trigger: auto-assign cohort_id on insert if not already set
-- (optional — can also assign in application code)
create or replace function auto_assign_cohort()
returns trigger as $$
begin
  if new.cohort_id is null and new.phase in ('first', 'retake') then
    new.cohort_id := assign_cohort_by_date(new.created_at);
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists assess_auto_assign_cohort on assessment_responses;
create trigger assess_auto_assign_cohort
  before insert on assessment_responses
  for each row
  execute function auto_assign_cohort();

-- Update refresh_public_aggregates to use cohort-based eligibility
-- (See separate SQL block for updated aggregation logic — this is just the schema)

comment on table cohorts is
  'Cohorts define the Week 10 eligibility window. A participant is eligible once '
  'their cohort''s week10_window_close date has passed, regardless of when they '
  'submitted their Week 10 response (if at all).';

comment on column cohorts.week10_window_open is
  '3 days before final module (earliest allowed Week 10 submission time)';

comment on column cohorts.week10_window_close is
  '14 days after final module (latest time to be counted eligible)';
