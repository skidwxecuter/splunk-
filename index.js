// index.js

import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';

const app = express();
app.use(bodyParser.json());

// ✅ Hardcoded Netlify Token (private only)
const NETLIFY_TOKEN = "nfp_exfPrWZf8cEqTysL2gDHZ4Xy45XgLpi714c3";

// Allow CORS for frontend
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Endpoint
app.post('/create-redirect', async (req, res) => {
  const { targetUrl, siteName, pageTitle } = req.body;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing target URL' });
  }

  // ✅ Use custom page title or default fallback
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta http-equiv="refresh" content="0; url=${targetUrl}" />
  <title>${pageTitle || 'Redirecting...'}</title>
</head>
<body>
  <p>If you are not redirected, <a href="${targetUrl}">click here</a>.</p>
</body>
</html>`;

  try {
    // 1. Create new Netlify site
    const siteResp = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NETLIFY_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: siteName || undefined
      })
    });

    const siteData = await siteResp.json();
    if (!siteResp.ok) {
      return res.status(500).json({ error: 'Failed to create site', details: siteData });
    }

    // 2. Deploy the single index.html only
    const deployResp = await fetch(`https://api.netlify.com/api/v1/sites/${siteData.id}/deploys`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NETLIFY_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: {
          'index.html': html
        }
      })
    });

    const deployData = await deployResp.json();
    if (!deployResp.ok) {
      return res.status(500).json({ error: 'Failed to deploy', details: deployData });
    }

    return res.json({
      siteUrl: siteData.url,
      deployUrl: deployData.deploy_ssl_url
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
