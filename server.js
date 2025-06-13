const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// In-memory database for announcements
let announcements = [];
let lastId = 0;

// Get all announcements
app.get('/announcements', (req, res) => {
    res.json(announcements);
});

// Create new announcement (admin only)
app.post('/announcements', (req, res) => {
    const { title, message, isUrgent } = req.body;
    
    // Simple authentication (use a real auth system in production)
    if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    
    if (!title || !message) {
        return res.status(400).json({ error: 'Title and message are required' });
    }
    
    const newAnnouncement = {
        id: ++lastId,
        title,
        message,
        isUrgent: !!isUrgent,
        createdAt: new Date().toISOString()
    };
    
    announcements.unshift(newAnnouncement); // Add to beginning
    
    // Keep only the last 10 announcements
    if (announcements.length > 10) {
        announcements = announcements.slice(0, 10);
    }
    
    res.status(201).json(newAnnouncement);
});

// Delete announcement (admin only)
app.delete('/announcements/:id', (req, res) => {
    if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const id = parseInt(req.params.id);
    announcements = announcements.filter(a => a.id !== id);
    
    res.status(204).send();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
