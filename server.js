const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;

// MongoDB connection string (replace with your own)
const uri = 'mongodb+srv://admin:admin@cluster0.hndm8.mongodb.net/invoices?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let db; // Global variable to hold the database connection

// Connect to MongoDB
function connectToMongoDB(callback) {
  client.connect()
    .then(() => {
      db = client.db('invoices'); // Assign global db
      console.log('Connected to MongoDB');
      callback(null, db);
    })
    .catch(error => {
      console.error('Error connecting to MongoDB:', error);
      callback(error);
    });
}

// Save data to MongoDB
function saveData(collectionName, data, callback) {
  const collection = db.collection(collectionName);
  collection.insertOne(data)
    .then(() => {
      console.log(`Data saved to ${collectionName}`);
      callback(null);
    })
    .catch(error => {
      console.error(`Error saving data to ${collectionName}:`, error);
      callback(error);
    });
}

function fetchData(collectionName, callback) {
  const collection = db.collection(collectionName);
  collection.find({}).toArray()
    .then(data => callback(null, data))
    .catch(error => {
      console.error(`Error fetching data from ${collectionName}:`, error);
      callback(error, []);
    });
}


// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve the frontend
app.use(express.static(__dirname)); // Serve files from the root directory

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/api/data', (req, res) => {
  fetchData('bills', (err, bills) => {
    if (err) return res.status(500).json({ error: 'Error fetching bills' });

    fetchData('payments', (err, payments) => {
      if (err) return res.status(500).json({ error: 'Error fetching payments' });

      fetchData('teachers', (err, teachers) => {
        if (err) return res.status(500).json({ error: 'Error fetching teachers' });

        res.json({ bills, payments, teachers });
      });
    });
  });
});

// API to add a new bill
app.post('/api/bills', (req, res) => {
  const bill = req.body;

  saveData('bills', bill, (err) => {
    if (err) return res.status(500).json({ error: 'Error saving bill' });

    fetchData('teachers', (err, teachers) => {
      if (err) return res.status(500).json({ error: 'Error fetching teachers' });

      if (!teachers.some(teacher => teacher.name === bill.teacherName)) {
        saveData('teachers', { name: bill.teacherName }, (err) => {
          if (err) return res.status(500).json({ error: 'Error saving teacher' });
          res.json({ message: 'Bill and teacher added successfully', bill });
        });
      } else {
        res.json({ message: 'Bill added successfully', bill });
      }
    });
  });
});

// API to add a new payment
app.post('/api/payments', (req, res) => {
  const payment = req.body;

  saveData('payments', payment, (err) => {
    if (err) return res.status(500).json({ error: 'Error saving payment' });

    res.json({ message: 'Payment added successfully', payment });
  });
});

// Start the server and connect to MongoDB
app.listen(port, () => {
  connectToMongoDB((err, database) => {
    if (err) {
      console.error('Failed to connect to MongoDB:', err);
      process.exit(1);
    }
    
    db = database; // Assign the connected database
    console.log(`Server is running on https://invoices-rho.vercel.app/`);
  });
});
