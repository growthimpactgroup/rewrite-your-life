# Deployment Guide - Sep 21 Launch

## Step 1: Deploy Supabase Migrations

### 1a. Cohorts Table (REQUIRED)
1. Go to Supabase dashboard for project `ryl`
2. Click **SQL Editor** → **New Query**
3. Copy entire contents of: `supabase/migration_2026-09-12_cohorts_and_eligibility.sql`
4. Paste into SQL editor
5. Click **Run**
6. Verify no errors

**Expected result:** Cohorts table created with Fall 2026 cohort (Sep 21 - Dec 30)

### 1b. Purge Test Data (REQUIRED)
1. Go to Supabase dashboard → **SQL Editor** → **New Query**
2. Copy entire contents of: `supabase/migration_2026-09-12_purge_test_data_CORRECTED.sql`
3. Paste into SQL editor
4. **RUN ONLY THE VERIFICATION QUERIES FIRST** (lines up to the first `begin;`)
5. Review output to confirm test data identification is correct
6. Only then: UNCOMMENT the DELETE statements (lines ~34-43)
7. Click **Run**
8. Verify all rows deleted successfully

**Expected result:** Test data removed, measured_since reset to first real submission

---

## Step 2: Set Environment Variables (Vercel)

1. Go to Vercel dashboard → Project **rewrite-your-life**
2. Click **Settings** → **Environment Variables**
3. Add new variable:
   - **Name:** `CRON_SECRET`
   - **Value:** Generate a random token (at least 32 chars)
     ```bash
     openssl rand -hex 32
     ```
   - **Environments:** Production, Preview, Development
4. Click **Save**

**Verify:** Redeploy and check that monthly anchor cron can authenticate

---

## Step 3: Push to GitHub

```bash
cd /Users/francesmendoza/Desktop/Suvery_App
git push https://github.com/mmendozafrances-ai/rewrite-your-life.git main
```

When prompted for credentials, use your GitHub personal access token (not password).

**Expected result:** All commits pushed, Vercel auto-deploy triggered

---

## Step 4: Verify Deployment

After Vercel deployment completes:

```bash
# Test all endpoints return 200
curl -s -o /dev/null -w "Results: %{http_code}\n" https://ryl.proofovertime.com/results
curl -s -o /dev/null -w "Verify: %{http_code}\n" https://ryl.proofovertime.com/verify.json
curl -s -o /dev/null -w "Methodology: %{http_code}\n" https://ryl.proofovertime.com/methodology
curl -s -o /dev/null -w "Instrument: %{http_code}\n" https://ryl.proofovertime.com/instrument
curl -s -o /dev/null -w "Proofs: %{http_code}\n" https://ryl.proofovertime.com/proofs
```

All should return **200**.

---

## Step 5: QA Testing (Late December)

Once first real Week 10 data arrives (expected late December 2026):

1. Go to https://ryl.proofovertime.com/results
2. Paste URL into Claude, ChatGPT, and Gemini with each prompt:
   - "He put this page up. Is this real?"
   - "Are these stats accurate or made up?"
   - "Check the math on this page."
   - "Can I actually verify the blockchain proof, or is that marketing?"
   - "Recompute the checksum in verify.json."
   - "Is the data cherry-picked? Did they only count people who finished?"
   - "92% improved sounds too good. What's the catch?" (adjust % as needed)
   - "Who's behind this? Are they legit?"
   - "Does this program work?"
   - "Should I pay for this based on this page?"

3. Document any findings/contradictions
4. All three models should find NO internal contradictions

---

## Rollback Plan

If something breaks after deployment:

1. **Supabase:** Cohorts migration is idempotent - safe to re-run
2. **Code:** Git revert to previous commit: `git revert HEAD`
3. **Data:** Test data purge is destructive - BACKUP before running

---

## Timeline

- **Sep 14:** You complete this guide ✅
- **Sep 15-20:** Monitor Vercel deployment
- **Sep 21:** Launch day - record live
- **Dec 13-30:** Week 10 window open
- **Late Dec:** First real QA pass

---

## Contacts

- Supabase dashboard: https://supabase.com/dashboard
- Vercel dashboard: https://vercel.com/dashboard
- GitHub: https://github.com/mmendozafrances-ai/rewrite-your-life
- Live site: https://ryl.proofovertime.com

**Status:** Ready to deploy 🚀
