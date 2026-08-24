-- Project Dashboard (separate codebase, /Users/francesmendoza/Desktop/project-dashboard)
-- — build/launch status tracker for the GIG Public Outcome Record project.
-- Run this once in the same Supabase SQL editor as schema.sql. This table
-- holds nothing but checkbox state for that internal tool — no participant
-- data, no email, no assessment answers. Idempotent, safe to re-run.

create table if not exists dashboard_checklist_state (
  item_key   text primary key,
  checked    boolean not null default false,
  checked_at timestamptz
);

alter table dashboard_checklist_state enable row level security;

-- Same least-privilege pattern as public_aggregates in schema.sql: anon can
-- read and write *only* this one table, and there's nothing sensitive in it
-- even if that access is misused — worst case is a toggled checkbox.
drop policy if exists dashboard_checklist_state_rw on dashboard_checklist_state;
create policy dashboard_checklist_state_rw on dashboard_checklist_state
  for all to anon using (true) with check (true);

grant select, insert, update on dashboard_checklist_state to anon;
