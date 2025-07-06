// Global variables
let records = [];
let currentPage = 1;
let recordsPerPage = 10;
let currentFilter = 'all';
let currentSort = 'date-desc';
let incomeChart = null;
let categoryChart = null;

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    // Set current date as default in forms
    const today = new Date().toISOString().split('T')[0];
    if (document.getElementById('date')) {
        document.getElementById('date').value = today;
    }
    
    // Initialize event listeners
    if (document.getElementById('incomeForm')) {
        document.getElementById('incomeForm').addEventListener('submit', addRecord);
    }
    
    // For user view
    if (document.getElementById('searchInput')) {
        document.getElementById('searchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchRecords();
            }
        });
        
        // Load records for user view
        fetchRecords();
        fetchDashboardData();
    }
});

// ======================
// RECORD CRUD OPERATIONS
// ======================

function addRecord(e) {
    e.preventDefault();
    
    const form = e.target;
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }
    
    const newRecord = {
        description: document.getElementById('description').value,
        amount: parseFloat(document.getElementById('amount').value),
        date: document.getElementById('date').value,
        category: document.getElementById('category').value
    };
    
    fetch('/api/records', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRecord)
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(data => {
        if (data.success) {
            form.reset();
            form.classList.remove('was-validated');
            fetchRecords();
            fetchDashboardData();
            showToast('Record added successfully!', 'success');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error adding record', 'danger');
    });
}

function fetchRecords() {
    fetch(`/api/records?filter=${currentFilter}&sort=${currentSort}`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            records = data;
            updateRecordTable();
            updatePagination();
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error loading records', 'danger');
        });
}

function editRecord(id) {
    const record = records.find(r => r._id === id);
    if (!record) return;
    
    document.getElementById('editRecordId').value = record._id;
    document.getElementById('editDescription').value = record.description;
    document.getElementById('editAmount').value = record.amount;
    document.getElementById('editDate').value = record.date.split('T')[0];
    document.getElementById('editCategory').value = record.category;
    
    const modal = new bootstrap.Modal(document.getElementById('editRecordModal'));
    modal.show();
}

function updateRecord() {
    const id = document.getElementById('editRecordId').value;
    const updatedRecord = {
        description: document.getElementById('editDescription').value,
        amount: parseFloat(document.getElementById('editAmount').value),
        date: document.getElementById('editDate').value,
        category: document.getElementById('editCategory').value
    };
    
    fetch(`/api/records/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedRecord)
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(data => {
        if (data.success) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('editRecordModal'));
            modal.hide();
            fetchRecords();
            fetchDashboardData();
            showToast('Record updated successfully!', 'success');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error updating record', 'danger');
    });
}

function deleteRecord(id) {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    fetch(`/api/records/${id}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(data => {
        if (data.success) {
            fetchRecords();
            fetchDashboardData();
            showToast('Record deleted successfully!', 'success');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error deleting record', 'danger');
    });
}

// ======================
// TABLE & PAGINATION
// ======================

function updateRecordTable() {
    const tableBody = document.getElementById('recordTable') || document.getElementById('userRecordTable');
    if (!tableBody) return;
    
    // Calculate pagination
    const startIdx = (currentPage - 1) * recordsPerPage;
    const endIdx = startIdx + recordsPerPage;
    const paginatedRecords = records.slice(startIdx, endIdx);
    
    tableBody.innerHTML = '';
    
    if (paginatedRecords.length === 0) {
        const colspan = tableBody.id === 'recordTable' ? 5 : 4;
        tableBody.innerHTML = `<tr><td colspan="${colspan}" class="text-center py-4 text-muted">No records found</td></tr>`;
        return;
    }
    
    paginatedRecords.forEach(record => {
        const row = document.createElement('tr');
        
        // Make rows clickable in user view
        if (tableBody.id === 'userRecordTable') {
            row.style.cursor = 'pointer';
            row.addEventListener('click', () => showRecordDetails(record._id));
        }
        
        row.innerHTML = `
            <td>${record.description}</td>
            <td>Tsh${record.amount.toLocaleString()}</td>
            <td>${new Date(record.date).toLocaleDateString()}</td>
            <td><span class="badge bg-${getCategoryColor(record.category)}">${record.category}</span></td>
            ${tableBody.id === 'recordTable' ? `
            <td>
                <button class="btn btn-sm btn-primary me-1" onclick="event.stopPropagation(); editRecord('${record._id}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteRecord('${record._id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
            ` : ''}
        `;
        
        tableBody.appendChild(row);
    });
}

function updatePagination() {
    const totalPages = Math.ceil(records.length / recordsPerPage);
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
}

function changeRecordsPerPage() {
    recordsPerPage = parseInt(document.getElementById('recordsPerPage').value);
    currentPage = 1;
    updateRecordTable();
    updatePagination();
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        updateRecordTable();
        updatePagination();
    }
}

function nextPage() {
    const totalPages = Math.ceil(records.length / recordsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        updateRecordTable();
        updatePagination();
    }
}

// ======================
// FILTERING & SORTING
// ======================

function filterRecords(category) {
    currentFilter = category;
    currentPage = 1;
    fetchRecords();
}

function changeSort() {
    currentSort = document.getElementById('sortSelect').value;
    currentPage = 1;
    fetchRecords();
}

function searchRecords() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm.trim() === '') {
        fetchRecords();
        return;
    }
    
    fetch('/api/records')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            records = data.filter(record => 
                record.description.toLowerCase().includes(searchTerm) ||
                record.category.toLowerCase().includes(searchTerm)
            );
            currentPage = 1;
            updateRecordTable();
            updatePagination();
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error searching records', 'danger');
        });
}

// ======================
// DASHBOARD & CHARTS
// ======================

function fetchDashboardData() {
    fetch('/api/dashboard')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            // Update dashboard cards
            if (document.getElementById('totalIncome')) {
                document.getElementById('totalIncome').textContent = `Tsh${data.totalIncome.toLocaleString()}`;
                document.getElementById('recordsCount').textContent = data.recordsCount;
                // Display the modified average
            document.getElementById('averageIncome').textContent = `Tsh${data.averageIncome.toLocaleString()}`;
            document.getElementById('averageIncome').setAttribute('title', 'Calculated as (Total Income - 2,740,000)');
                document.getElementById('lastRecordDate').textContent = data.lastRecordDate ? 
                    new Date(data.lastRecordDate).toLocaleDateString() : '-';
            }
            
            // Update charts if on analytics section
            if (document.getElementById('analytics-section') && document.getElementById('analytics-section').style.display !== 'none') {
                updateCharts(data.chartData);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error loading dashboard data', 'danger');
        });
}

function updateCharts(chartData) {
    // Destroy existing charts if they exist
    if (incomeChart) incomeChart.destroy();
    if (categoryChart) categoryChart.destroy();
    
    // Income Trends Chart (Line Chart)
    const incomeCtx = document.getElementById('incomeChart')?.getContext('2d');
    if (incomeCtx) {
        incomeChart = new Chart(incomeCtx, {
            type: 'line',
            data: {
                labels: chartData.monthly.labels,
                datasets: [{
                    label: 'Monthly Income',
                    data: chartData.monthly.data,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Tsh${context.raw.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return `Tsh${value.toLocaleString()}`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Income by Category Chart (Doughnut Chart)
    const categoryCtx = document.getElementById('categoryChart')?.getContext('2d');
    if (categoryCtx) {
        categoryChart = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: chartData.categories.labels,
                datasets: [{
                    data: chartData.categories.data,
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: Tsh${context.raw.toLocaleString()}`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// ======================
// UTILITY FUNCTIONS
// ======================

function showSection(sectionId) {
    // Hide all sections
    document.getElementById('dashboard-section').style.display = 'none';
    document.getElementById('records-section').style.display = 'none';
    document.getElementById('analytics-section').style.display = 'none';
    
    // Show the selected section
    document.getElementById(sectionId).style.display = 'block';
    
    // If showing analytics, update charts
    if (sectionId === 'analytics-section') {
        fetchDashboardData();
    }
}

function showRecordDetails(id) {
    const record = records.find(r => r._id === id);
    if (!record) return;
    
    const modalBody = document.getElementById('recordModalBody');
    modalBody.innerHTML = `
        <div class="mb-3">
            <h6>Description</h6>
            <p>${record.description}</p>
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <h6>Amount</h6>
                <p>Tsh${record.amount.toLocaleString()}</p>
            </div>
            <div class="col-md-6 mb-3">
                <h6>Date</h6>
                <p>${new Date(record.date).toLocaleDateString()}</p>
            </div>
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <h6>Category</h6>
                <p><span class="badge bg-${getCategoryColor(record.category)}">${record.category}</span></p>
            </div>
            <div class="col-md-6 mb-3">
                <h6>Recorded On</h6>
                <p>${new Date(record.createdAt).toLocaleString()}</p>
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('recordModal'));
    modal.show();
}

function getCategoryColor(category) {
    const colors = {
        'Salary': 'primary',
        'Freelance': 'success',
        'Investment': 'info',
        'Gift': 'warning',
        'Other': 'secondary'
    };
    return colors[category] || 'light';
}

function showToast(message, type) {
    const toastContainer = document.createElement('div');
    toastContainer.innerHTML = `
        <div class="toast align-items-center text-white bg-${type} border-0 show" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    toastContainer.style.position = 'fixed';
    toastContainer.style.top = '20px';
    toastContainer.style.right = '20px';
    toastContainer.style.zIndex = '9999';
    
    document.body.appendChild(toastContainer);
    
    setTimeout(() => {
        toastContainer.remove();
    }, 3000);
}

// ======================
// EXPORT & BACKUP
// ======================

function printRecords() {
    window.print();
}

function exportToCSV() {
    fetch('/api/records/export')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'income_records.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error exporting to CSV', 'danger');
        });
}

function showBackupModal() {
    const modal = new bootstrap.Modal(document.getElementById('backupModal'));
    modal.show();
}

function downloadBackup() {
    fetch('/api/records/backup')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `income_records_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error creating backup', 'danger');
        });
}