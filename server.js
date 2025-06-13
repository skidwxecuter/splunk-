// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// In-memory storage (replace with database in production)
let announcements = [];
const ADMIN_KEY = process.env.ADMIN_KEY || "nigger233";

// Get all announcements
app.get('/announcements', (req, res) => {
    res.json(announcements);
});

// Create new announcement
app.post('/announcements', (req, res) => {
    if (req.headers['x-admin-key'] !== ADMIN_KEY) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const { title, message, isUrgent } = req.body;
    if (!title || !message) {
        return res.status(400).json({ error: 'Title and message required' });
    }

    const newAnnouncement = {
        id: Date.now(),
        title,
        message,
        isUrgent: Boolean(isUrgent),
        createdAt: new Date().toISOString()
    };

    announcements.unshift(newAnnouncement);
    res.status(201).json(newAnnouncement);
});

// Delete announcement
app.delete('/announcements/:id', (req, res) => {
    if (req.headers['x-admin-key'] !== ADMIN_KEY) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const id = parseInt(req.params.id);
    announcements = announcements.filter(a => a.id !== id);
    res.status(204).send();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Announcement API running on port ${PORT}`));
