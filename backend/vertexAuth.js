// backend/vertexAuth.js
// Helper to get an authenticated Google client for Vertex AI using a Netlify environment variable

const { GoogleAuth } = require('google-auth-library');

/**
 * Returns an authenticated Google client for Vertex AI using the service account JSON
 * stored in the Netlify environment variable.
 *
 * Usage (in your Netlify function or backend handler):
 *   const getVertexClient = require('./vertexAuth');
 *   const client = await getVertexClient();
 *
 * Supports both GOOGLE_SERVICE_ACCOUNT_JSON (raw JSON) and GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 (base64 encoded)
 */
async function getVertexClient() {
  let serviceAccount;
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  } else if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64) {
    const jsonStr = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64, 'base64').toString('utf-8');
    serviceAccount = JSON.parse(jsonStr);
  } else {
    throw new Error('Google service account credentials not found in environment variables');
  }

  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  return await auth.getClient();
}

module.exports = getVertexClient;
