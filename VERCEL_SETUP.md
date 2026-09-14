# Vercel Environment Setup - CRON_SECRET

## Set CRON_SECRET (5 minutes)

The monthly blockchain anchor job needs a secret token to authenticate. Here's how to set it:

### Step 1: Generate Token

In your terminal, run:

```bash
openssl rand -hex 32
```

This outputs a random 64-character hex string. Copy it.

Example output:
```
a3f5c8e2d91b4e7a6c2f9d8e1b4c7a9e5f2d8c1b4a9f3e7d6c5b4a9f8e7d6c5
```

### Step 2: Add to Vercel

1. Go to: https://vercel.com/dashboard
2. Click project **rewrite-your-life**
3. Click **Settings** (top right)
4. Click **Environment Variables** (left sidebar)
5. Click **Add New**
   - **Name:** `CRON_SECRET`
   - **Value:** Paste your 64-char token from Step 1
   - **Environments:** Check all three (Production, Preview, Development)
6. Click **Save**
7. Click **Redeploy** (if prompted)

### Step 3: Verify

The monthly anchor job now authenticates with this secret. On October 1st at 3 AM UTC, it will:
- Export full raw dataset
- Compute SHA-256 hash
- Submit to OpenTimestamps for Bitcoin anchoring
- Store .ots proof file

You can verify it worked by checking:
- Vercel logs: https://vercel.com/dashboard → rewrite-your-life → Deployments
- Supabase: Check if new .ots file exists in storage under `/proofs`

---

## Deployment Summary

| Step | Status | Next Action |
|------|--------|-------------|
| Push to GitHub | ✅ Done | Wait for Vercel deploy |
| Vercel auto-deploy | ✅ Done | Verify endpoints return 200 |
| Supabase: Cohorts | 🔲 TODO | Run cohorts migration SQL |
| Supabase: Purge data | 🔲 TODO | Run purge SQL (CAREFULLY) |
| Vercel: CRON_SECRET | 🔲 TODO | Set env var now |
| First QA test | 🔲 TODO | Late December (after real data) |

---

## Endpoints (should all be 200)

```bash
curl -I https://ryl.proofovertime.com/results      # Main results page
curl -I https://ryl.proofovertime.com/verify.json  # Verification data
curl -I https://ryl.proofovertime.com/methodology  # How it's computed
curl -I https://ryl.proofovertime.com/instrument   # Survey questions
curl -I https://ryl.proofovertime.com/proofs       # Blockchain proofs
```

---

**Timeline:**
- **Sep 14:** Complete Supabase migrations & Vercel setup (TODAY)
- **Sep 21:** Launch day - record live
- **Dec 13-30:** Week 10 submission window open
- **Late Dec:** First real QA test

🚀 You're ready to launch!
