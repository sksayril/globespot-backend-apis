# Admin Dashboard API Documentation

This document describes the Admin Dashboard API endpoints for the MLM platform. These endpoints provide comprehensive statistics, analytics, and management tools for administrators.

## Base URL
```
http://localhost:3000/admin-dashboard
```

## Authentication
All endpoints require admin authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <admin_jwt_token>
```

---

## Dashboard Statistics

### 1. Get Comprehensive Dashboard Statistics
**GET** `/statistics`

Get all dashboard statistics including users, revenue, investments, and transactions.

**Response:**
```json
{
    "success": true,
    "data": {
        "users": {
            "total": 1250,
            "active": 1180,
            "blocked": 70,
            "newToday": 15,
            "newThisMonth": 245,
            "newThisYear": 1250,
            "withReferrals": 890
        },
        "revenue": {
            "totalDeposits": 500000,
            "totalWithdrawals": 300000,
            "totalInvestments": 250000,
            "totalInvestmentReturns": 75000,
            "monthlyDeposits": 45000,
            "monthlyWithdrawals": 25000,
            "netRevenue": 200000,
            "monthlyNetRevenue": 20000
        },
        "transactions": {
            "pendingDeposits": 25,
            "pendingWithdrawals": 12,
            "totalReferralBonus": 15000
        },
        "investments": {
            "active": 180,
            "completed": 95,
            "withdrawn": 85
        },
        "wallets": {
            "totalNormalBalance": 75000,
            "totalInvestmentBalance": 45000
        },
        "userFlow": {
            "dailyRegistrations": [
                {
                    "_id": "2024-01-15",
                    "count": 12
                },
                {
                    "_id": "2024-01-16",
                    "count": 18
                }
            ]
        }
    }
}
```

---

## User Management

### 2. Get Recent User Registrations
**GET** `/recent-users`

Get recent user registrations with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
    "success": true,
    "data": {
        "users": [
            {
                "_id": "64f8a1b2c3d4e5f678901234",
                "name": "John Doe",
                "email": "john@example.com",
                "phone": "+1234567890",
                "referralCode": "JOH123",
                "referredBy": {
                    "_id": "64f8a1b2c3d4e5f678901235",
                    "name": "Jane Smith",
                    "email": "jane@example.com"
                },
                "createdAt": "2024-01-15T10:30:00.000Z",
                "isActive": true,
                "isBlocked": false
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 125,
            "totalUsers": 1250,
            "hasNext": true,
            "hasPrev": false
        }
    }
}
```

### 3. Get Recent Transactions
**GET** `/recent-transactions`

Get recent deposits and withdrawals with user details.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
    "success": true,
    "data": {
        "transactions": [
            {
                "_id": "64f8a1b2c3d4e5f678901234",
                "userId": {
                    "_id": "64f8a1b2c3d4e5f678901235",
                    "name": "John Doe",
                    "email": "john@example.com"
                },
                "amount": 1000,
                "status": "approved",
                "type": "deposit",
                "createdAt": "2024-01-15T10:30:00.000Z"
            }
        ],
        "deposits": [...],
        "withdrawals": [...]
    }
}
```

---

## Analytics & Charts

### 4. Get User Growth Chart Data
**GET** `/user-growth`

Get user registration data for chart visualization.

**Query Parameters:**
- `period` (optional): Number of days (default: 30)

**Response:**
```json
{
    "success": true,
    "data": {
        "period": 30,
        "growthData": [
            {
                "date": "2024-01-01",
                "count": 12
            },
            {
                "date": "2024-01-02",
                "count": 18
            }
        ]
    }
}
```

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
                "netRevenue": 3000
            },
            {
                "date": "2024-01-02",
                "deposits": 7500,
                "withdrawals": 1500,
                "netRevenue": 6000
            }
        ]
    }
}
```

### 6. Get Top Performing Users
**GET** `/top-users`

Get top performing users by different metrics.

**Query Parameters:**
- `type` (optional): Type of ranking (investment, referral, deposit) (default: investment)

**Response:**
```json
{
    "success": true,
    "data": {
        "type": "investment",
        "topUsers": [
            {
                "name": "John Doe",
                "email": "john@example.com",
                "totalInvestment": 50000,
                "totalEarned": 7500,
                "investmentCount": 5
            }
        ]
    }
}
```

---

## Dashboard Metrics Breakdown

### User Statistics
- **Total Users**: All registered users
- **Active Users**: Users with active accounts
- **Blocked Users**: Users with blocked accounts
- **New Today**: Users registered today
- **New This Month**: Users registered this month
- **New This Year**: Users registered this year
- **With Referrals**: Users who have referred others

### Revenue Statistics
- **Total Deposits**: Sum of all approved deposits
- **Total Withdrawals**: Sum of all approved withdrawals
- **Total Investments**: Sum of all investment amounts
- **Total Investment Returns**: Sum of all investment earnings
- **Monthly Deposits**: Deposits this month
- **Monthly Withdrawals**: Withdrawals this month
- **Net Revenue**: Total deposits - Total withdrawals
- **Monthly Net Revenue**: Monthly deposits - Monthly withdrawals

### Transaction Statistics
- **Pending Deposits**: Number of pending deposit requests
- **Pending Withdrawals**: Number of pending withdrawal requests
- **Total Referral Bonus**: Sum of all referral bonuses paid

### Investment Statistics
- **Active Investments**: Currently running investments
- **Completed Investments**: Finished investments
- **Withdrawn Investments**: Investments that have been withdrawn

### Wallet Balances
- **Total Normal Balance**: Sum of all users' normal wallet balances
- **Total Investment Balance**: Sum of all users' investment wallet balances

---

## Chart Data Usage

### User Growth Chart
```javascript
// Example usage with Chart.js
const ctx = document.getElementById('userGrowthChart').getContext('2d');
new Chart(ctx, {
    type: 'line',
    data: {
        labels: response.data.growthData.map(item => item.date),
        datasets: [{
            label: 'New Users',
            data: response.data.growthData.map(item => item.count),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    }
});
```

### Revenue Chart
```javascript
// Example usage with Chart.js
const ctx = document.getElementById('revenueChart').getContext('2d');
new Chart(ctx, {
    type: 'bar',
    data: {
        labels: response.data.revenueData.map(item => item.date),
        datasets: [{
            label: 'Deposits',
            data: response.data.revenueData.map(item => item.deposits),
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgb(75, 192, 192)',
            borderWidth: 1
        }, {
            label: 'Withdrawals',
            data: response.data.revenueData.map(item => item.withdrawals),
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 1
        }]
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
    "growthRate": 15.5,
    "pendingAmount": 5000
}
```

### User Overview Widget
```json
{
    "totalUsers": 1250,
    "activeUsers": 1180,
    "newUsersToday": 15,
    "growthRate": 12.3
}
```

### Transaction Overview Widget
```json
{
    "pendingDeposits": 25,
    "pendingWithdrawals": 12,
    "totalTransactions": 1500,
    "successRate": 95.2
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

### Get Dashboard Statistics:
```bash
curl -X GET http://localhost:3000/admin-dashboard/statistics \
  -H "Authorization: Bearer <admin_token>"
```

### Get User Growth Data:
```bash
curl -X GET "http://localhost:3000/admin-dashboard/user-growth?period=90" \
  -H "Authorization: Bearer <admin_token>"
```

### Get Top Investment Users:
```bash
curl -X GET "http://localhost:3000/admin-dashboard/top-users?type=investment" \
  -H "Authorization: Bearer <admin_token>"
```

### Get Recent Users:
```bash
curl -X GET "http://localhost:3000/admin-dashboard/recent-users?page=1&limit=20" \
  -H "Authorization: Bearer <admin_token>"
```

---

## Dashboard Features

### Real-time Statistics
- Live user count and growth
- Real-time revenue tracking
- Pending transaction alerts
- Investment performance metrics

### Analytics & Insights
- User growth trends
- Revenue patterns
- Investment performance
- Referral system effectiveness

### Management Tools
- User overview and management
- Transaction monitoring
- Investment tracking
- System health monitoring

### Export Capabilities
- Export user data
- Export transaction reports
- Export revenue reports
- Export investment reports

---

## Notes

1. **Admin Only Access**: All endpoints require admin authentication
2. **Real-time Data**: Statistics are calculated in real-time
3. **Performance Optimized**: Uses MongoDB aggregation for efficient queries
4. **Scalable**: Designed to handle large datasets
5. **Secure**: All data is properly filtered and validated
6. **Chart Ready**: Data is formatted for easy chart integration
7. **Pagination**: Large datasets are properly paginated
8. **Error Handling**: Comprehensive error handling and logging 