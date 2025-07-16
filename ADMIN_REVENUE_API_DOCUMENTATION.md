# Admin Revenue API Documentation

This document describes the Admin Revenue API endpoints for comprehensive revenue management, including deposits, withdrawals, investments, and financial analytics.

## Base URL
```
http://localhost:3100/admin-revenue
```

## Authentication
All endpoints require admin authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <admin_jwt_token>
```

---

## Revenue Overview

### 1. Get Comprehensive Revenue Overview
**GET** `/overview`

Get complete revenue statistics including deposits, withdrawals, investments, and financial metrics.

**Response:**
```json
{
    "success": true,
    "data": {
        "totalRevenue": {
            "deposits": 500000,
            "withdrawals": 300000,
            "investments": 250000,
            "investmentReturns": 75000,
            "netRevenue": 200000,
            "profitMargin": "40.00"
        },
        "monthlyRevenue": {
            "deposits": 45000,
            "withdrawals": 25000,
            "netRevenue": 20000,
            "growthRate": "44.44"
        },
        "pendingAmounts": {
            "deposits": 15000,
            "withdrawals": 8000,
            "total": 23000
        },
        "summary": {
            "totalUsers": 1250,
            "activeInvestments": 180,
            "completedInvestments": 95,
            "withdrawnInvestments": 85
        }
    }
}
```

---

## Deposit Management

### 2. Get All Deposits
**GET** `/deposits`

Get all deposit requests with filtering and pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status (pending, approved, rejected)
- `startDate` (optional): Start date for filtering (YYYY-MM-DD)
- `endDate` (optional): End date for filtering (YYYY-MM-DD)

**Response:**
```json
{
    "success": true,
    "data": {
        "deposits": [
            {
                "_id": "64f8a1b2c3d4e5f678901234",
                "userId": {
                    "_id": "64f8a1b2c3d4e5f678901235",
                    "name": "John Doe",
                    "email": "john@example.com",
                    "phone": "+1234567890"
                },
                "amount": 1000,
                "status": "approved",
                "paymentProof": "paymentProof-1234567890.png",
                "createdAt": "2024-01-15T10:30:00.000Z",
                "approvedAt": "2024-01-15T11:00:00.000Z"
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 25,
            "totalDeposits": 500,
            "hasNext": true,
            "hasPrev": false
        },
        "summary": {
            "totalAmount": 500000,
            "pendingCount": 25,
            "approvedCount": 450,
            "rejectedCount": 25
        }
    }
}
```

---

## Withdrawal Management

### 3. Get All Withdrawals
**GET** `/withdrawals`

Get all withdrawal requests with filtering and pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status (pending, approved, rejected)
- `startDate` (optional): Start date for filtering (YYYY-MM-DD)
- `endDate` (optional): End date for filtering (YYYY-MM-DD)

**Response:**
```json
{
    "success": true,
    "data": {
        "withdrawals": [
            {
                "_id": "64f8a1b2c3d4e5f678901234",
                "userId": {
                    "_id": "64f8a1b2c3d4e5f678901235",
                    "name": "John Doe",
                    "email": "john@example.com",
                    "phone": "+1234567890"
                },
                "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
                "amount": 1000,
                "status": "approved",
                "createdAt": "2024-01-15T10:30:00.000Z",
                "approvedAt": "2024-01-15T11:00:00.000Z",
                "transactionHash": "0x1234567890abcdef..."
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 15,
            "totalWithdrawals": 300,
            "hasNext": true,
            "hasPrev": false
        },
        "summary": {
            "totalAmount": 300000,
            "pendingCount": 12,
            "approvedCount": 280,
            "rejectedCount": 8
        }
    }
}
```

---

## Investment Management

### 4. Get All User Investments
**GET** `/investments`

Get all user investments with filtering and pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status (active, completed, withdrawn)
- `startDate` (optional): Start date for filtering (YYYY-MM-DD)
- `endDate` (optional): End date for filtering (YYYY-MM-DD)

**Response:**
```json
{
    "success": true,
    "data": {
        "investments": [
            {
                "_id": "64f8a1b2c3d4e5f678901234",
                "userId": {
                    "_id": "64f8a1b2c3d4e5f678901235",
                    "name": "John Doe",
                    "email": "john@example.com",
                    "phone": "+1234567890"
                },
                "planId": {
                    "_id": "64f8a1b2c3d4e5f678901236",
                    "title": "Premium Plan",
                    "dailyPercentage": 2.5,
                    "durationDays": 30
                },
                "investmentAmount": 10000,
                "totalEarned": 7500,
                "isCompleted": false,
                "isWithdrawn": false,
                "createdAt": "2024-01-15T10:30:00.000Z",
                "endDate": "2024-02-14T10:30:00.000Z"
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 20,
            "totalInvestments": 400,
            "hasNext": true,
            "hasPrev": false
        },
        "summary": {
            "totalAmount": 250000,
            "totalEarned": 75000,
            "activeCount": 180,
            "completedCount": 95,
            "withdrawnCount": 85
        }
    }
}
```

---

## Analytics & Charts

### 5. Get Revenue Chart Data
**GET** `/revenue-chart`

Get daily revenue data for chart visualization.

**Query Parameters:**
- `period` (optional): Number of days (default: 30)

**Response:**
```json
{
    "success": true,
    "data": {
        "period": 30,
        "revenueData": [
            {
                "date": "2024-01-01",
                "deposits": 5000,
                "withdrawals": 2000,
                "investments": 3000,
                "netRevenue": 3000,
                "depositCount": 5,
                "withdrawalCount": 2,
                "investmentCount": 3
            },
            {
                "date": "2024-01-02",
                "deposits": 7500,
                "withdrawals": 1500,
                "investments": 4500,
                "netRevenue": 6000,
                "depositCount": 8,
                "withdrawalCount": 1,
                "investmentCount": 4
            }
        ]
    }
}
```

### 6. Get Top Revenue Generating Users
**GET** `/top-users`

Get top performing users by different revenue metrics.

**Query Parameters:**
- `type` (optional): Type of ranking (deposits, withdrawals, investments) (default: deposits)

**Response:**
```json
{
    "success": true,
    "data": {
        "type": "deposits",
        "topUsers": [
            {
                "name": "John Doe",
                "email": "john@example.com",
                "phone": "+1234567890",
                "totalDeposits": 50000,
                "depositCount": 10
            },
            {
                "name": "Jane Smith",
                "email": "jane@example.com",
                "phone": "+1234567891",
                "totalDeposits": 45000,
                "depositCount": 8
            }
        ]
    }
}
```

---

## Data Export

### 7. Export Revenue Data
**GET** `/export`

Export revenue data for reporting and analysis.

**Query Parameters:**
- `type` (required): Type of data to export (deposits, withdrawals, investments)
- `startDate` (optional): Start date for filtering (YYYY-MM-DD)
- `endDate` (optional): End date for filtering (YYYY-MM-DD)

**Response:**
```json
{
    "success": true,
    "data": {
        "type": "deposits",
        "records": [
            {
                "_id": "64f8a1b2c3d4e5f678901234",
                "userId": {
                    "_id": "64f8a1b2c3d4e5f678901235",
                    "name": "John Doe",
                    "email": "john@example.com",
                    "phone": "+1234567890"
                },
                "amount": 1000,
                "status": "approved",
                "createdAt": "2024-01-15T10:30:00.000Z"
            }
        ],
        "totalRecords": 500,
        "exportDate": "2024-01-15T12:00:00.000Z"
    }
}
```

---

## Revenue Metrics Breakdown

### Total Revenue Metrics
- **Deposits**: Total approved deposit amount
- **Withdrawals**: Total approved withdrawal amount
- **Investments**: Total investment amount
- **Investment Returns**: Total earnings from investments
- **Net Revenue**: Deposits - Withdrawals
- **Profit Margin**: (Net Revenue / Deposits) × 100

### Monthly Revenue Metrics
- **Monthly Deposits**: Deposits this month
- **Monthly Withdrawals**: Withdrawals this month
- **Monthly Net Revenue**: Monthly deposits - Monthly withdrawals
- **Growth Rate**: Monthly net revenue growth percentage

### Pending Amounts
- **Pending Deposits**: Total pending deposit amount
- **Pending Withdrawals**: Total pending withdrawal amount
- **Total Pending**: Sum of pending deposits and withdrawals

### Investment Metrics
- **Active Investments**: Currently running investments
- **Completed Investments**: Finished investments
- **Withdrawn Investments**: Investments that have been withdrawn
- **Total Investment Amount**: Sum of all investment amounts
- **Total Earned**: Sum of all investment earnings

---

## Filtering Options

### Date Range Filtering
```bash
# Get deposits from specific date range
GET /admin-revenue/deposits?startDate=2024-01-01&endDate=2024-01-31

# Get withdrawals from specific date range
GET /admin-revenue/withdrawals?startDate=2024-01-01&endDate=2024-01-31

# Get investments from specific date range
GET /admin-revenue/investments?startDate=2024-01-01&endDate=2024-01-31
```

### Status Filtering
```bash
# Get only pending deposits
GET /admin-revenue/deposits?status=pending

# Get only approved withdrawals
GET /admin-revenue/withdrawals?status=approved

# Get only active investments
GET /admin-revenue/investments?status=active
```

### Pagination
```bash
# Get first page with 10 items
GET /admin-revenue/deposits?page=1&limit=10

# Get second page with 20 items
GET /admin-revenue/withdrawals?page=2&limit=20
```

---

## Chart Data Usage

### Revenue Chart with Chart.js
```javascript
// Example usage with Chart.js
const ctx = document.getElementById('revenueChart').getContext('2d');
new Chart(ctx, {
    type: 'line',
    data: {
        labels: response.data.revenueData.map(item => item.date),
        datasets: [{
            label: 'Deposits',
            data: response.data.revenueData.map(item => item.deposits),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1
        }, {
            label: 'Withdrawals',
            data: response.data.revenueData.map(item => item.withdrawals),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            tension: 0.1
        }, {
            label: 'Net Revenue',
            data: response.data.revenueData.map(item => item.netRevenue),
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            tension: 0.1
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});
```

---

## Dashboard Widgets

### Revenue Overview Widget
```json
{
    "totalRevenue": 200000,
    "monthlyRevenue": 20000,
    "profitMargin": "40.00",
    "growthRate": "44.44",
    "pendingAmount": 23000
}
```

### Transaction Summary Widget
```json
{
    "totalDeposits": 500000,
    "totalWithdrawals": 300000,
    "totalInvestments": 250000,
    "pendingDeposits": 25,
    "pendingWithdrawals": 12
}
```

### Investment Summary Widget
```json
{
    "activeInvestments": 180,
    "completedInvestments": 95,
    "withdrawnInvestments": 85,
    "totalInvestmentAmount": 250000,
    "totalEarned": 75000
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Non-admin access |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

---

## Example Usage

### Get Revenue Overview:
```bash
curl -X GET http://localhost:3000/admin-revenue/overview \
  -H "Authorization: Bearer <admin_token>"
```

### Get Deposits with Filtering:
```bash
curl -X GET "http://localhost:3000/admin-revenue/deposits?status=pending&page=1&limit=20" \
  -H "Authorization: Bearer <admin_token>"
```

### Get Revenue Chart Data:
```bash
curl -X GET "http://localhost:3000/admin-revenue/revenue-chart?period=90" \
  -H "Authorization: Bearer <admin_token>"
```

### Get Top Investment Users:
```bash
curl -X GET "http://localhost:3000/admin-revenue/top-users?type=investments" \
  -H "Authorization: Bearer <admin_token>"
```

### Export Withdrawal Data:
```bash
curl -X GET "http://localhost:3000/admin-revenue/export?type=withdrawals&startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <admin_token>"
```

---

## Revenue Management Features

### Real-time Analytics
- Live revenue tracking
- Real-time profit calculations
- Pending transaction monitoring
- Investment performance metrics

### Financial Reporting
- Comprehensive revenue overview
- Monthly and yearly comparisons
- Profit margin calculations
- Growth rate analysis

### Data Management
- Advanced filtering options
- Date range selection
- Status-based filtering
- Pagination for large datasets

### Export Capabilities
- Export deposit data
- Export withdrawal data
- Export investment data
- Date range filtering for exports

### Top Performer Analysis
- Top deposit users
- Top withdrawal users
- Top investment users
- Performance rankings

---

## Notes

1. **Admin Only Access**: All endpoints require admin authentication
2. **Real-time Data**: All calculations are performed in real-time
3. **Performance Optimized**: Uses MongoDB aggregation for efficient queries
4. **Scalable**: Designed to handle large datasets
5. **Secure**: All data is properly filtered and validated
6. **Chart Ready**: Data is formatted for easy chart integration
7. **Export Friendly**: Data can be exported for external analysis
8. **Comprehensive Filtering**: Multiple filtering options for detailed analysis 