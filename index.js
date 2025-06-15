import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

const dbPath = path.join(publicDir, 'redirects.json');
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify([]));

// Helper: random code generator
function generateCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create redirect file with random code
app.post('/create-redirect', (req, res) => {
  const { targetUrl } = req.body;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing target URL' });
  }

  // Generate unique code
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

  const filePath = path.join(publicDir, filename);
  fs.writeFileSync(filePath, html);

  // Add to JSON db
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

// Provide JSON list
app.get('/api/list', (req, res) => {
  const list = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  res.json(list);
});

// Serve static
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
