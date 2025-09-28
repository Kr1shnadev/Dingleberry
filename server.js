const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 3000;

// Get the MongoDB connection string from Vercel's environment variables
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let statsCollection;

// Function to connect to the database
async function connectToDatabase() {
  try {
    await client.connect();
    const database = client.db('visitor_app'); // You can name your database anything
    statsCollection = database.collection('stats');
    console.log('Successfully connected to MongoDB Atlas!');

    // Ensure our stats document exists
    const statsDoc = await statsCollection.findOne({ _id: 'live_stats' });
    if (!statsDoc) {
      await statsCollection.insertOne({ _id: 'live_stats', count: 0, latestName: null });
    }
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    process.exit(1); // Exit if we can't connect to the DB
  }
}

app.use(express.json());
app.use(express.static('public'));
app.use(cookieParser());

// API endpoint to get data and handle visitor count
app.get('/api/data', async (req, res) => {
  try {
    let updateQuery;

    // Check for the 'hasVisited' cookie
    if (!req.cookies.hasVisited) {
      // New visitor: increment the count
      updateQuery = { $inc: { count: 1 } };
      // Give them a cookie that expires in 1 year
      res.cookie('hasVisited', 'true', { maxAge: 31536000000, httpOnly: true, secure: true });
    } else {
      // Returning visitor: don't increment
      updateQuery = {};
    }

    // Find the document and update it (if necessary)
    // The 'returnOriginal: false' option is deprecated, use 'returnDocument: 'after''
    const updatedDoc = await statsCollection.findOneAndUpdate(
      { _id: 'live_stats' },
      updateQuery,
      { returnDocument: 'after', upsert: true } // upsert creates the doc if it doesn't exist
    );

    res.json(updatedDoc);
  } catch (error) {
    console.error('Error getting data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// API endpoint to update the latest name
app.post('/api/name', async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Name cannot be empty.' });
  }

  try {
    const result = await statsCollection.updateOne(
      { _id: 'live_stats' },
      { $set: { latestName: name } }
    );
    res.json({ success: true, latestName: name });
  } catch (error) {
    console.error('Error updating name:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Start the server after connecting to the database
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});