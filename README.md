# Income Records Management System

## Overview
The **Income Records Management System** is a web application designed to track and manage income records with features for viewing, adding, editing, and analyzing financial data. The system includes both a user view and an admin interface with enhanced capabilities.

---

**Click here to view the website:**

```
https://malipo-bodaboda.onrender.com

```

## Features

### ✅ User View
- View paginated income records with sorting and filtering  
- See summary statistics (total income, record count, remaining debt)  
- Print all records in a report format  

### 🔐 Admin Panel
- Password-protected access  
- Full CRUD operations for income records  
- Data visualization with charts  
- Export data to CSV and JSON  
- Backup and restore functionality  
- Print comprehensive reports  

---

## Technologies Used

### 🖥 Frontend
- HTML5, CSS3, JavaScript  
- Bootstrap 5 (with custom styling)  
- Chart.js for data visualization  
- Font Awesome icons  

### 🛠 Backend
- Node.js with Express  
- File-based data storage (JSON)  
- CSV export functionality  

---

## Installation

### Prerequisites
- Node.js (v14 or higher)  
- npm or yarn  

### Setup Steps

1. **Clone the repository:**

```bash
git clone https://github.com/Azi77ry/payment

```

2. **Install dependencies:**

```bash
npm install
```

3. **Configure environment variables:**  
Create a `.env` file in the root directory with the following:

```env
PORT=3000
ALLOWED_ORIGINS=http://localhost,http://127.0.0.1
DEBT_ADJUSTMENT=2740000
```

4. **Start the server:**

```bash
node server.js
```

5. **Open the application in your browser:**

```
http://localhost:3000
```

---

## File Structure

```
income-records/
├── public/            # Static files
│   ├── css/
│   │   └── styles.css # Custom styles
│   └── js/
│       └── script.js  # Client-side JavaScript
├── data/              # Data storage
│   └── records.json   # Income records database
├── views/             # HTML templates
│   ├── index.html     # User view
│   └── admin.html     # Admin panel
├── server.js          # Backend server
├── package.json       # Project configuration
└── README.md          # This file
```

---

## Usage

### 👤 User View
- Navigate to `http://localhost:3000`  
- View income records in the table  
- Use the search and sort functionality  
- Click "Print" to generate a report of all records  

### 🛠 Admin Panel
- Navigate to `http://localhost:3000/admin.html`  
- Enter the admin password (default: `lulu123`)  
- Manage records through the dashboard interface  
- Use the analytics section to view charts  
- Export data or create backups as needed  

---

## API Endpoints

| Method | Endpoint               | Description                     |
|--------|------------------------|---------------------------------|
| GET    | `/api/records`         | Get all records (filter/sort)  |
| POST   | `/api/records`         | Add a new record               |
| PUT    | `/api/records/:id`     | Update a specific record       |
| DELETE | `/api/records/:id`     | Delete a specific record       |
| GET    | `/api/dashboard`       | Get dashboard statistics       |
| GET    | `/api/records/export`  | Export records as CSV          |
| GET    | `/api/records/backup`  | Download JSON backup           |

---

## License
This project is open-source and available for personal or educational use.
## Contact
+255692350076
Email: Aziziiddi555@gmail.com

