import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Make sure public dir exists
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

// Make sure JSON file exists
const dbPath = path.join(publicDir, 'redirects.json');
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify([]));

// Helper: random code
function generateCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create redirect
app.post('/create-redirect', (req, res) => {
  const { targetUrl } = req.body;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing target URL' });
  }

  const code = generateCode();
  const filename = `${code}.html`;

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

  // Save file
  const filePath = path.join(publicDir, filename);
  fs.writeFileSync(filePath, html);

  // Update JSON
  let list = [];
  try {
    list = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  } catch {}

  list.unshift({
    code: code,
    url: `/${filename}`,
    created: new Date().toISOString()
  });

  fs.writeFileSync(dbPath, JSON.stringify(list, null, 2));

  res.json({ url: `/${filename}`, code: code });
});

// Serve the list API
app.get('/api/list', (req, res) => {
  let list = [];
  try {
    list = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  } catch {}
  res.json(list);
});

// Serve frontend
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server on port ${PORT}`));
