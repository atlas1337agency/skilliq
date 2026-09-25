import express from 'express';
import cors from 'cors';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { OAuth2Client } from 'google-auth-library';

const app = express();

app.use(cors());
app.use(express.json());

// OAuth Setup Helper
const getOAuthClient = (req) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  // Construct redirect URI based on current request or provided query param
  let redirectUri = req.query.redirect_uri;
  
  if (!redirectUri && req.query.state) {
      // Allow extracting from state during callback to ensure match
      redirectUri = Buffer.from(req.query.state, 'base64').toString('ascii');
  }

  if (!redirectUri) {
      // Fallback
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      redirectUri = `${protocol}://${host}/api/analytics/oauth/callback`;
  }
  
  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

// Route 1: Get Google Auth URL
app.get('/api/analytics/oauth/url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(400).json({ error: 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in settings.' });
  }
  const client = getOAuthClient(req);
  // Encode redirect_uri into state so we receive it back exactly
  let state = '';
  if (req.query.redirect_uri) {
    state = Buffer.from(req.query.redirect_uri).toString('base64');
  }

  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/analytics.readonly'],
    prompt: 'consent', // Force to get refresh token
    state: state
  });
  res.json({ url });
});

// Route 2: Callback after user authenticates
app.get('/api/analytics/oauth/callback', async (req, res) => {
  try {
    const code = req.query.code;
    const client = getOAuthClient(req);
    const { tokens } = await client.getToken(code);
    
    res.send(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10B981;">Google Analytics Authenticated!</h2>
          <p>Please copy your Refresh Token below and add it to your Project Settings as <b>GA4_REFRESH_TOKEN</b>:</p>
          <textarea readonly style="width: 100%; height: 100px; padding: 10px; font-family: monospace; border-radius: 8px; border: 1px solid #ccc; margin-bottom: 20px;">${tokens.refresh_token}</textarea>
          <p><strong>Important:</strong> After saving the setting, you must restart your app for the settings to take effect.</p>
          <a href="/admin" style="display: inline-block; padding: 10px 20px; background-color: #0F172A; color: white; text-decoration: none; border-radius: 6px;">Go Back to Admin</a>
        </body>
      </html>
    `);
  } catch (e) {
    res.status(500).send('Error getting token: ' + String(e));
  }
});

// Route 3: Fetch Analytics Data
app.get('/api/analytics', async (req, res) => {
  try {
    const propertyId = process.env.GA4_PROPERTY_ID;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GA4_REFRESH_TOKEN;

    if (!propertyId || !clientId || !clientSecret) {
      return res.status(200).json({ 
        error: 'Missing Credentials', 
        useDemo: true, 
        needsSetup: true 
      });
    }

    if (!refreshToken) {
      return res.status(200).json({ 
        error: 'Missing Refresh Token', 
        useDemo: true, 
        needsAuth: true 
      });
    }

    const authClient = new OAuth2Client(clientId, clientSecret);
    authClient.setCredentials({ refresh_token: refreshToken });

    const analyticsDataClient = new BetaAnalyticsDataClient({ authClient });

    // Fetch Traffic over last 7 days
    const [trafficResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: '7daysAgo',
          endDate: 'today',
        },
      ],
      dimensions: [
        { name: 'date' },
      ],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' }
      ],
    });

    // Fetch Top Locations
    const [locationResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: '7daysAgo',
          endDate: 'today',
        },
      ],
      dimensions: [
        { name: 'country' },
      ],
      metrics: [
        { name: 'activeUsers' },
      ],
    });

    res.json({
      traffic: trafficResponse,
      locations: locationResponse
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(200).json({ 
      error: error?.message || 'Failed to fetch analytics', 
      useDemo: true 
    });
  }
});

// Export the Express API
export default app;
