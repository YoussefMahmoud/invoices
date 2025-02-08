
const express = require('express');
const cors = require('cors');

const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;


app.use(cors());

// Middleware to parse JSON data
app.use(bodyParser.json());

// Path to the data file
const dataFilePath = path.join(__dirname, 'data.json');

// Load initial data from the file
let data = { bills: [], payments: [], teachers: [] };
if (fs.existsSync(dataFilePath)) {
    const fileData = fs.readFileSync(dataFilePath, 'utf8');
    data = JSON.parse(fileData);
}

// Save data to the file
function saveData() {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
}

app.get('/', (req, res) => {
    res.sendFile(__dirname+"/index.html");
});
// API to get all data
app.get('/api/data', (req, res) => {
    res.json(data);
});

// API to add a new bill
app.post('/api/bills', (req, res) => {
    const bill = req.body;
    data.bills.push(bill);
    if (!data.teachers.includes(bill.teacherName)) {
        data.teachers.push(bill.teacherName);
    }
    saveData();
    res.json({ message: 'Bill added successfully', bill });
});

// API to add a new payment
app.post('/api/payments', (req, res) => {
    const payment = req.body;
    data.payments.push(payment);
    saveData();
    res.json({ message: 'Payment added successfully', payment });
});

// Serve the frontend
app.use(express.static(path.join(__dirname, 'public')));

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});