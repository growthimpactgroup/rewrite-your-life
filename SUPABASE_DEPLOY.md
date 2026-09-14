# Supabase Deployment - Copy & Paste Scripts

## Step 1: Deploy Cohorts Table (5 minutes)

1. Go to: https://supabase.com/dashboard
2. Select project `ryl`
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Paste this entire block:

```sql
-- Migration: Cohort-based Week 10 eligibility (2026-09-12)
create table if not exists cohorts (
  id text primary key,
  course text not null default 'ryl',
  start_date timestamptz not null,
  final_module_date timestamptz not null,
  week10_window_open timestamptz not null,
  week10_window_close timestamptz not null,
  created_at timestamptz not null default now(),
  unique(course, id)
);

alter table assessment_responses
  add column if not exists cohort_id text;

create index if not exists cohorts_course_idx on cohorts(course);

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

create or replace function assign_cohort_by_date(day0_date timestamptz)
returns text as $$
  select id from cohorts
  where course = 'ryl'
  and start_date <= day0_date
  and day0_date < (final_module_date + interval '1 day')
  limit 1
$$ language sql immutable;

create or replace function is_week10_eligible(submission_date timestamptz, cohort_id_param text)
returns boolean as $$
  select
    week10_window_open <= submission_date
    and submission_date <= week10_window_close
  from cohorts
  where id = cohort_id_param
  limit 1
$$ language sql immutable;

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
```

6. Click **Run** (blue button)
7. ✅ Should complete with no errors

---

## Step 2: Purge Test Data (10 minutes - **CAREFUL**)

⚠️ **BACKUP FIRST** - This is destructive!

1. In SQL Editor, click **New Query**
2. Paste this block **but do NOT run it yet**:

```sql
-- First: IDENTIFY what will be deleted
select count(*) as rows_to_delete, 
       min(created_at) as earliest, 
       max(created_at) as latest
from assessment_responses
where created_at < '2026-09-09'
  or email like 'test%'
  or email like 'admin%'
  or email like 'demo%';
```

3. Click **Run** and review the count
4. If count is reasonable (not > 90% of your data), continue
5. Paste this as a NEW query:

```sql
-- CAREFULLY DELETE test data
begin;

delete from assessment_responses
where created_at < '2026-09-09'
  or email like 'test%'
  or email like 'admin%'
  or email like 'demo%';

delete from decline_log
where created_at < '2026-09-09';

commit;
```

6. Click **Run**
7. Then verify with:

```sql
-- Verification
select phase, count(*) as count
from assessment_responses
group by phase
order by phase;

select
  (select measured_since from public_aggregates where course = 'ryl') as measured_since,
  (select min(created_at) from assessment_responses where phase = 'first') as actual_first,
  (select count(*) from assessment_responses) as total_rows;
```

8. ✅ Should show only real data

---

## Step 3: Refresh Aggregates

In SQL Editor, new query:

```sql
SELECT refresh_public_aggregates('ryl');
```

Click **Run**. This recomputes all metrics with clean data.

---

## STATUS

- ✅ Cohorts deployed
- ✅ Test data purged  
- ✅ Metrics refreshed
- 🟡 **Ready for Week 10 launch (Sep 21)**

