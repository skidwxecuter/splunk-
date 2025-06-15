// index.js

import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';

const app = express();
app.use(bodyParser.json());

// ✅ Hardcoded Netlify Token (private use only!)
const NETLIFY_TOKEN = "nfp_exfPrWZf8cEqTysL2gDHZ4Xy45XgLpi714c3";

// Allow CORS for your frontend (important!)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Or restrict to your frontend URL
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// API endpoint to create redirect site
app.post('/create-redirect', async (req, res) => {
  const { targetUrl, siteName } = req.body;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing target URL' });
  }

  // Create the redirect HTML file
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta http-equiv="refresh" content="0; url=${targetUrl}" />
  <title>Redirecting...</title>
</head>
<body>
  <p>If you are not redirected, <a href="${targetUrl}">click here</a>.</p>
</body>
</html>`;

  try {
    // 1. Create a new Netlify site
    const siteResp = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NETLIFY_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: siteName || undefined  // Optional custom name
      })
    });

    const siteData = await siteResp.json();

    if (!siteResp.ok) {
      return res.status(500).json({ error: 'Failed to create site', details: siteData });
    }

    // 2. Deploy the redirect HTML
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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
