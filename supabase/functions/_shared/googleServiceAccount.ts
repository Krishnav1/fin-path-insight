// _shared/googleServiceAccount.ts
// Helper to get Google service account credentials from environment variable in Supabase Edge Functions (Deno)

/**
 * Returns the parsed Google service account credentials from environment variables.
 * Supports both raw JSON and base64-encoded JSON.
 * Throws if not found.
 *
 * Usage:
 *   import { getGoogleServiceAccount } from '../_shared/googleServiceAccount.ts';
 *   const credentials = getGoogleServiceAccount();
 */
export function getGoogleServiceAccount(): Record<string, unknown> {
  let rawJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
  if (!rawJson) {
    const base64 = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON_BASE64');
    if (base64) {
      rawJson = atob(base64);
    }
  }
  if (!rawJson) {
    throw new Error('Google service account JSON not found in environment variables.');
  }
  return JSON.parse(rawJson);
}
