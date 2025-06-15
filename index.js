import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // serve static files

// Ensure /public exists
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

app.post('/create-redirect', (req, res) => {
  const { targetUrl, siteName } = req.body;

  if (!targetUrl || !siteName) {
    return res.status(400).json({ error: 'Missing targetUrl or siteName' });
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
</html>`.trim();

  const filePath = path.join(publicDir, `${siteName}.html`);

  fs.writeFile(filePath, html, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to save file' });
    }
    return res.json({
      url: `${req.protocol}://${req.get('host')}/${siteName}.html`
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
