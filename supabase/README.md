# FinPath Insight - Supabase Setup Guide

This guide explains how to set up and deploy the Supabase Edge Functions for the company data ingestion functionality.

## Prerequisites

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Log in to your Supabase account:
   ```bash
   supabase login
   ```

## Local Development

1. Start the Supabase local development environment:
   ```bash
   cd c:\Users\Krishna\Desktop\fin-path-insight-main
   supabase start
   ```

2. Run the Edge Function locally for testing:
   ```bash
   supabase functions serve company-data-ingest --env-file .env.local
   ```

   Make sure your `.env.local` file contains the following variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   EODHD_API_KEY=your_eodhd_api_key
   ADMIN_API_KEY=your_admin_api_key
   ```

3. Test the function locally:
   ```bash
   curl -i --location --request POST 'http://localhost:54321/functions/v1/company-data-ingest?symbol=AAPL' \
   --header 'Authorization: Bearer your_admin_api_key' \
   --header 'Content-Type: application/json'
   ```

## Deployment

1. Link your local project to your Supabase project:
   ```bash
   supabase link --project-ref your_project_reference_id
   ```

2. Deploy the Edge Function:
   ```bash
   supabase functions deploy company-data-ingest --project-ref your_project_reference_id
   ```

3. Set up environment variables for the deployed function:
   ```bash
   supabase secrets set --env-file .env.production --project-ref your_project_reference_id
   ```

   Your `.env.production` file should contain:
   ```
   EODHD_API_KEY=your_eodhd_api_key
   ADMIN_API_KEY=your_admin_api_key
   ```

4. Apply the database migrations:
   ```bash
   supabase db push --project-ref your_project_reference_id
   ```

## Setting Up Scheduled Execution

1. In the Supabase Dashboard, go to the Edge Functions section.
2. Find your `company-data-ingest` function.
3. Click on "Schedules" and set up a new schedule:
   - Name: `daily-company-data-update`
   - Cron Expression: `0 0 * * *` (runs daily at midnight)
   - HTTP Method: `POST`
   - Headers: Add `x-scheduled-function: true`

## Important Supabase Settings to Check

1. **Row-Level Security (RLS)**: Ensure RLS policies are correctly applied to all tables.
2. **Service Role Key**: Keep your service role key secure and never expose it in client-side code.
3. **API Keys**: Make sure your ADMIN_API_KEY is securely stored and used for authentication.
4. **CORS Settings**: If you encounter CORS issues, configure the appropriate CORS settings in the Supabase dashboard.

## Troubleshooting

1. **Function Logs**: Check the function logs in the Supabase Dashboard for any errors.
2. **Database Migrations**: If migrations fail, check the SQL syntax and ensure the tables don't already exist.
3. **Authentication Issues**: Verify that the correct API keys are being used for authentication.

## Additional Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Deno Standard Library](https://deno.land/std)
