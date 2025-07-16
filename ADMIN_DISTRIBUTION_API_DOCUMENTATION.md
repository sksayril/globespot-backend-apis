# Admin Distribution API Documentation

## Overview

The Admin Distribution API provides comprehensive insights into the distribution of income across all users in the MLM platform. It calculates total distribution, daily, monthly, and weekly income based on user level income and daily income systems.

## Base URL
```
http://localhost:3100/admin-distribution
```

## Authentication
All endpoints require admin authentication using JWT token in the Authorization header:
```
Authorization: Bearer <admin-token>
```

---

## Endpoints

### 1. Get Total Distribution Overview
**GET** `/admin-distribution/overview`

**Description**: Get comprehensive distribution overview for all users with detailed breakdowns.

**Query Parameters**:
- `startDate` (optional): Start date for filtering (YYYY-MM-DD format)
- `endDate` (optional): End date for filtering (YYYY-MM-DD format)

**Response**:
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "totalDailyIncome": 7500.50,
    "totalLevelIncome": 12500.75,
    "totalCharacterLevelIncome": 8000.25,
    "totalDigitLevelIncome": 4500.50,
    "totalNormalWalletBalance": 1500000.00,
    "totalInvestmentWalletBalance": 750000.00,
    "totalReferralBonus": 25000.00,
    "totalDeposits": 500000.00,
    "totalWithdrawals": 100000.00,
    "dailyDistribution": 7500.50,
    "weeklyDistribution": 52500.00,
    "monthlyDistribution": 225000.00,
    "userBreakdown": [
      {
        "userId": "user_id",
        "name": "User Name",
        "email": "user@example.com",
        "phone": "1234567890",
        "referralCode": "REF123456",
        "referredBy": {
          "id": "parent_user_id",
          "name": "Parent User",
          "email": "parent@example.com"
        },
        "normalWalletBalance": 10000.00,
        "investmentWalletBalance": 5000.00,
        "dailyIncome": 5.00,
        "characterLevelIncome": 25.50,
        "digitLevelIncome": 15.75,
        "totalLevelIncome": 41.25,
        "totalIncome": 46.25,
        "referralBonus": 100.00,
        "deposits": 1000.00,
        "withdrawals": 200.00,
        "characterLevel": "A",
        "digitLevel": "Lvl2",
        "joinedDate": "2024-01-01T00:00:00.000Z",
        "lastActive": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

### 2. Get Daily Distribution Statistics
**GET** `/admin-distribution/daily`

**Description**: Get detailed daily distribution statistics for a specific date.

**Query Parameters**:
- `date` (optional): Target date (YYYY-MM-DD format, defaults to today)

**Response**:
```json
{
  "success": true,
  "data": {
    "date": "2024-01-15T00:00:00.000Z",
    "totalUsers": 150,
    "activeUsers": 120,
    "totalDailyIncome": 7500.50,
    "totalLevelIncome": 12500.75,
    "totalCharacterLevelIncome": 8000.25,
    "totalDigitLevelIncome": 4500.50,
    "averageIncomePerUser": 50.00,
    "topEarners": [
      {
        "userId": "user_id",
        "name": "Top Earner",
        "email": "top@example.com",
        "totalIncome": 500.00,
        "dailyIncome": 25.00,
        "characterLevelIncome": 300.00,
        "digitLevelIncome": 175.00,
        "characterLevel": "A",
        "digitLevel": "Lvl5"
      }
    ],
    "levelBreakdown": {
      "characterLevels": {
        "A": {
          "count": 20,
          "totalIncome": 4000.00
        },
        "B": {
          "count": 30,
          "totalIncome": 3000.00
        }
      },
      "digitLevels": {
        "Lvl1": {
          "count": 50,
          "totalIncome": 2000.00
        },
        "Lvl2": {
          "count": 30,
          "totalIncome": 1500.00
        }
      }
    }
  }
}
```

### 3. Get Weekly Distribution Statistics
**GET** `/admin-distribution/weekly`

**Description**: Get weekly distribution statistics with daily breakdown.

**Query Parameters**:
- `startDate` (optional): Week start date (YYYY-MM-DD format)
- `endDate` (optional): Week end date (YYYY-MM-DD format)

**Response**:
```json
{
  "success": true,
  "data": {
    "startDate": "2024-01-08T00:00:00.000Z",
    "endDate": "2024-01-15T00:00:00.000Z",
    "totalUsers": 150,
    "newUsers": 15,
    "totalDailyIncome": 52500.00,
    "totalLevelIncome": 87500.00,
    "totalCharacterLevelIncome": 56000.00,
    "totalDigitLevelIncome": 31500.00,
    "averageIncomePerUser": 350.00,
    "dailyBreakdown": [
      {
        "date": "2024-01-08T00:00:00.000Z",
        "dailyIncome": 7500.00,
        "levelIncome": 12500.00,
        "totalIncome": 20000.00
      },
      {
        "date": "2024-01-09T00:00:00.000Z",
        "dailyIncome": 7600.00,
        "levelIncome": 12600.00,
        "totalIncome": 20200.00
      }
    ],
    "topEarners": [
      {
        "userId": "user_id",
        "name": "Top Earner",
        "email": "top@example.com",
        "totalIncome": 3500.00,
        "dailyIncome": 175.00,
        "characterLevelIncome": 2100.00,
        "digitLevelIncome": 1225.00
      }
    ]
  }
}
```

### 4. Get Monthly Distribution Statistics
**GET** `/admin-distribution/monthly`

**Description**: Get monthly distribution statistics with weekly breakdown.

**Query Parameters**:
- `year` (optional): Year (defaults to current year)
- `month` (optional): Month (1-12, defaults to current month)

**Response**:
```json
{
  "success": true,
  "data": {
    "year": 2024,
    "month": 1,
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-02-01T00:00:00.000Z",
    "totalUsers": 150,
    "newUsers": 45,
    "totalDailyIncome": 225000.00,
    "totalLevelIncome": 375000.00,
    "totalCharacterLevelIncome": 240000.00,
    "totalDigitLevelIncome": 135000.00,
    "averageIncomePerUser": 1500.00,
    "weeklyBreakdown": [
      {
        "weekStart": "2024-01-01T00:00:00.000Z",
        "weekEnd": "2024-01-08T00:00:00.000Z",
        "dailyIncome": 52500.00,
        "levelIncome": 87500.00,
        "totalIncome": 140000.00,
        "newUsers": 12
      },
      {
        "weekStart": "2024-01-08T00:00:00.000Z",
        "weekEnd": "2024-01-15T00:00:00.000Z",
        "dailyIncome": 56000.00,
        "levelIncome": 90000.00,
        "totalIncome": 146000.00,
        "newUsers": 15
      }
    ],
    "topEarners": [
      {
        "userId": "user_id",
        "name": "Top Earner",
        "email": "top@example.com",
        "totalIncome": 15000.00,
        "dailyIncome": 750.00,
        "characterLevelIncome": 9000.00,
        "digitLevelIncome": 5250.00
      }
    ]
  }
}
```

### 5. Get User Distribution Details
**GET** `/admin-distribution/user/:userId`

**Description**: Get detailed distribution information for a specific user.

**Path Parameters**:
- `userId`: User ID

**Query Parameters**:
- `startDate` (optional): Start date for transaction filtering (YYYY-MM-DD format)
- `endDate` (optional): End date for transaction filtering (YYYY-MM-DD format)

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "phone": "1234567890",
      "referralCode": "REF123456",
      "referredBy": {
        "id": "parent_user_id",
        "name": "Parent User",
        "email": "parent@example.com"
      },
      "joinedDate": "2024-01-01T00:00:00.000Z",
      "lastActive": "2024-01-15T10:30:00.000Z"
    },
    "wallets": {
      "normalWallet": {
        "balance": 10000.00,
        "transactions": [
          {
            "type": "daily_income",
            "amount": 5.00,
            "description": "Daily income credit",
            "date": "2024-01-15T10:30:00.000Z",
            "status": "approved"
          }
        ]
      },
      "investmentWallet": {
        "balance": 5000.00,
        "transactions": [
          {
            "type": "deposit",
            "amount": 1000.00,
            "description": "Investment deposit",
            "date": "2024-01-10T10:30:00.000Z",
            "status": "approved"
          }
        ]
      }
    },
    "income": {
      "dailyIncome": 5.00,
      "characterLevelIncome": 25.50,
      "digitLevelIncome": 15.75,
      "totalLevelIncome": 41.25,
      "totalIncome": 46.25
    },
    "levels": {
      "characterLevel": "A",
      "digitLevel": "Lvl2",
      "characterLevelEarned": 150.25,
      "digitLevelEarned": 75.50
    },
    "statistics": {
      "totalDeposits": 1000.00,
      "totalWithdrawals": 200.00,
      "totalReferralBonus": 100.00,
      "totalDailyIncomeEarned": 75.00
    }
  }
}
```

### 6. Get Top Earners Distribution
**GET** `/admin-distribution/top-earners`

**Description**: Get list of top earning users with detailed breakdown.

**Query Parameters**:
- `limit` (optional): Number of top earners to return (default: 20)
- `period` (optional): Time period filter (default: 'all')

**Response**:
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "topEarners": [
      {
        "userId": "user_id",
        "name": "Top Earner",
        "email": "top@example.com",
        "phone": "1234567890",
        "referralCode": "REF123456",
        "normalWalletBalance": 50000.00,
        "investmentWalletBalance": 25000.00,
        "dailyIncome": 25.00,
        "characterLevelIncome": 150.00,
        "digitLevelIncome": 87.50,
        "totalIncome": 262.50,
        "characterLevel": "A",
        "digitLevel": "Lvl5",
        "joinedDate": "2024-01-01T00:00:00.000Z",
        "lastActive": "2024-01-15T10:30:00.000Z"
      }
    ],
    "summary": {
      "totalIncome": 5000.00,
      "averageIncome": 250.00,
      "highestIncome": 500.00,
      "lowestIncome": 100.00
    }
  }
}
```

---

## Income Calculation Logic

### Daily Income
- **Formula**: 0.05% of user's normal wallet balance
- **Frequency**: Daily
- **Example**: ₹10,000 balance → ₹5.00 daily income

### Character Level Income
- **Formula**: Percentage of parent's normal wallet balance
- **Levels**:
  - Level A: 10% of parent's balance
  - Level B: 5% of parent's balance
  - Level C: 2.5% of parent's balance
  - Level D: 1.25% of parent's balance
  - Level E: 0.75% of parent's balance

### Digit Level Income
- **Formula**: Percentage of user's own normal wallet balance
- **Levels**:
  - Lvl1: 0.35% of own balance
  - Lvl2: 0.70% of own balance
  - Lvl3: 1.40% of own balance
  - Lvl4: 2.50% of own balance
  - Lvl5: 4.00% of own balance

---

## Features

### ✅ Distribution Analytics
- **Total Distribution Overview**: Complete breakdown of all income sources
- **Daily Statistics**: Daily income distribution with user activity tracking
- **Weekly Analysis**: Weekly trends with daily breakdown
- **Monthly Reports**: Monthly statistics with weekly breakdown
- **User Details**: Individual user distribution analysis
- **Top Earners**: Ranking of highest earning users

### ✅ Income Tracking
- **Daily Income**: 0.05% of normal wallet balance
- **Character Level Income**: Based on parent wallet and level
- **Digit Level Income**: Based on own wallet and level
- **Referral Bonus**: From referral transactions
- **Deposits/Withdrawals**: Transaction tracking

### ✅ Time-based Analysis
- **Date Filtering**: Filter by specific date ranges
- **Period Analysis**: Daily, weekly, monthly breakdowns
- **Trend Tracking**: Income trends over time
- **Growth Metrics**: New user and income growth

### ✅ User Analytics
- **Level Distribution**: Breakdown by character and digit levels
- **Wallet Analysis**: Normal and investment wallet balances
- **Transaction History**: Complete transaction tracking
- **Performance Metrics**: Individual user performance

### ✅ Admin Features
- **Comprehensive Overview**: Total system distribution
- **Detailed Breakdowns**: Income by source and level
- **User Rankings**: Top earners and performance metrics
- **Statistical Analysis**: Averages, totals, and trends
- **Export Ready**: Structured data for reporting

---

## Error Responses

### Authentication Error
```json
{
  "success": false,
  "message": "Access denied. Admin authentication required."
}
```

### User Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

### Server Error
```json
{
  "success": false,
  "message": "Error getting distribution data",
  "error": "Error details"
}
```

---

## Usage Examples

### Get Total Distribution for Current Month
```bash
curl -X GET "http://localhost:3100/admin-distribution/overview?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <admin-token>"
```

### Get Daily Distribution for Specific Date
```bash
curl -X GET "http://localhost:3100/admin-distribution/daily?date=2024-01-15" \
  -H "Authorization: Bearer <admin-token>"
```

### Get Weekly Distribution
```bash
curl -X GET "http://localhost:3100/admin-distribution/weekly?startDate=2024-01-08&endDate=2024-01-15" \
  -H "Authorization: Bearer <admin-token>"
```

### Get Monthly Distribution
```bash
curl -X GET "http://localhost:3100/admin-distribution/monthly?year=2024&month=1" \
  -H "Authorization: Bearer <admin-token>"
```

### Get User Distribution Details
```bash
curl -X GET "http://localhost:3100/admin-distribution/user/user_id" \
  -H "Authorization: Bearer <admin-token>"
```

### Get Top 10 Earners
```bash
curl -X GET "http://localhost:3100/admin-distribution/top-earners?limit=10" \
  -H "Authorization: Bearer <admin-token>"
```

---

## Integration Notes

### Database Requirements
- User model with wallet and transaction data
- Level model with character and digit level information
- Transaction history for all wallet operations

### Performance Considerations
- Large datasets may require pagination
- Date filtering helps reduce data load
- Indexes on user and transaction dates recommended

### Security Considerations
- Admin-only access required
- JWT token validation
- Input validation for date parameters
- Error handling for invalid user IDs

### Data Accuracy
- Real-time calculations based on current wallet balances
- Historical data from transaction records
- Level calculations from current user levels
- Daily income based on current wallet balance

---

## API Integration

The Admin Distribution API integrates with existing systems:

1. **User Management**: Uses existing user and level models
2. **Authentication**: Leverages existing admin authentication
3. **Transaction Tracking**: Utilizes existing wallet transaction systems
4. **Level System**: Integrates with character and digit level calculations
5. **Daily Income**: Works with existing daily income system

This comprehensive distribution API provides admins with complete visibility into the MLM platform's income distribution, enabling data-driven decisions and performance monitoring. 