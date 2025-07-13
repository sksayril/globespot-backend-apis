# User Activity API Documentation

## Overview
The user activity system provides comprehensive tracking of user activities including daily income, withdrawals, deposits, investments, and all transactions.

## Base URL
```
http://localhost:3000
```

## Authentication
All endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## User Activity APIs

### 1. Get User Activity
**GET** `/users/activity`
- **Description**: Get comprehensive user activity data including daily income, withdrawals, deposits, and all activities
- **Headers**: `Authorization: Bearer <user-token>`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 20)
  - `type` (optional): Filter by transaction type
- **Response**:
  ```json
  {
    "success": true,
    "message": "User activity data retrieved successfully",
    "data": {
      "user": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890",
        "referralCode": "USR123456",
        "role": "user",
        "isBlocked": false,
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      "dailyIncome": {
        "totalEarned": 1250,
        "todayEarned": 25,
        "lastClaimed": "2024-01-15T10:30:00.000Z",
        "canClaimToday": true
      },
      "wallets": {
        "normalWallet": {
          "balance": 500,
          "totalTransactions": 15,
          "totalDeposits": 2000,
          "totalWithdrawals": 500,
          "totalTransfers": 300,
          "totalReferralBonus": 200,
          "totalDailyIncome": 1250
        },
        "investmentWallet": {
          "balance": 1000,
          "totalTransactions": 8,
          "totalDeposits": 1500,
          "totalWithdrawals": 200,
          "totalTransfers": 300,
          "totalReferralBonus": 100,
          "totalCommission": 500
        }
      },
      "investments": {
        "stats": {
          "totalInvestments": 3,
          "activeInvestments": 2,
          "completedInvestments": 1,
          "totalInvested": 3000,
          "totalEarned": 750,
          "totalWithdrawn": 1500
        },
        "activeInvestments": [
          {
            "id": "investment_id",
            "planId": {
              "id": "plan_id",
              "title": "Gold Investment Plan",
              "description": "High-yield investment"
            },
            "investmentAmount": 1000,
            "totalEarned": 250,
            "isCompleted": false,
            "remainingDays": 15
          }
        ],
        "completedInvestments": [
          {
            "id": "investment_id",
            "planId": {
              "id": "plan_id",
              "title": "Silver Investment Plan"
            },
            "investmentAmount": 500,
            "totalEarned": 100,
            "isCompleted": true,
            "isWithdrawn": true
          }
        ]
      },
      "referrals": {
        "directReferrals": 5,
        "totalReferralBonus": 300,
        "referralCode": "USR123456",
        "referredBy": {
          "name": "Jane Smith",
          "email": "jane@example.com",
          "referralCode": "JAN789012"
        }
      },
      "deposits": {
        "data": [
          {
            "id": "deposit_id",
            "amount": 1000,
            "paymentMethod": "upi",
            "paymentId": "UPI123456",
            "walletType": "investment",
            "status": "approved",
            "createdAt": "2024-01-15T10:30:00.000Z"
          }
        ],
        "pagination": {
          "page": 1,
          "limit": 20,
          "total": 5,
          "pages": 1
        }
      },
      "transactions": {
        "data": [
          {
            "type": "deposit",
            "amount": 1000,
            "description": "Deposit to investment wallet",
            "date": "2024-01-15T10:30:00.000Z",
            "status": "approved",
            "walletType": "investmentWallet",
            "walletName": "Investment Wallet"
          }
        ],
        "pagination": {
          "page": 1,
          "limit": 20,
          "total": 23,
          "pages": 2
        }
      },
      "summary": {
        "totalBalance": 1500,
        "totalTransactions": 23,
        "totalDeposits": 5,
        "totalInvestments": 3,
        "totalDailyIncomeEarned": 1250,
        "totalReferralBonus": 300
      }
    }
  }
  ```

### 2. Get Transaction History
**GET** `/users/transactions`
- **Description**: Get detailed transaction history with filters
- **Headers**: `Authorization: Bearer <user-token>`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 20)
  - `type` (optional): Filter by transaction type
  - `walletType` (optional): Filter by wallet type ('normalWallet' or 'investmentWallet')
  - `status` (optional): Filter by status ('pending', 'approved', 'rejected')
- **Response**:
  ```json
  {
    "success": true,
    "message": "Transaction history retrieved successfully",
    "data": {
      "transactions": [
        {
          "type": "deposit",
          "amount": 1000,
          "description": "Deposit to investment wallet",
          "date": "2024-01-15T10:30:00.000Z",
          "status": "approved",
          "walletType": "investmentWallet",
          "walletName": "Investment Wallet"
        },
        {
          "type": "daily_income",
          "amount": 25,
          "description": "Daily income claim",
          "date": "2024-01-15T09:00:00.000Z",
          "status": "approved",
          "walletType": "normalWallet",
          "walletName": "Normal Wallet"
        },
        {
          "type": "transfer_to_user",
          "amount": -200,
          "description": "Transfer to Jane Smith (USR789012)",
          "date": "2024-01-15T08:30:00.000Z",
          "status": "approved",
          "walletType": "normalWallet",
          "walletName": "Normal Wallet"
        }
      ],
      "stats": {
        "total": 23,
        "byType": {
          "deposit": 5,
          "withdrawal": 3,
          "transfer": 2,
          "transfer_to_user": 4,
          "transfer_from_user": 1,
          "referral_bonus": 3,
          "daily_income": 4,
          "commission": 1
        },
        "byStatus": {
          "pending": 2,
          "approved": 20,
          "rejected": 1
        },
        "totalAmount": {
          "deposits": 5000,
          "withdrawals": 1500,
          "transfers": 800,
          "bonuses": 300,
          "dailyIncome": 1250
        }
      },
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 23,
        "pages": 2,
        "hasNextPage": true,
        "hasPrevPage": false
      }
    }
  }
  ```

---

## Activity System Features

### Daily Income Tracking
- **Total earned**: Total daily income earned so far
- **Today earned**: Today's daily income amount
- **Last claimed**: Last time daily income was claimed
- **Can claim today**: Whether user can claim daily income today

### Wallet Statistics
- **Balance**: Current wallet balance
- **Total transactions**: Number of transactions in wallet
- **Total deposits**: Sum of all deposits
- **Total withdrawals**: Sum of all withdrawals
- **Total transfers**: Sum of all transfers
- **Total referral bonus**: Sum of all referral bonuses
- **Total daily income**: Sum of all daily income claims

### Investment Tracking
- **Total investments**: Number of investments made
- **Active investments**: Number of ongoing investments
- **Completed investments**: Number of completed investments
- **Total invested**: Total amount invested
- **Total earned**: Total earnings from investments
- **Total withdrawn**: Total amount withdrawn from investments

### Referral Statistics
- **Direct referrals**: Number of direct referrals
- **Total referral bonus**: Total bonus earned from referrals
- **Referral code**: User's referral code
- **Referred by**: Information about who referred the user

### Transaction Types
- **deposit**: Money added to wallet
- **withdrawal**: Money removed from wallet
- **transfer**: Internal wallet transfers
- **transfer_to_user**: Transfers sent to other users
- **transfer_from_user**: Transfers received from other users
- **referral_bonus**: Bonus from referrals
- **daily_income**: Daily income earnings
- **commission**: Commission earnings

### Transaction Status
- **pending**: Transaction is pending approval
- **approved**: Transaction has been approved
- **rejected**: Transaction has been rejected

### Filtering Options
- **By type**: Filter transactions by type
- **By wallet**: Filter by wallet type
- **By status**: Filter by transaction status
- **Pagination**: Page through results

### Activity Summary
- **Total balance**: Combined balance of both wallets
- **Total transactions**: Total number of transactions
- **Total deposits**: Total number of deposits
- **Total investments**: Total number of investments
- **Total daily income earned**: Total daily income earned
- **Total referral bonus**: Total referral bonus earned

### Security Features
- **Authentication required**: All endpoints require valid JWT token
- **User-specific data**: Users can only access their own activity data
- **Data validation**: All input parameters are validated
- **Error handling**: Comprehensive error messages

### Technical Implementation
- **Real-time data**: All data is fetched in real-time
- **Efficient queries**: Optimized database queries for performance
- **Pagination**: Efficient pagination for large datasets
- **Filtering**: Flexible filtering options
- **Statistics calculation**: Real-time calculation of statistics 