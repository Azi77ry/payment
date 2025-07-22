const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const csv = require('csv-writer').createObjectCsvStringifier;

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'records.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// Middleware
app.use(cors({
    origin: ['http://localhost', 'http://127.0.0.1'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper function to read records
function readRecords() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading records:', err);
        return [];
    }
}

// Helper function to write records
function writeRecords(records) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2));
        return true;
    } catch (err) {
        console.error('Error writing records:', err);
        return false;
    }
}

// API Routes
// Modify your GET /api/records endpoint
app.get('/api/records', async (req, res) => {
    try {
        let records = await readRecords();
        
        // Apply filtering
        const filter = req.query.filter;
        if (filter && filter !== 'all') {
            records = records.filter(record => record.category === filter);
        }
        
        // Apply sorting
        const sort = req.query.sort || 'date-desc';
        switch (sort) {
            case 'date-asc':
                records.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'date-desc':
                records.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'amount-asc':
                records.sort((a, b) => a.amount - b.amount);
                break;
            case 'amount-desc':
                records.sort((a, b) => b.amount - a.amount);
                break;
        }

        // Check if client requested all records (no pagination)
        if (req.query.limit === 'all') {
            return res.json(records);
        }
        
        res.json(records);
    } catch (error) {
        console.error('Error in GET /api/records:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/records', (req, res) => {
    try {
        const records = readRecords();
        const newRecord = {
            _id: uuidv4(),
            ...req.body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        records.push(newRecord);
        const success = writeRecords(records);
        
        res.json({ success, record: newRecord });
    } catch (error) {
        console.error('Error in POST /api/records:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/records/:id', (req, res) => {
    try {
        const records = readRecords();
        const index = records.findIndex(record => record._id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Record not found' });
        }
        
        const updatedRecord = {
            ...records[index],
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        
        records[index] = updatedRecord;
        const success = writeRecords(records);
        
        res.json({ success, record: updatedRecord });
    } catch (error) {
        console.error('Error in PUT /api/records:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/records/:id', (req, res) => {
    try {
        const records = readRecords();
        const filteredRecords = records.filter(record => record._id !== req.params.id);
        
        if (records.length === filteredRecords.length) {
            return res.status(404).json({ success: false, message: 'Record not found' });
        }
        
        const success = writeRecords(filteredRecords);
        res.json({ success });
    } catch (error) {
        console.error('Error in DELETE /api/records:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/dashboard', (req, res) => {
    try {
        const records = readRecords();
        
        // Calculate basic stats
        const totalIncome = records.reduce((sum, record) => sum + record.amount, 0);
        const recordsCount = records.length;
        //const averageIncome = recordsCount > 0 ? totalIncome - 2740000 : 0;
        const averageIncome = totalIncome - 2740000;
        const lastRecordDate = recordsCount > 0 ? records[0].date : null;
        
        // Prepare chart data
        const monthlyData = prepareMonthlyData(records);
        const categoryData = prepareCategoryData(records);
        
        res.json({
            totalIncome,
            recordsCount,
            averageIncome,
            lastRecordDate,
            chartData: {
                monthly: monthlyData,
                categories: categoryData
            }
        });
    } catch (error) {
        console.error('Error in GET /api/dashboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/records/export', (req, res) => {
    try {
        const records = readRecords();
        
        const csvStringifier = csv({
            header: [
                { id: 'description', title: 'Description' },
                { id: 'amount', title: 'Amount' },
                { id: 'date', title: 'Date' },
                { id: 'category', title: 'Category' },
                { id: 'createdAt', title: 'Created At' }
            ]
        });
        
        const csvData = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=income_records.csv');
        res.send(csvData);
    } catch (error) {
        console.error('Error in GET /api/records/export:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/records/backup', (req, res) => {
    try {
        const records = readRecords();
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=income_records_backup_${new Date().toISOString().split('T')[0]}.json`);
        res.send(JSON.stringify(records, null, 2));
    } catch (error) {
        console.error('Error in GET /api/records/backup:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Helper functions for chart data
function prepareMonthlyData(records) {
    const monthlySums = {};
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Initialize for current year
    for (let month = 0; month < 12; month++) {
        const monthKey = `${currentYear}-${String(month + 1).padStart(2, '0')}`;
        monthlySums[monthKey] = 0;
    }
    
    // Sum amounts by month
    records.forEach(record => {
        const recordDate = new Date(record.date);
        if (recordDate.getFullYear() === currentYear) {
            const monthKey = `${currentYear}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
            monthlySums[monthKey] += record.amount;
        }
    });
    
    // Convert to chart format
    const labels = [];
    const data = [];
    
    for (let month = 0; month < 12; month++) {
        const monthKey = `${currentYear}-${String(month + 1).padStart(2, '0')}`;
        const monthName = new Date(currentYear, month, 1).toLocaleString('default', { month: 'short' });
        labels.push(monthName);
        data.push(monthlySums[monthKey]);
    }
    
    return { labels, data };
}

function prepareCategoryData(records) {
    const categorySums = {};
    
    // Sum amounts by category
    records.forEach(record => {
        if (!categorySums[record.category]) {
            categorySums[record.category] = 0;
        }
        categorySums[record.category] += record.amount;
    });
    
    // Convert to chart format
    const labels = Object.keys(categorySums);
    const data = labels.map(category => categorySums[category]);
    
    return { labels, data };
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});