const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Path to our simple database file
const dbPath = path.join(__dirname, 'db.json');

// Middleware to parse JSON bodies and serve static files
app.use(express.json());
app.use(express.static('public'));

// Helper function to read from our database file
function readDB() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If the file doesn't exist, create it with default values
    const initialData = { count: 0, latestName: null };
    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
    return initialData;
  }
}

// Helper function to write to our database file
function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// API endpoint to get the current data and increment count
app.get('/api/data', (req, res) => {
  const db = readDB();
  db.count++; // Increment the visitor count
  writeDB(db);
  res.json(db);
});

// API endpoint to update the latest name
app.post('/api/name', (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Name cannot be empty.' });
  }

  const db = readDB();
  db.latestName = name;
  writeDB(db);
  res.json({ success: true, latestName: db.latestName });
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});