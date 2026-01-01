# Deploy Overdue Deals Notification System

## Quick Setup Guide

### 1. Deploy the Edge Function

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Set the Resend API key
supabase secrets set RESEND_API_KEY=re_YOUR_RESEND_API_KEY

# Deploy the function
supabase functions deploy check-overdue-deals
```

### 2. Update Email Domain

Before deploying, update the email sender in:
`supabase/functions/check-overdue-deals/index.ts` line 154

Change:
```typescript
from: 'PartnerLogic <noreply@yourdomain.com>',
```

To your verified Resend domain.

### 3. Apply Database Migrations

In your Supabase SQL Editor, run these in order:

**Migration 1: Add tracking column**
```sql
-- From: supabase/migrations/001_add_overdue_tracking.sql
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS overdue_notified_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_deals_overdue 
ON deals(expected_close_date, stage, admin_stage, overdue_notified_at)
WHERE expected_close_date IS NOT NULL 
  AND stage NOT IN ('closed_won', 'closed_lost')
  AND admin_stage != 'live';
```

**Migration 2: Configure database settings**
```sql
-- Replace YOUR_PROJECT_REF and YOUR_SERVICE_ROLE_KEY with your actual values
ALTER DATABASE postgres 
SET app.settings.supabase_url = 'https://YOUR_PROJECT_REF.supabase.co';

ALTER DATABASE postgres 
SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
```

**Migration 3: Setup cron job**
```sql
-- From: supabase/migrations/002_setup_overdue_cron.sql
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'check-overdue-deals',
  '0 9 * * *',
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/check-overdue-deals',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
```

### 4. Test the Function

```bash
# Manual test
supabase functions invoke check-overdue-deals

# Or using curl
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-overdue-deals' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

### 5. Verify Setup

Check cron job is scheduled:
```sql
SELECT * FROM cron.job WHERE jobname = 'check-overdue-deals';
```

View execution history:
```sql
SELECT * FROM cron.job_run_details 
WHERE jobname = 'check-overdue-deals' 
ORDER BY start_time DESC 
LIMIT 10;
```

## How It Works

1. **Daily at 9 AM UTC**, pg_cron triggers the edge function
2. **Function queries** for deals where:
   - `expected_close_date < today`
   - NOT in `closed_won`, `closed_lost`, or `live` status
   - Haven't been notified yet (`overdue_notified_at IS NULL`)
3. **For each overdue deal**:
   - Sends email to partner
   - Creates in-app notification for partner
   - If partner manager assigned:
     - Sends email to manager
     - Creates in-app notification for manager
   - Updates `overdue_notified_at` timestamp
4. **Returns summary** of processed deals

## Testing

Create a test deal:
```sql
INSERT INTO deals (
  partner_id,
  customer_name,
  customer_company,
  expected_close_date,
  stage,
  admin_stage,
  deal_value,
  currency
) VALUES (
  'YOUR_PARTNER_ID',
  'Test Customer',
  'Test Company',
  CURRENT_DATE - INTERVAL '1 day',
  'proposal',
  'urs',
  10000,
  'USD'
);
```

Then manually trigger the function to test.

## Customization

### Change Schedule
Edit the cron expression in migration 002:
- Daily 9 AM UTC: `'0 9 * * *'`
- Weekdays only at 9 AM: `'0 9 * * 1-5'`
- Every 6 hours: `'0 */6 * * *'`

### Modify Email Templates
Edit the HTML in `supabase/functions/check-overdue-deals/index.ts`:
- Partner email: Lines 70-84
- Manager email: Lines 111-125

## Monitoring

View function logs:
```bash
supabase functions logs check-overdue-deals
```

Or in Supabase Dashboard:
1. Go to Edge Functions
2. Click `check-overdue-deals`
3. View Logs tab

## Troubleshooting

**No emails sending?**
- Verify Resend API key: `supabase secrets list`
- Check domain is verified in Resend
- Review function logs for errors

**Cron not running?**
- Check settings are configured
- Verify pg_cron is enabled: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
- Review execution history: `SELECT * FROM cron.job_run_details`

**Duplicate notifications?**
- Ensure `overdue_notified_at` is being updated
- Check database permissions for service role

## Cost

- Edge Functions: Free tier includes 500K requests/month
- pg_cron: No additional cost
- Resend: Free tier includes 3,000 emails/month

This should stay within free tiers for most use cases.
