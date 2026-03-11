const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());

// Disable caching for local development, but allow it in production
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        res.set('Cache-Control', 'no-store');
        next();
    });
}

app.use(express.static(__dirname));

function readDB() {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading database:", err);
        return { shopItems: [], deletedIds: [] };
    }
}

function writeDB(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error("Error writing database:", err);
    }
}

// Get all items (custom + default filter)
app.get('/api/items', (req, res) => {
    const db = readDB();
    const visibleItems = db.shopItems.filter(item => !db.deletedIds.includes(item.id));
    res.json(visibleItems);
});

// Add new item
app.post('/api/items', (req, res) => {
    const db = readDB();
    const newItem = req.body;
    db.shopItems.push(newItem);
    writeDB(db);
    res.status(201).json(newItem);
});

// Delete item
app.post('/api/items/delete', (req, res) => {
    const { id } = req.body;
    const db = readDB();

    const customIndex = db.shopItems.findIndex(item => item.id === id && id > 3);

    if (id <= 3 || customIndex === -1) {
        // Default item or someone trying to delete by ID
        if (!db.deletedIds.includes(id)) {
            db.deletedIds.push(id);
        }
    }

    // Also remove from shopItems if it's a custom item
    const finalIndex = db.shopItems.findIndex(item => item.id === id);
    if (finalIndex !== -1 && id > 3) {
        db.shopItems.splice(finalIndex, 1);
    }

    writeDB(db);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
