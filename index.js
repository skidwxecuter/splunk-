import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Directories & JSON for saving links
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

const dbPath = path.join(publicDir, 'redirects.json');
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify([]));

// Create redirect file & store in JSON
app.post('/create-redirect', (req, res) => {
  const { targetUrl, siteName } = req.body;

  if (!targetUrl || !siteName) {
    return res.status(400).json({ error: 'Missing fields' });
  }

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

  const filePath = path.join(publicDir, `${siteName}.html`);
  fs.writeFileSync(filePath, html);

  // Add to redirects.json
  let list = [];
  try {
    list = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  } catch {}

  list.unshift({
    name: siteName,
    url: `/${siteName}.html`,
    created: new Date().toISOString()
  });

  fs.writeFileSync(dbPath, JSON.stringify(list, null, 2));

  res.json({ url: `/${siteName}.html` });
});

// Provide JSON list to frontend
app.get('/api/list', (req, res) => {
  const list = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  res.json(list);
});

// Serve frontend (index.html) from public/
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
