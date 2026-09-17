# Fix: /api/results 500 Error

## Problem
The `/api/results` endpoint returns a 500 error because it requires `SUPABASE_SERVICE_ROLE_KEY` environment variable, which is missing from Vercel.

## Root Cause
The server-side API route uses `getSupabaseServerClient()` which requires:
1. ✅ `SUPABASE_URL` - Already added to Vercel
2. ❌ `SUPABASE_SERVICE_ROLE_KEY` - **MISSING** in Vercel

This key is needed for server-side database operations and cannot be the same as the public anon key.

## Solution: Add SUPABASE_SERVICE_ROLE_KEY to Vercel

### Step 1: Get the Service Role Key from Supabase
1. Go to: https://supabase.com/dashboard/project/gpbtpecvbjersifccehd/settings/api
2. Sign in with your Supabase account (growthimpactgroup@protonmail.com)
3. Look for the **"Service Role Secret"** key (labeled as `service_role`)
4. Copy the full key (starts with `eyJ...`)

### Step 2: Add to Vercel Environment Variables
1. Go to: https://vercel.com/growth-impact-group/rewrite-your-life/settings/environment-variables
2. Click **"Add Environment Variable"**
3. Fill in:
   - **Key**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: `<paste the service role key from Step 1>`
   - **Type**: Select **Secret** (not Config)
   - **Environment**: Select **Production**
4. Click **Save**

### Step 3: Redeploy
1. Go to Deployments: https://vercel.com/growth-impact-group/rewrite-your-life/deployments
2. Click the three-dot menu on the latest failed deployment
3. Select **Redeploy**
4. Confirm

### Verification
After redeployment, test by:
1. Opening https://rewrite-your-life-hazel.vercel.app
2. Clicking "Start My Journey"
3. Entering an email and clicking Continue
4. The page should advance to the survey questions (no 500 error)

## Why This Is Needed

The `/api/results` endpoint is called when:
- User enters email to "Start My Journey" (checks if email has prior submissions)
- User enters email to "Finish My Journey" (fetches Week 10 results)

The service role key has elevated permissions to read all data, unlike the public anon key which is restricted by Row Level Security (RLS) policies. This separation keeps the app secure by not exposing the powerful key to the client.

## Related Files
- `app/api/results/route.ts` - The endpoint that needs the key
- `lib/supabaseServer.ts` - Where the error originates from
