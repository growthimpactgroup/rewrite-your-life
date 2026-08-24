-- Change Order 01, Phase 7 verification.
-- Paste into the Supabase SQL editor AFTER the Phase 7 block in schema.sql
-- has been run. Entirely inside begin/rollback, using an isolated fake
-- course ('ryl_redact_test') so nothing here can collide with or pollute
-- real data. Nothing in this file persists.

begin;

insert into assessment_responses (course, phase, email, consent,
  item_1,item_2,item_3,item_4,item_5,item_6,item_7,item_8,item_9,item_10,
  item_11,item_12,item_13,item_14,item_15,item_16,item_17,item_18,
  item_19,item_20,item_21,item_22,item_23,item_24,item_25,item_26,item_27)
values
  ('ryl_redact_test', 'first', 'redact-me@example.com', true,
   3,3,3,3,3,3,3,8,3,3, 3,3,3,8,3,3,3,3, 3,3,3,3,3,3,3,3,3),
  ('ryl_redact_test', 'week10', 'redact-me@example.com', true,
   8,8,8,8,8,8,8,3,8,8, 8,8,8,3,8,8,8,8, 8,8,8,8,8,8,8,8,8);

-- Byte-identical snapshot of the raw rows before redaction (whole-row hash,
-- so any change to any column would flip this value).
select md5(row(ar.*)::text) as day0_raw_hash
from assessment_responses ar
where ar.course = 'ryl_redact_test' and ar.phase = 'first';

-- Before redaction: email_normalized is real, and the pair forms normally.
select email_normalized from scored
where course = 'ryl_redact_test' and phase = 'first'; -- expect: 'redact-me@example.com'

select count(*) from matched_pairs
where course = 'ryl_redact_test' and email_normalized = 'redact-me@example.com'; -- expect: 1

-- File the redaction — target_email_hash computed the exact same way the
-- scored view computes it.
insert into redactions (target_email_hash, requested_at, reason)
values (
  encode(digest(lower(trim('redact-me@example.com')), 'sha256'), 'hex'),
  now(),
  'verification test'
);

-- After redaction: email is null in scored (answers survive, unlinked)...
select email_normalized, clear_thinking_pct from scored
where course = 'ryl_redact_test' and phase = 'first'; -- expect: email_normalized null, clear_thinking_pct unchanged

-- ...the pair can no longer be found by email (it's structurally incapable
-- of forming — nulls never join)...
select count(*) from matched_pairs
where course = 'ryl_redact_test' and email_normalized = 'redact-me@example.com'; -- expect: 0

select count(*) from matched_pairs
where course = 'ryl_redact_test'; -- expect: 0 (this was the only pair for this course)

-- ...and the raw row itself is untouched — same hash as before.
select md5(row(ar.*)::text) as day0_raw_hash_after
from assessment_responses ar
where ar.course = 'ryl_redact_test' and ar.phase = 'first'; -- expect: identical to the hash captured above

-- Immutability check on redactions itself: both must raise
-- "redactions is insert-only — ... is not permitted".
update redactions set reason = reason where target_email_hash = encode(digest(lower(trim('redact-me@example.com')), 'sha256'), 'hex'); -- expect: exception
delete from redactions where target_email_hash = encode(digest(lower(trim('redact-me@example.com')), 'sha256'), 'hex'); -- expect: exception (never reached if the line above already raised)

rollback; -- nothing above this line persists.
