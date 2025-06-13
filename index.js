const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = 'pastes.json';

app.use(cors());
app.use(bodyParser.json());

// Load or create DB
let db = [];
if (fs.existsSync(DB_FILE)) {
  db = JSON.parse(fs.readFileSync(DB_FILE));
}

// Create paste
app.post('/api/paste', (req, res) => {
  const { title, content } = req.body;
  const id = uuidv4();
  const paste = { id, title: title || 'Untitled', content, createdAt: Date.now(), views: 0 };
  db.push(paste);
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  res.json({ id });
});

// Get paste by ID
app.get('/api/paste/:id', (req, res) => {
  const paste = db.find(p => p.id === req.params.id);
  if (!paste) return res.status(404).json({ error: 'Not found' });
  paste.views++;
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  res.json(paste);
});

// List all pastes
app.get('/api/pastes', (req, res) => {
  const q = req.query.q?.toLowerCase() || '';
  const results = db.filter(p => p.title.toLowerCase().includes(q));
  res.json(results.reverse()); // Newest first
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
