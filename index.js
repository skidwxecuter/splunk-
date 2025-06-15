// index.js

import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(bodyParser.json());

// Replace with your Netlify team/site defaults if you want
const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN;

app.post('/create-redirect', async (req, res) => {
  const { targetUrl, siteName } = req.body;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing target URL' });
  }

  // Create redirect HTML
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

  // Use Netlify Deploy API
  const deployUrl = 'https://api.netlify.com/api/v1/sites';

  // 1. Create new site
  const siteResp = await fetch(deployUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NETLIFY_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: siteName || undefined  // optional custom name
    })
  });

  const siteData = await siteResp.json();
  const siteId = siteData.id;

  // 2. Deploy the file
  const deployResp = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
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

  return res.json({
    siteUrl: siteData.url,
    deployUrl: deployData.deploy_ssl_url
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
