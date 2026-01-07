
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Database Setup
const db = new sqlite3.Database('./survey_database.sqlite', (err) => {
    if (err) console.error('Database opening error:', err);
    console.log('Connected to SQLite database.');
});

// Create Tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY,
        restaurantName TEXT,
        adminPassword TEXT,
        logoUrl TEXT,
        backgroundUrl TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS responses (
        id TEXT PRIMARY KEY,
        timestamp INTEGER,
        language TEXT,
        answers TEXT
    )`);

    // Initialize default settings if empty
    db.get("SELECT count(*) as count FROM settings", (err, row) => {
        if (row.count === 0) {
            db.run(`INSERT INTO settings (restaurantName, adminPassword, logoUrl, backgroundUrl) 
                    VALUES (?, ?, ?, ?)`, 
                    ['无界餐饮', '568568', '', '']);
        }
    });
});

// Multer Config for File Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// API Routes
app.get('/api/settings', (req, res) => {
    db.get("SELECT * FROM settings WHERE id = 1", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
    });
});

app.post('/api/settings', (req, res) => {
    const { restaurantName, adminPassword, logoUrl, backgroundUrl } = req.body;
    db.run(`UPDATE settings SET restaurantName = ?, adminPassword = ?, logoUrl = ?, backgroundUrl = ? WHERE id = 1`,
        [restaurantName, adminPassword, logoUrl, backgroundUrl],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
});

app.post('/api/responses', (req, res) => {
    const { id, timestamp, language, answers } = req.body;
    db.run(`INSERT INTO responses (id, timestamp, language, answers) VALUES (?, ?, ?, ?)`,
        [id, timestamp, language, JSON.stringify(answers)],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id });
        }
    );
});

app.get('/api/responses', (req, res) => {
    db.all("SELECT * FROM responses ORDER BY timestamp DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const parsedRows = rows.map(r => ({ ...r, answers: JSON.parse(r.answers) }));
        res.json(parsedRows);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
