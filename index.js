import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Ensure public folder exists
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

// Ensure redirects.json exists
const dbPath = path.join(publicDir, 'redirects.json');
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify([]));

// Create new redirect
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

  // Update DB
  let list = [];
  try { list = JSON.parse(fs.readFileSync(dbPath, 'utf-8')); } catch {}
  list.unshift({
    name: siteName,
    url: `/${siteName}.html`,
    created: new Date().toISOString()
  });
  fs.writeFileSync(dbPath, JSON.stringify(list, null, 2));

  res.json({ url: `/${siteName}.html` });
});

// Serve list in HTML
app.get('/', (req, res) => {
  const list = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  const linksHtml = list.map(item =>
    `<li><a href="${item.url}" target="_blank">${item.url}</a> — ${new Date(item.created).toLocaleString()}</li>`
  ).join('\n');

  const page = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Redirect Maker</title>
</head>
<body>
  <h1>Make a Redirect</h1>
  <input id="name" placeholder="Site name" />
  <input id="url" placeholder="Target URL" />
  <button id="make">Create</button>
  <p id="result"></p>

  <h2>Recent Links</h2>
  <ul id="list">${linksHtml}</ul>

  <script>
    const backend = '';
    document.getElementById('make').onclick = async () => {
      const name = document.getElementById('name').value.trim();
      const url = document.getElementById('url').value.trim();
      const result = document.getElementById('result');
      if (!name || !url) {
        result.textContent = 'Fill in both fields!';
        return;
      }
      const res = await fetch('/create-redirect', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ siteName: name, targetUrl: url })
      });
      const data = await res.json();
      if (data.url) {
        result.innerHTML = \`✅ Created: <a href="\${data.url}" target="_blank">\${location.origin + data.url}</a>\`;
        location.reload(); // Reload to show updated list
      } else {
        result.textContent = data.error || 'Error';
      }
    };
  </script>
</body>
</html>
  `;
  res.send(page);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Running on port ${PORT}`));
