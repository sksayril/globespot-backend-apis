# MLM System API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Investment System Overview
The investment system allows admins to create investment plans and users to purchase them. Features include:
- **Investment Plans**: Created by admins with image, title, description, investment amount, daily percentage, duration, and total return percentage
- **User Investments**: Users can purchase plans and track daily earnings
- **Automatic Daily Earnings**: System calculates and adds daily earnings based on investment amount and percentage
- **Withdrawal System**: Users can withdraw completed investments to their normal wallet
- **Progress Tracking**: Real-time tracking of investment progress, remaining days, and total earnings

---

## Admin APIs

### 1. Admin Signup
**POST** `/admin/signup`
- **Description**: Create the first admin account (only one admin allowed)
- **Body**:
  ```json
  {
    "name": "Admin Name",
    "email": "admin@example.com",
    "phone": "1234567890",
    "password": "adminpassword"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Admin created successfully",
    "data": {
      "admin": {
        "id": "user_id",
        "name": "Admin Name",
        "email": "admin@example.com",
        "phone": "1234567890",
        "role": "admin"
      },
      "token": "jwt_token"
    }
  }
  ```

### 2. Admin Login
**POST** `/admin/login`
- **Description**: Admin login
- **Body**:
  ```json
  {
    "email": "admin@example.com",
    "password": "adminpassword"
  }
  ```
- **Response**: Same as signup response

### 3. Get All Users
**GET** `/admin/users`
- **Description**: Get all users (requires admin authentication)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "user_id",
        "name": "User Name",
        "email": "user@example.com",
        "phone": "1234567890",
        "referralCode": "USR123456",
        "isBlocked": false,
        "investmentWallet": { "balance": 1000 },
        "normalWallet": { "balance": 500 },
        "referredBy": { "name": "Referrer Name", "email": "referrer@example.com" }
      }
    ]
  }
  ```

### 4. Get User Details with Original Password
**GET** `/admin/users/:userId`
- **Description**: Get user details including original password (requires admin authentication)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "originalPassword": "userpassword123",
      "investmentWallet": { "balance": 1000 },
      "normalWallet": { "balance": 500 }
    }
  }
  ```

### 5. Block/Unblock User
**POST** `/admin/users/:userId/block`
- **Description**: Block or unblock a user (requires admin authentication)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Body**:
  ```json
  {
    "isBlocked": true
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "User blocked successfully",
    "data": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "isBlocked": true
    }
  }
  ```

### 6. Get All Deposit Requests
**GET** `/admin/deposits`
- **Description**: Get all deposit requests (requires admin authentication)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "deposit_id",
        "amount": 1000,
        "paymentMethod": "upi",
        "paymentId": "UPI123456",
        "walletType": "investment",
        "status": "pending",
        "user": { "name": "User Name", "email": "user@example.com" },
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
  ```

### 7. Approve/Reject Deposit Request
**POST** `/admin/deposits/:depositId/approve`
- **Description**: Approve or reject a deposit request (requires admin authentication)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Body**:
  ```json
  {
    "status": "approved",
    "adminNotes": "Payment verified successfully"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Deposit request approved successfully",
    "data": {
      "id": "deposit_id",
      "status": "approved",
      "approvedBy": "admin_id",
      "approvedAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

### 8. Get System Statistics
**GET** `/admin/statistics`
- **Description**: Get system statistics (requires admin authentication)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "users": {
        "total": 100,
        "active": 95,
        "blocked": 5
      },
      "deposits": {
        "total": 50,
        "pending": 10,
        "approved": 40,
        "totalAmount": 50000
      },
      "wallets": {
        "totalInvestment": 30000,
        "totalNormal": 20000
      }
    }
  }
  ```

### 9. Get Level Statistics
**GET** `/levels/statistics`
- **Description**: Get level system statistics (requires admin authentication)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "totalUsers": 100,
      "characterLevels": {
        "A": 20,
        "B": 15,
        "C": 10,
        "D": 5,
        "E": 3,
        "null": 47
      },
      "digitLevels": {
        "Lvl1": 25,
        "Lvl2": 15,
        "Lvl3": 8,
        "Lvl4": 3,
        "Lvl5": 1,
        "null": 48
      },
      "totalEarnings": {
        "characterLevel": 15000.50,
        "digitLevel": 8500.75
      }
    }
  }
  ```

---

## User APIs

### 1. User Signup with Referral Code
**POST** `/users/signup`
- **Description**: Register a new user with optional referral code
- **Body**:
  ```json
  {
    "name": "User Name",
    "email": "user@example.com",
    "phone": "1234567890",
    "password": "userpassword",
    "referralCode": "USR123456"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": {
        "id": "user_id",
        "name": "User Name",
        "email": "user@example.com",
        "phone": "1234567890",
        "referralCode": "USR789012",
        "referredBy": "referrer_id"
      },
      "token": "jwt_token"
    }
  }
  ```

### 2. User Login
**POST** `/users/login`
- **Description**: User login
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "userpassword"
  }
  ```
- **Response**: Same as signup response

### 3. Get User Profile
**GET** `/users/profile`
- **Description**: Get user profile (requires authentication)
- **Headers**: `Authorization: Bearer <user-token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "phone": "1234567890",
      "referralCode": "USR789012",
      "investmentWallet": { "balance": 1000 },
      "normalWallet": { "balance": 500 },
      "referredBy": { "name": "Referrer Name", "email": "referrer@example.com" }
    }
  }
  ```

### 4. Update User Profile
**POST** `/users/profile`
- **Description**: Update user profile (requires authentication)
- **Headers**: `Authorization: Bearer <user-token>`
- **Body**:
  ```json
  {
    "name": "Updated Name",
    "phone": "9876543210",
    "address": {
      "street": "123 Main St",
      "city": "City",
      "state": "State",
      "country": "Country",
      "zipCode": "12345"
    }
  }
  ```

### 5. Get Wallet Balances
**GET** `/users/wallets`
- **Description**: Get wallet balances and transactions (requires authentication)
- **Headers**: `Authorization: Bearer <user-token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "investmentWallet": {
        "balance": 1000,
        "transactions": [
          {
            "type": "deposit",
            "amount": 1000,
            "description": "Deposit approved - upi",
            "date": "2024-01-01T00:00:00.000Z",
            "status": "approved"
          }
        ]
      },
      "normalWallet": {
        "balance": 500,
        "transactions": [
          {
            "type": "transfer",
            "amount": 500,
            "description": "Transfer from investment wallet",
            "date": "2024-01-01T00:00:00.000Z",
            "status": "approved"
          }
        ]
      }
    }
  }
  ```

### 6. Create Deposit Request
**POST** `/users/deposits`
- **Description**: Create a deposit request with payment proof (requires authentication)
- **Headers**: `Authorization: Bearer <user-token>`
- **Content-Type**: `multipart/form-data`
- **Body**:
  ```
  amount: 1000
  paymentMethod: upi
  paymentId: UPI123456
  walletType: investment
  paymentProof: [image file]
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Deposit request created successfully",
    "data": {
      "id": "deposit_id",
      "amount": 1000,
      "paymentMethod": "upi",
      "walletType": "investment",
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

#### Deposit to Normal Wallet
To deposit to the normal wallet, set `walletType` to `"normal"`:

**Example Request Body for Normal Wallet:**
```
amount: 500
paymentMethod: bank_transfer
paymentId: BANK123456
walletType: normal
paymentProof: [image file]
```

**Example Response:**
```json
{
  "success": true,
  "message": "Deposit request created successfully",
  "data": {
    "id": "deposit_id",
    "amount": 500,
    "paymentMethod": "bank_transfer",
    "walletType": "normal",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Supported Payment Methods
- `bank_transfer` - Bank transfer
- `upi` - UPI payment
- `paytm` - Paytm
- `phonepe` - PhonePe
- `other` - Other payment methods

#### Wallet Types
- `investment` - Investment wallet (eligible for referral bonuses)
- `normal` - Normal wallet (regular transactions)

#### Important Notes for Normal Wallet Deposits:
1. **No Referral Bonus**: Deposits to normal wallet do not trigger referral bonuses
2. **Admin Approval Required**: All deposits require admin approval
3. **Payment Proof Required**: Must upload screenshot/receipt of payment
4. **Amount Validation**: Minimum amount validation applies
5. **Status Tracking**: Check deposit status via `/users/deposits` endpoint

### 7. Get User's Deposit Requests
**GET** `/users/deposits`
- **Description**: Get user's deposit requests (requires authentication)
- **Headers**: `Authorization: Bearer <user-token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "deposit_id",
        "amount": 1000,
        "paymentMethod": "upi",
        "paymentId": "UPI123456",
        "walletType": "investment",
        "status": "pending",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
  ```

### 8. Get Referral Information
**GET** `/users/referrals`
- **Description**: Get referral information (requires authentication)
- **Headers**: `Authorization: Bearer <user-token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "referralCode": "USR789012",
      "referredUsers": [
        {
          "name": "Referred User",
          "email": "referred@example.com",
          "phone": "1234567890",
          "createdAt": "2024-01-01T00:00:00.000Z"
        }
      ],
      "referrer": {
        "name": "Referrer Name",
        "email": "referrer@example.com",
        "referralCode": "USR123456"
      },
      "totalReferrals": 1
    }
  }
  ```

### 9. Transfer Between Wallets
**POST** `/users/transfer`
- **Description**: Transfer money between wallets (requires authentication)
- **Headers**: `Authorization: Bearer <user-token>`
- **Body**:
  ```json
  {
    "fromWallet": "investment",
    "toWallet": "normal",
    "amount": 500
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Transfer completed successfully",
    "data": {
      "fromWallet": "investment",
      "toWallet": "normal",
      "amount": 500,
      "newBalances": {
        "investment": 500,
        "normal": 1000
      }
    }
  }
  ```

### 10. Claim Today's Daily Income
**POST** `/users/today-my-income`
- **Description**: Claim daily income (0.05% of normal wallet balance) - once per day (requires authentication)
- **Headers**: `Authorization: Bearer <user-token>`
- **Body**: No body required
- **Response**:
  ```json
  {
    "success": true,
    "message": "Daily income claimed successfully",
    "data": {
      "myDailyIncome": 5.25,
      "normalWalletBalance": 105.25,
      "totalEarned": 15.75,
      "lastClaimed": "2024-01-15T10:30:00.000Z"
    }
  }
  ```
- **Error Response (Already Claimed Today)**:
  ```json
  {
    "success": false,
    "message": "Daily income already claimed today. Please try again tomorrow.",
    "data": {
      "myDailyIncome": 5.25,
      "lastClaimed": "2024-01-15T10:30:00.000Z"
    }
  }
  ```
- **Error Response (No Balance)**:
  ```json
  {
    "success": false,
    "message": "No balance available for daily income calculation.",
    "data": {
      "myDailyIncome": 0,
      "normalWalletBalance": 0
    }
  }
  ```

### 11. Get Daily Income Status
**GET** `/users/today-my-income`
- **Description**: Check daily income status and potential earnings (requires authentication)
- **Headers**: `Authorization: Bearer <user-token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "canClaim": true,
      "message": "You can claim your daily income",
      "myDailyIncome": 5.25,
      "potentialDailyIncome": 5.25,
      "normalWalletBalance": 10500,
      "totalEarned": 15.75,
      "lastClaimed": "2024-01-14T10:30:00.000Z"
    }
  }
  ```
- **Response (Already Claimed Today)**:
  ```json
  {
    "success": true,
    "data": {
      "canClaim": false,
      "message": "Daily income already claimed today",
      "myDailyIncome": 5.25,
      "potentialDailyIncome": 5.25,
      "normalWalletBalance": 10500,
      "totalEarned": 15.75,
      "lastClaimed": "2024-01-15T10:30:00.000Z"
    }
  }
  ```

---

## Level System APIs

### Level System Overview

The MLM system now includes a comprehensive level system with two types of levels:

#### **Character Level System (A, B, C, D, E):**
- **Level A**: 10% of parent's normal wallet balance (daily)
- **Level B**: 5% of parent's normal wallet balance (daily)  
- **Level C**: 2.5% of parent's normal wallet balance (daily)
- **Level D**: 1.25% of parent's normal wallet balance (daily)
- **Level E**: 0.75% of parent's normal wallet balance (daily)

#### **Digit Level System (Lvl1, Lvl2, Lvl3, Lvl4, Lvl5):**
- **Lvl1**: Direct 5+ members, each with 50+ rs, parent wallet 200+ rs
- **Lvl2**: Direct 10+ members, each with 50+ rs, parent wallet 500+ rs
- **Lvl3**: Direct 40+ members, each with 50+ rs, parent wallet 1100+ rs
- **Lvl4**: Direct 40+ members, each with 50+ rs, parent wallet 2500+ rs
- **Lvl5**: Direct 80+ members, each with 50+ rs, parent wallet 10000+ rs

#### **Digit Level Daily Benefits:**
- **Lvl1**: 0.35% of normal wallet balance (daily)
- **Lvl2**: 0.70% of normal wallet balance (daily)
- **Lvl3**: 1.40% of normal wallet balance (daily)
- **Lvl4**: 2.50% of normal wallet balance (daily)
- **Lvl5**: 4.00% of normal wallet balance (daily)

### 12. Get User's Level Status
**GET** `/levels/status`
- **Description**: Get user's current level status and potential earnings (requires authentication)
- **Headers**: `Authorization: Bearer <user-token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "characterLevel": {
        "current": "A",
        "percentages": {
          "A": 10.0,
          "B": 5.0,
          "C": 2.5,
          "D": 1.25,
          "E": 0.75
        },
        "lastCalculated": "2024-01-15T10:30:00.000Z",
        "totalEarned": 150.25
      },
      "digitLevel": {
        "current": "Lvl2",
        "criteria": {
          "Lvl1": { "directMembers": 5, "memberWalletMin": 50, "selfWalletMin": 200 },
          "Lvl2": { "directMembers": 10, "memberWalletMin": 50, "selfWalletMin": 500 },
          "Lvl3": { "directMembers": 40, "memberWalletMin": 50, "selfWalletMin": 1100 },
          "Lvl4": { "directMembers": 40, "memberWalletMin": 50, "selfWalletMin": 2500 },
          "Lvl5": { "directMembers": 80, "memberWalletMin": 50, "selfWalletMin": 10000 }
        },
        "percentages": {
          "Lvl1": 0.35,
          "Lvl2": 0.70,
          "Lvl3": 1.40,
          "Lvl4": 2.50,
          "Lvl5": 4.00
        },
        "lastCalculated": "2024-01-15T10:30:00.000Z",
        "totalEarned": 75.50,
        "directMembers": [
          {
            "memberId": "user_id",
            "joinedAt": "2024-01-01T00:00:00.000Z",
            "walletBalance": 100
          }
        ]
      },
      "potentialIncome": {
        "character": 25.50,
        "digit": 15.75,
        "total": 41.25
      },
      "dailyIncome": {
        "characterLevel": 25.50,
        "digitLevel": 15.75,
        "lastClaimed": "2024-01-14T10:30:00.000Z"
      },
      "canClaim": true
    }
  }
  ```

### 13. Claim Daily Income from Levels
**POST** `/levels/claim-daily-income`
- **Description**: Claim daily income from both character and digit levels (requires authentication)
- **Headers**: `Authorization: Bearer <user-token>`
- **Body**: No body required
- **Response**:
  ```json
  {
    "success": true,
    "message": "Daily income claimed successfully",
    "data": {
      "characterIncome": 25.50,
      "digitIncome": 15.75,
      "totalIncome": 41.25,
      "newBalance": 541.25
    }
  }
  ```
- **Error Response (Already Claimed Today)**:
  ```json
  {
    "success": false,
    "message": "Daily income already claimed today",
    "data": {
      "characterIncome": 0,
      "digitIncome": 0,
      "totalIncome": 0
    }
  }
  ```
- **Error Response (No Income Available)**:
  ```json
  {
    "success": false,
    "message": "No income available to claim",
    "data": {
      "characterIncome": 0,
      "digitIncome": 0,
      "totalIncome": 0
    }
  }
  ```

### 14. Get Daily Income Status
**GET** `/levels/daily-income-status`
- **Description**: Check daily income status without claiming (requires authentication)
- **Headers**: `Authorization: Bearer <user-token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "canClaim": true,
      "characterIncome": 25.50,
      "digitIncome": 15.75,
      "totalIncome": 41.25,
      "lastClaimed": "2024-01-14T10:30:00.000Z",
      "message": "You can claim your daily income"
    }
  }
  ```
- **Response (Already Claimed Today)**:
  ```json
  {
    "success": true,
    "data": {
      "canClaim": false,
      "characterIncome": 25.50,
      "digitIncome": 15.75,
      "totalIncome": 41.25,
      "lastClaimed": "2024-01-15T10:30:00.000Z",
      "message": "Daily income already claimed today"
    }
  }
  ```

### 15. Get Referral Network Details
**GET** `/levels/referral-network`
- **Description**: Get detailed referral network information for level calculations (requires authentication)
- **Headers**: `Authorization: Bearer <user-token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "characterLevel": {
        "current": "A",
        "totalEarned": 150.25
      },
      "digitLevel": {
        "current": "Lvl2",
        "totalEarned": 75.50,
        "directMembers": [
          {
            "memberId": "user_id",
            "joinedAt": "2024-01-01T00:00:00.000Z",
            "walletBalance": 100
          }
        ]
      },
      "directReferrals": [
        {
          "id": "user_id",
          "name": "Referred User",
          "email": "referred@example.com",
          "phone": "1234567890",
          "walletBalance": 100,
          "joinedAt": "2024-01-01T00:00:00.000Z"
        }
      ],
      "referralChain": [
        {
          "id": "referrer_id",
          "name": "Referrer Name",
          "email": "referrer@example.com",
          "phone": "1234567890",
          "walletBalance": 500,
          "joinedAt": "2024-01-01T00:00:00.000Z"
        }
      ],
      "digitLevelCriteria": {
        "Lvl1": { "directMembers": 5, "memberWalletMin": 50, "selfWalletMin": 200 },
        "Lvl2": { "directMembers": 10, "memberWalletMin": 50, "selfWalletMin": 500 },
        "Lvl3": { "directMembers": 40, "memberWalletMin": 50, "selfWalletMin": 1100 },
        "Lvl4": { "directMembers": 40, "memberWalletMin": 50, "selfWalletMin": 2500 },
        "Lvl5": { "directMembers": 80, "memberWalletMin": 50, "selfWalletMin": 10000 }
      },
      "validMembers": 8
    }
  }
  ```

### 16. Force Recalculate Levels
**POST** `/levels/recalculate`
- **Description**: Force recalculation of user's levels (for testing/debugging) (requires authentication)
- **Headers**: `Authorization: Bearer <user-token>`
- **Body**: No body required
- **Response**:
  ```json
  {
    "success": true,
    "message": "Levels recalculated successfully",
    "data": {
      "characterLevel": {
        "current": "A",
        "lastCalculated": "2024-01-15T10:30:00.000Z"
      },
      "digitLevel": {
        "current": "Lvl2",
        "lastCalculated": "2024-01-15T10:30:00.000Z"
      }
    }
  }
  ```

---

## Daily Income System

### How Daily Income Works

The daily income system allows users to earn 0.05% of their normal wallet balance every day.

#### Key Features:
- **Calculation**: 0.05% of current normal wallet balance
- **Frequency**: Once per day (resets at midnight)
- **Wallet**: Credits to normal wallet
- **Tracking**: Full transaction history and earnings tracking

#### Example Calculations:
- Normal Wallet Balance: ₹10,000 → Daily Income: ₹5.00
- Normal Wallet Balance: ₹50,000 → Daily Income: ₹25.00
- Normal Wallet Balance: ₹1,00,000 → Daily Income: ₹50.00

#### Daily Income Transaction Types:
- **Type**: `daily_income`
- **Status**: `approved` (automatic)
- **Description**: "Daily income credit (0.05% of normal wallet balance)"

#### User Profile Enhancement:
The `/users/profile` endpoint now includes:
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "normalWallet": { "balance": 10000 },
    "dailyIncome": {
      "lastClaimed": "2024-01-15T10:30:00.000Z",
      "totalEarned": 15.75,
      "todayEarned": 5.25
    },
    "potentialDailyIncome": 5.25,
    "canClaimDailyIncome": true
  }
}
```

#### Complete Daily Income Workflow:

1. **Check Status** (GET `/users/today-my-income`)
   - Verify if user can claim today
   - See potential earnings

2. **Claim Income** (POST `/users/today-my-income`)
   - Automatically calculate 0.05% of normal wallet balance
   - Credit amount to normal wallet
   - Update daily income tracking

3. **Verify Transaction** (GET `/users/wallets`)
   - Check updated balance
   - View transaction history

#### Error Handling:
- **Already Claimed**: User can only claim once per day
- **No Balance**: Requires positive normal wallet balance
- **Authentication**: Requires valid JWT token

#### Security Features:
- ✅ One-time claim per day validation
- ✅ Automatic calculation based on current balance
- ✅ Transaction tracking in wallet history
- ✅ Bearer token authentication required
- ✅ Error handling for edge cases

---

## Level System Workflow

### Character Level Calculation:
1. **User Joins**: When a new user joins with a referral code
2. **Chain Analysis**: System analyzes the referral chain depth
3. **Level Assignment**: User gets character level based on position in chain
4. **Daily Calculation**: Character level income calculated daily from parent's wallet

### Digit Level Calculation:
1. **Direct Referrals**: System tracks direct referrals
2. **Wallet Criteria**: Checks each referral's wallet balance (minimum 50 rs)
3. **Self Wallet**: Checks user's own normal wallet balance
4. **Level Upgrade**: Automatically upgrades when criteria are met
5. **Daily Benefits**: Provides daily income based on own wallet balance

### Level Income Calculation:
1. **Character Level**: Percentage of parent's normal wallet balance
2. **Digit Level**: Percentage of user's own normal wallet balance
3. **Daily Claim**: Users can claim both incomes once per day
4. **Transaction History**: All level income tracked in wallet transactions

---

## Normal Wallet Deposit Guide

### Complete Example: Deposit to Normal Wallet

#### Step 1: Create Deposit Request
**POST** `/users/deposits`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: multipart/form-data
```

**Form Data:**
```
amount: 1000
paymentMethod: bank_transfer
paymentId: BANK123456789
walletType: normal
paymentProof: [upload payment screenshot/receipt]
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/users/deposits \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "amount=1000" \
  -F "paymentMethod=bank_transfer" \
  -F "paymentId=BANK123456789" \
  -F "walletType=normal" \
  -F "paymentProof=@/path/to/payment_screenshot.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "Deposit request created successfully",
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "amount": 1000,
    "paymentMethod": "bank_transfer",
    "paymentId": "BANK123456789",
    "walletType": "normal",
    "status": "pending",
    "createdAt": "2024-01-01T10:30:00.000Z"
  }
}
```

#### Step 2: Check Deposit Status
**GET** `/users/deposits`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "amount": 1000,
      "paymentMethod": "bank_transfer",
      "paymentId": "BANK123456789",
      "walletType": "normal",
      "status": "pending",
      "createdAt": "2024-01-01T10:30:00.000Z",
      "adminNotes": "",
      "approvedBy": null,
      "approvedAt": null
    }
  ]
}
```

#### Step 3: Admin Approval (Admin Only)
**POST** `/admin/deposits/64f8a1b2c3d4e5f6a7b8c9d0/approve`

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

**Body:**
```json
{
  "status": "approved",
  "adminNotes": "Payment verified successfully"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Deposit request approved successfully",
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "status": "approved",
    "approvedBy": "admin_user_id",
    "approvedAt": "2024-01-01T11:00:00.000Z"
  }
}
```

#### Step 4: Check Updated Wallet Balance
**GET** `/users/wallets`

**Response:**
```json
{
  "success": true,
  "data": {
    "investmentWallet": {
      "balance": 0,
      "transactions": []
    },
    "normalWallet": {
      "balance": 1000,
      "transactions": [
        {
          "type": "deposit",
          "amount": 1000,
          "description": "Deposit approved - bank_transfer",
          "date": "2024-01-01T11:00:00.000Z",
          "status": "approved"
        }
      ]
    }
  }
}
```

### Normal Wallet vs Investment Wallet

| Feature | Normal Wallet | Investment Wallet |
|---------|---------------|-------------------|
| **Referral Bonus** | ❌ No | ✅ Yes (10% on first deposit) |
| **Purpose** | Regular transactions | MLM investments |
| **Transfer** | ✅ Can transfer to investment | ✅ Can transfer to normal |
| **Deposit Process** | Same approval process | Same approval process |
| **Transaction History** | ✅ Full history | ✅ Full history |

### Payment Methods for Normal Wallet

1. **Bank Transfer**
   ```
   paymentMethod: bank_transfer
   paymentId: BANK123456789
   ```

2. **UPI Payment**
   ```
   paymentMethod: upi
   paymentId: UPI123456789
   ```

3. **Paytm**
   ```
   paymentMethod: paytm
   paymentId: PAYTM123456789
   ```

4. **PhonePe**
   ```
   paymentMethod: phonepe
   paymentId: PHONEPE123456789
   ```

5. **Other Methods**
   ```
   paymentMethod: other
   paymentId: OTHER123456789
   ```

### Error Responses

#### Invalid Amount
```json
{
  "success": false,
  "message": "Valid amount is required."
}
```

#### Missing Payment Proof
```json
{
  "success": false,
  "message": "Payment proof image is required."
}
```

#### Invalid Wallet Type
```json
{
  "success": false,
  "message": "Invalid wallet type."
}
```

#### File Too Large
```json
{
  "success": false,
  "message": "File too large. Maximum size is 5MB."
}
```

#### Invalid File Type
```json
{
  "success": false,
  "message": "Only image files are allowed!"
}
```

---

## Features Implemented

### ✅ Admin Features
- Admin signup (only one admin allowed)
- Admin login
- View all users with original passwords
- Block/unblock users
- View all deposit requests
- Approve/reject deposit requests with 10% referral bonus
- System statistics dashboard
- **Level system statistics**
- **Content upload with image and text**
- **Content management (view, edit, delete)**
- **Content visibility control**
- **Content pagination and search**

### ✅ User Features
- User signup with referral code validation
- User login
- Profile management
- Two wallet system (Investment & Normal)
- Deposit requests with payment proof upload
- Referral system tracking
- Wallet transfers
- Transaction history
- **Daily income system (0.05% of normal wallet balance)**
- **One-time daily income claim per day**
- **Daily income tracking and history**
- **Character Level System (A, B, C, D, E)**
- **Digit Level System (Lvl1, Lvl2, Lvl3, Lvl4, Lvl5)**
- **Level-based daily income calculation**
- **Automatic level calculation and updates**
- **Referral network tracking**
- **Content browsing with pagination**
- **Latest content access**
- **Content image and text viewing**

### ✅ Security Features
- JWT authentication
- Password hashing with bcrypt
- Original password storage for admin access
- File upload validation
- Role-based access control
- **Content access control (admin vs user)**
- **Image file validation and cleanup**

### ✅ MLM Features
- Referral code generation
- Referral tracking
- 10% bonus on first deposit to referrer
- Multi-level referral system structure
- Wallet management for investments
- **Character level income from parent wallets**
- **Digit level income from own wallet**
- **Automatic level progression based on criteria**

### ✅ Technical Features
- RESTful API design
- Proper error handling
- File upload support
- Database relationships
- Input validation
- Comprehensive documentation
- **CORS configuration for cross-origin requests**
- **Level calculation service**
- **Real-time level updates**
- **Content management system**
- **Image file management**
- **Content pagination and filtering**

---

## Installation & Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```
JWT_SECRET=your-secret-key-here
MONGODB_URI=your-mongodb-connection-string
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

3. Start the server:
```bash
npm start
```

4. Create admin account first:
```bash
POST /admin/signup
```

5. Start using the APIs!

---

## Notes

- All passwords are stored in plain text in the `originalPassword` field for admin access
- Only one admin account is allowed in the system
- Referral bonus (10%) is automatically processed when admin approves first deposit
- File uploads are limited to 5MB and only accept image files
- JWT tokens expire after 7 days
- All API responses follow a consistent format with `success`, `message`, and `data` fields 
- **Level system automatically calculates and updates when users join or wallet balances change**
- **Character levels are based on referral chain depth**
- **Digit levels are based on direct referrals and wallet criteria**
- **Daily income can be claimed once per day for both level types**
- **CORS is configured to allow cross-origin requests from specified domains**
- **Content images are stored in the `/uploads/` directory**
- **Content management includes automatic file cleanup on deletion**
- **Users can only access active content**
- **Content pagination supports efficient browsing of large content collections** 

### 17. Admin: Get User's First Deposit Bonus Percentage
**GET** `/admin/users/:userId/first-deposit-bonus`
- **Description**: Get a user's first deposit bonus percentage and status (admin only)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "userId": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "firstDepositBonus": {
        "hasReceived": false,
        "amount": 0,
        "percentage": 10,
        "receivedAt": null
      }
    }
  }
  ```

### 18. Admin: Update User's First Deposit Bonus Percentage
**POST** `/admin/users/:userId/first-deposit-bonus`
- **Description**: Update a user's first deposit bonus percentage (admin only, only if not yet received)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Body**:
  ```json
  {
    "percentage": 15
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "First deposit bonus percentage updated successfully",
    "data": {
      "userId": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "firstDepositBonus": {
        "hasReceived": false,
        "amount": 0,
        "percentage": 15,
        "receivedAt": null
      }
    }
  }
  ```
- **Error Response (Already Received)**:
  ```json
  {
    "success": false,
    "message": "User has already received first deposit bonus. Percentage cannot be changed.",
    "data": {
      "hasReceived": true,
      "amount": 100,
      "receivedAt": "2024-01-15T10:30:00.000Z"
    }
  }
  ```

### 19. Admin: List All Users' First Deposit Bonus Status
**GET** `/admin/first-deposit-bonuses`
- **Description**: List all users with their first deposit bonus status (admin only)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "user_id",
        "name": "User Name",
        "email": "user@example.com",
        "firstDepositBonus": {
          "hasReceived": true,
          "amount": 100,
          "percentage": 10,
          "receivedAt": "2024-01-15T10:30:00.000Z"
        },
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
  ```

### 20. Admin: Get Global First Deposit Bonus Percentage
**GET** `/admin/first-deposit-bonus-percentage`
- **Description**: Get the global first deposit bonus percentage (admin only)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "percentage": 10
    }
  }
  ```

### 21. Admin: Set Global First Deposit Bonus Percentage
**POST** `/admin/first-deposit-bonus-percentage`
- **Description**: Set the global first deposit bonus percentage (admin only)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Body**:
  ```json
  {
    "percentage": 15
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Global first deposit bonus percentage updated successfully",
    "data": {
      "percentage": 15
    }
  }
  ```

--- 

### 22. Admin: Upload Content with Image and Text
**POST** `/content/upload`
- **Description**: Upload content with image and text data (admin only)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Content-Type**: `multipart/form-data`
- **Body**:
  ```
  title: Content Title
  textData: This is the text content for the post
  image: [image file]
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Content uploaded successfully",
    "data": {
      "id": "content_id",
      "title": "Content Title",
      "imageUrl": "/uploads/image-1234567890.jpg",
      "textData": "This is the text content for the post",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
  ```

### 23. Admin: Get All Content (with pagination)
**GET** `/content/admin/list?page=1&limit=10`
- **Description**: Get all content with pagination (admin only)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "contents": [
        {
          "_id": "content_id",
          "title": "Content Title",
          "imageUrl": "/uploads/image-1234567890.jpg",
          "textData": "This is the text content for the post",
          "isActive": true,
          "createdBy": {
            "_id": "admin_id",
            "name": "Admin Name",
            "email": "admin@example.com"
          },
          "updatedBy": {
            "_id": "admin_id",
            "name": "Admin Name",
            "email": "admin@example.com"
          },
          "createdAt": "2024-01-15T10:30:00.000Z",
          "updatedAt": "2024-01-15T10:30:00.000Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 25,
        "pages": 3
      }
    }
  }
  ```

### 24. Admin: Get Single Content by ID
**GET** `/content/admin/:contentId`
- **Description**: Get single content by ID (admin only)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "content_id",
      "title": "Content Title",
      "imageUrl": "/uploads/image-1234567890.jpg",
      "textData": "This is the text content for the post",
      "isActive": true,
      "createdBy": {
        "_id": "admin_id",
        "name": "Admin Name",
        "email": "admin@example.com"
      },
      "updatedBy": {
        "_id": "admin_id",
        "name": "Admin Name",
        "email": "admin@example.com"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
  ```

### 25. Admin: Update Content
**PUT** `/content/admin/:contentId`
- **Description**: Update content with image and text (admin only)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Content-Type**: `multipart/form-data`
- **Body**:
  ```
  title: Updated Content Title (optional)
  textData: Updated text content (optional)
  isActive: true (optional)
  image: [new image file] (optional)
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Content updated successfully",
    "data": {
      "id": "content_id",
      "title": "Updated Content Title",
      "imageUrl": "/uploads/new-image-1234567890.jpg",
      "textData": "Updated text content",
      "isActive": true,
      "updatedAt": "2024-01-15T11:30:00.000Z"
    }
  }
  ```

### 26. Admin: Delete Content
**DELETE** `/content/admin/:contentId`
- **Description**: Delete content and associated image (admin only)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Content deleted successfully"
  }
  ```

### 27. Admin: Toggle Content Active Status
**PATCH** `/content/admin/:contentId/toggle`
- **Description**: Toggle content active/inactive status (admin only)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Content activated successfully",
    "data": {
      "id": "content_id",
      "isActive": true
    }
  }
  ```

---

## Content Management APIs

### Content System Overview

The content management system allows admins to upload and manage content with images and text that users can view.

#### **Content Structure:**
- **Title**: Content title
- **ImageUrl**: URL to the uploaded image
- **TextData**: Text content
- **IsActive**: Whether content is visible to users
- **CreatedBy**: Admin who created the content
- **UpdatedBy**: Admin who last updated the content

### 28. User: Get All Active Content
**GET** `/content/list?page=1&limit=10`
- **Description**: Get all active content with pagination (requires authentication)
- **Headers**: `Authorization: Bearer <user-token>`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "contents": [
        {
          "_id": "content_id",
          "title": "Content Title",
          "imageUrl": "/uploads/image-1234567890.jpg",
          "textData": "This is the text content for the post",
          "createdAt": "2024-01-15T10:30:00.000Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 15,
        "pages": 2
      }
    }
  }
  ```

### 29. User: Get Single Active Content by ID
**GET** `/content/:contentId`
- **Description**: Get single active content by ID (requires authentication)
- **Headers**: `Authorization: Bearer <user-token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "content_id",
      "title": "Content Title",
      "imageUrl": "/uploads/image-1234567890.jpg",
      "textData": "This is the text content for the post",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
  ```
- **Error Response (Content Not Found or Inactive)**:
  ```json
  {
    "success": false,
    "message": "Content not found or inactive."
  }
  ```

### 30. User: Get Latest Content
**GET** `/content/latest`
- **Description**: Get the latest active content (requires authentication)
- **Headers**: `Authorization: Bearer <user-token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "content_id",
      "title": "Latest Content Title",
      "imageUrl": "/uploads/latest-image-1234567890.jpg",
      "textData": "This is the latest text content",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
  ```
- **Error Response (No Active Content)**:
  ```json
  {
    "success": false,
    "message": "No active content found."
  }
  ```

---

## Content Management Workflow

### Admin Content Management:
1. **Upload Content**: Admin uploads image and text
2. **Manage Content**: View, edit, delete content
3. **Control Visibility**: Toggle active/inactive status
4. **Track Changes**: Monitor who created/updated content

### User Content Access:
1. **Browse Content**: View all active content with pagination
2. **View Single**: Get specific content by ID
3. **Latest Content**: Get the most recent active content
4. **Image Access**: Images served from `/uploads/` directory

### Content Features:
- **Image Upload**: Supports various image formats
- **Text Content**: Rich text data storage
- **Active/Inactive**: Control content visibility
- **Pagination**: Efficient content browsing
- **File Management**: Automatic image cleanup on deletion
- **Audit Trail**: Track creation and updates

---

## Content Upload Examples

### cURL Example for Admin Upload:
```bash
curl -X POST http://localhost:3000/content/upload \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "title=Welcome Message" \
  -F "textData=Welcome to our MLM platform! Join us today." \
  -F "image=@/path/to/welcome-image.jpg"
```

### JavaScript Example for User Access:
```javascript
// Get all active content
fetch('http://localhost:3000/content/list?page=1&limit=5', {
  headers: {
    'Authorization': 'Bearer YOUR_USER_TOKEN'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Content:', data.data.contents);
});

// Get latest content
fetch('http://localhost:3000/content/latest', {
  headers: {
    'Authorization': 'Bearer YOUR_USER_TOKEN'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Latest content:', data.data);
});
```

### Error Responses:

#### Missing Required Fields:
```json
{
  "success": false,
  "message": "Title and text data are required."
}
```

#### Missing Image File:
```json
{
  "success": false,
  "message": "Image file is required."
}
```

#### Content Not Found:
```json
{
  "success": false,
  "message": "Content not found."
}
```

#### File Too Large:
```json
{
  "success": false,
  "message": "File too large. Maximum size is 5MB."
}
```

---

## Features Implemented

### ✅ Admin Features
- Admin signup (only one admin allowed)
- Admin login
- View all users with original passwords
- Block/unblock users
- View all deposit requests
- Approve/reject deposit requests with 10% referral bonus
- System statistics dashboard
- **Level system statistics**
- **Content upload with image and text**
- **Content management (view, edit, delete)**
- **Content visibility control**
- **Content pagination and search**

### ✅ User Features
- User signup with referral code validation
- User login
- Profile management
- Two wallet system (Investment & Normal)
- Deposit requests with payment proof upload
- Referral system tracking
- Wallet transfers
- Transaction history
- **Daily income system (0.05% of normal wallet balance)**
- **One-time daily income claim per day**
- **Daily income tracking and history**
- **Character Level System (A, B, C, D, E)**
- **Digit Level System (Lvl1, Lvl2, Lvl3, Lvl4, Lvl5)**
- **Level-based daily income calculation**
- **Automatic level calculation and updates**
- **Referral network tracking**
- **Content browsing with pagination**
- **Latest content access**
- **Content image and text viewing**

### ✅ Security Features
- JWT authentication
- Password hashing with bcrypt
- Original password storage for admin access
- File upload validation
- Role-based access control
- **Content access control (admin vs user)**
- **Image file validation and cleanup**

### ✅ MLM Features
- Referral code generation
- Referral tracking
- 10% bonus on first deposit to referrer
- Multi-level referral system structure
- Wallet management for investments
- **Character level income from parent wallets**
- **Digit level income from own wallet**
- **Automatic level progression based on criteria**

### ✅ Technical Features
- RESTful API design
- Proper error handling
- File upload support
- Database relationships
- Input validation
- Comprehensive documentation
- **CORS configuration for cross-origin requests**
- **Level calculation service**
- **Real-time level updates**
- **Content management system**
- **Image file management**
- **Content pagination and filtering**

---

## Installation & Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```
JWT_SECRET=your-secret-key-here
MONGODB_URI=your-mongodb-connection-string
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

3. Start the server:
```bash
npm start
```

4. Create admin account first:
```bash
POST /admin/signup
```

5. Start using the APIs!

---

## Notes

- All passwords are stored in plain text in the `originalPassword` field for admin access
- Only one admin account is allowed in the system
- Referral bonus (10%) is automatically processed when admin approves first deposit
- File uploads are limited to 5MB and only accept image files
- JWT tokens expire after 7 days
- All API responses follow a consistent format with `success`, `message`, and `data` fields
- **Level system automatically calculates and updates when users join or wallet balances change**
- **Character levels are based on referral chain depth**
- **Digit levels are based on direct referrals and wallet criteria**
- **Daily income can be claimed once per day for both level types**
- **CORS is configured to allow cross-origin requests from specified domains**
- **Content images are stored in the `/uploads/` directory**
- **Content management includes automatic file cleanup on deletion**
- **Users can only access active content**
- **Content pagination supports efficient browsing of large content collections** 

### 31. Transfer Between Own Wallets
**POST** `/users/transfer`
- **Description**: Transfer money between user's own wallets (requires authentication)
- **Headers**: `Authorization: Bearer <user-token>`
- **Body**:
  ```json
  {
    "fromWallet": "investment",
    "toWallet": "normal",
    "amount": 500
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Transfer completed successfully",
    "data": {
      "fromWallet": "investment",
      "toWallet": "normal",
      "amount": 500,
      "newBalances": {
        "investment": 500,
        "normal": 1000
      }
    }
  }
  ```
- **Error Response (Insufficient Balance)**:
  ```json
  {
    "success": false,
    "message": "Insufficient balance in investment wallet. Available: 300"
  }
  ```
- **Error Response (Same Wallet)**:
  ```json
  {
    "success": false,
    "message": "From wallet and to wallet cannot be the same."
  }
  ```

### 32. Transfer to Another User's Normal Wallet
**POST** `/users/transfer-to-user`
- **Description**: Transfer money from user's wallet to another user's normal wallet using referral code (requires authentication)
- **Headers**: `Authorization: Bearer <user-token>`
- **Body**:
  ```json
  {
    "fromWallet": "normal",
    "referralCode": "USR123456",
    "amount": 200
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Transfer to user completed successfully",
    "data": {
      "fromWallet": "normal",
      "targetUser": {
        "name": "John Doe",
        "email": "john@example.com",
        "referralCode": "USR123456"
      },
      "amount": 200,
      "newBalance": 800
    }
  }
  ```
- **Error Response (User Not Found)**:
  ```json
  {
    "success": false,
    "message": "User with this referral code not found."
  }
  ```
- **Error Response (Self Transfer)**:
  ```json
  {
    "success": false,
    "message": "Cannot transfer to yourself."
  }
  ```

### 33. Get User Details by Referral Code
**GET** `/users/user-by-referral/:referralCode`
- **Description**: Get user details by referral code for transfer verification (requires authentication)
- **Headers**: `Authorization: Bearer <user-token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "name": "John Doe",
      "email": "john@example.com",
      "referralCode": "USR123456",
      "hasNormalWallet": true,
      "hasInvestmentWallet": true
    }
  }
  ```
- **Error Response (User Not Found)**:
  ```json
  {
    "success": false,
    "message": "User with this referral code not found."
  }
  ```
- **Error Response (Own Details)**:
  ```json
  {
    "success": false,
    "message": "Cannot get your own details using this endpoint."
  }
  ```

### 34. Get Transfer History
**GET** `/users/transfer-history?page=1&limit=20`
- **Description**: Get user's transfer history with pagination (requires authentication)
- **Headers**: `Authorization: Bearer <user-token>`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 20)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "transactions": [
        {
          "type": "transfer",
          "amount": -500,
          "description": "Transfer to normal wallet",
          "date": "2024-01-15T10:30:00.000Z",
          "status": "approved",
          "wallet": "investmentWallet"
        },
        {
          "type": "transfer_to_user",
          "amount": -200,
          "description": "Transfer to John Doe (USR123456)",
          "date": "2024-01-15T09:30:00.000Z",
          "status": "approved",
          "wallet": "normalWallet"
        },
        {
          "type": "transfer_from_user",
          "amount": 100,
          "description": "Transfer from Jane Smith (USR789012)",
          "date": "2024-01-15T08:30:00.000Z",
          "status": "approved",
          "wallet": "normalWallet"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 15,
        "pages": 1
      }
    }
  }
  ```

### 35. Get My Teams
**GET** `/users/my-teams`
- **Description**: Get user's team data including direct referrals and matrix levels (requires authentication)
- **Headers**: `Authorization: Bearer <user-token>`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Team data retrieved successfully",
    "data": {
      "user": {
        "id": "user_id",
        "name": "Team Owner",
        "email": "owner@example.com",
        "referralCode": "OWN123456"
      },
      "directReferrals": [
        {
          "id": "user_id",
          "name": "John Doe",
          "email": "john@example.com",
          "phone": "1234567890",
          "referralCode": "USR123456",
          "normalWalletBalance": 500,
          "investmentWalletBalance": 1000,
          "joinedDate": "2024-01-01T00:00:00.000Z",
          "level": 1,
          "upline": "Team Owner"
        }
      ],
      "matrixLevels": [
        {
          "level": 1,
          "users": [
            {
              "id": "user_id",
              "name": "John Doe",
              "email": "john@example.com",
              "phone": "1234567890",
              "referralCode": "USR123456",
              "normalWalletBalance": 500,
              "investmentWalletBalance": 1000,
              "joinedDate": "2024-01-01T00:00:00.000Z",
              "upline": "Team Owner"
            }
          ]
        },
        {
          "level": 2,
          "users": [
            {
              "id": "user_id",
              "name": "Jane Smith",
              "email": "jane@example.com",
              "phone": "1234567890",
              "referralCode": "USR789012",
              "normalWalletBalance": 300,
              "investmentWalletBalance": 800,
              "joinedDate": "2024-01-02T00:00:00.000Z",
              "upline": "John Doe"
            }
          ]
        },
        {
          "level": 3,
          "users": [
            {
              "id": "user_id",
              "name": "Bob Wilson",
              "email": "bob@example.com",
              "phone": "1234567890",
              "referralCode": "USR345678",
              "normalWalletBalance": 200,
              "investmentWalletBalance": 600,
              "joinedDate": "2024-01-03T00:00:00.000Z",
              "upline": "Jane Smith"
            }
          ]
        }
      ],
      "teamStats": {
        "directReferrals": 5,
        "totalMatrixUsers": 12,
        "totalTeamMembers": 17,
        "totalNormalWalletBalance": 2500,
        "totalInvestmentWalletBalance": 8000
      }
    }
  }
  ```

### 36. Get Team Member Details
**GET** `/users/team-member/:memberId`
- **Description**: Get detailed information about a specific team member (requires authentication)
- **Headers**: `Authorization: Bearer <user-token>`
- **Parameters**: `memberId` - ID of the team member
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "member": {
        "id": "member_id",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890",
        "referralCode": "USR123456",
        "normalWalletBalance": 500,
        "investmentWalletBalance": 1000,
        "joinedDate": "2024-01-01T00:00:00.000Z",
        "level": 1,
        "upline": "Team Owner"
      },
      "directReferrals": [
        {
          "id": "user_id",
          "name": "Jane Smith",
          "email": "jane@example.com",
          "phone": "1234567890",
          "referralCode": "USR789012",
          "normalWalletBalance": 300,
          "investmentWalletBalance": 800,
          "joinedDate": "2024-01-02T00:00:00.000Z"
        }
      ]
    }
  }
  ```

### 37. Get Team Income
**GET** `/users/team-income`
- **Description**: Get team income data and statistics by level (requires authentication)
- **Headers**: `Authorization: Bearer <user-token>`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Team income data retrieved successfully",
    "data": {
      "user": {
        "id": "user_id",
        "name": "Team Owner",
        "email": "owner@example.com",
        "referralCode": "OWN123456"
      },
      "teamIncomeByLevel": {
        "level1": {
          "count": 5,
          "totalNormalWallet": 2500,
          "totalInvestmentWallet": 5000,
          "totalDailyIncome": 1250,
          "users": [
            {
              "id": "user_id",
              "name": "John Doe",
              "email": "john@example.com",
              "phone": "1234567890",
              "referralCode": "USR123456",
              "normalWalletBalance": 500,
              "investmentWalletBalance": 1000,
              "dailyIncomeEarned": 250,
              "joinedDate": "2024-01-01T00:00:00.000Z"
            }
          ]
        },
        "level2": {
          "count": 8,
          "totalNormalWallet": 4000,
          "totalInvestmentWallet": 8000,
          "totalDailyIncome": 2000,
          "users": [
            {
              "id": "user_id",
              "name": "Jane Smith",
              "email": "jane@example.com",
              "phone": "1234567890",
              "referralCode": "USR789012",
              "normalWalletBalance": 500,
              "investmentWalletBalance": 1000,
              "dailyIncomeEarned": 250,
              "joinedDate": "2024-01-02T00:00:00.000Z",
              "upline": "John Doe"
            }
          ]
        },
        "level3": {
          "count": 12,
          "totalNormalWallet": 6000,
          "totalInvestmentWallet": 12000,
          "totalDailyIncome": 3000,
          "users": [
            {
              "id": "user_id",
              "name": "Bob Wilson",
              "email": "bob@example.com",
              "phone": "1234567890",
              "referralCode": "USR345678",
              "normalWalletBalance": 500,
              "investmentWalletBalance": 1000,
              "dailyIncomeEarned": 250,
              "joinedDate": "2024-01-03T00:00:00.000Z",
              "upline": "Jane Smith"
            }
          ]
        },
        "level4": {
          "count": 15,
          "totalNormalWallet": 7500,
          "totalInvestmentWallet": 15000,
          "totalDailyIncome": 3750,
          "users": [
            {
              "id": "user_id",
              "name": "Alice Brown",
              "email": "alice@example.com",
              "phone": "1234567890",
              "referralCode": "USR901234",
              "normalWalletBalance": 500,
              "investmentWalletBalance": 1000,
              "dailyIncomeEarned": 250,
              "joinedDate": "2024-01-04T00:00:00.000Z",
              "upline": "Bob Wilson"
            }
          ]
        },
        "level5": {
          "count": 20,
          "totalNormalWallet": 10000,
          "totalInvestmentWallet": 20000,
          "totalDailyIncome": 5000,
          "users": [
            {
              "id": "user_id",
              "name": "Charlie Davis",
              "email": "charlie@example.com",
              "phone": "1234567890",
              "referralCode": "USR567890",
              "normalWalletBalance": 500,
              "investmentWalletBalance": 1000,
              "dailyIncomeEarned": 250,
              "joinedDate": "2024-01-05T00:00:00.000Z",
              "upline": "Alice Brown"
            }
          ]
        }
      },
      "totalTeamMembers": 60,
      "totalTeamIncome": 15000,
      "totalNormalWalletBalance": 30000,
      "totalInvestmentWalletBalance": 60000,
      "summary": {
        "level1Members": 5,
        "level2Members": 8,
        "level3Members": 12,
        "level4Members": 15,
        "level5Members": 20,
        "totalMembers": 60,
        "totalIncome": 15000,
        "totalNormalWallet": 30000,
        "totalInvestmentWallet": 60000
      }
    }
  }
  ```

---

## Wallet Transfer System

### Transfer Types:

#### **1. Internal Transfer (Between Own Wallets):**
- Transfer from investment wallet to normal wallet
- Transfer from normal wallet to investment wallet
- Real-time balance updates
- Transaction history tracking

#### **2. User-to-User Transfer:**
- Transfer from any wallet to another user's normal wallet
- Uses referral code for user identification
- Prevents self-transfer
- Full transaction tracking for both users

### Transfer Features:
- **Balance Validation**: Checks sufficient balance before transfer
- **Transaction History**: Complete audit trail for all transfers
- **User Verification**: Validates target user by referral code
- **Security**: Prevents unauthorized transfers
- **Real-time Updates**: Immediate balance updates
- **Error Handling**: Comprehensive error messages

### Transfer Workflow:

#### **Internal Transfer:**
1. **Validate Input**: Check wallet types and amount
2. **Check Balance**: Verify sufficient funds
3. **Perform Transfer**: Update both wallet balances
4. **Record Transactions**: Add debit and credit entries
5. **Return Result**: New balances and confirmation

#### **User-to-User Transfer:**
1. **Validate Referral Code**: Find target user
2. **Check Balance**: Verify sender has sufficient funds
3. **Prevent Self-Transfer**: Ensure different users
4. **Perform Transfer**: Update both users' balances
5. **Record Transactions**: Add entries for both users
6. **Return Result**: Transfer confirmation with user details

### Transfer Transaction Types:
- **`transfer`**: Internal wallet transfers
- **`transfer_to_user`**: Outgoing transfers to other users
- **`transfer_from_user`**: Incoming transfers from other users

### Security Features:
- ✅ JWT authentication required
- ✅ Balance validation
- ✅ User verification by referral code
- ✅ Self-transfer prevention
- ✅ Complete transaction audit trail
- ✅ Real-time balance updates

---

## Transfer Examples

### cURL Example for Internal Transfer:
```bash
curl -X POST http://localhost:3000/users/transfer \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromWallet": "investment",
    "toWallet": "normal",
    "amount": 500
  }'
```

### cURL Example for User-to-User Transfer:
```bash
curl -X POST http://localhost:3000/users/transfer-to-user \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromWallet": "normal",
    "referralCode": "USR123456",
    "amount": 200
  }'
```

### JavaScript Example:
```javascript
// Internal transfer
fetch('http://localhost:3000/users/transfer', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_USER_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fromWallet: 'investment',
    toWallet: 'normal',
    amount: 500
  })
})
.then(response => response.json())
.then(data => {
  console.log('Transfer result:', data);
});

// User-to-user transfer
fetch('http://localhost:3000/users/transfer-to-user', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_USER_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fromWallet: 'normal',
    referralCode: 'USR123456',
    amount: 200
  })
})
.then(response => response.json())
.then(data => {
  console.log('User transfer result:', data);
});
```

### Error Responses:

#### Insufficient Balance:
```json
{
  "success": false,
  "message": "Insufficient balance in investment wallet. Available: 300"
}
```

#### User Not Found:
```json
{
  "success": false,
  "message": "User with this referral code not found."
}
```

#### Self Transfer Attempt:
```json
{
  "success": false,
  "message": "Cannot transfer to yourself."
}
```

#### Invalid Amount:
```json
{
  "success": false,
  "message": "Amount must be greater than 0."
}
```

---

## Features Implemented

### ✅ Admin Features
- Admin signup (only one admin allowed)
- Admin login
- View all users with original passwords
- Block/unblock users
- View all deposit requests
- Approve/reject deposit requests with 10% referral bonus
- System statistics dashboard
- **Level system statistics**
- **Content upload with image and text**
- **Content management (view, edit, delete)**
- **Content visibility control**
- **Content pagination and search**

### ✅ User Features
- User signup with referral code validation
- User login
- Profile management
- Two wallet system (Investment & Normal)
- Deposit requests with payment proof upload
- Referral system tracking
- Wallet transfers
- Transaction history
- **Daily income system (0.05% of normal wallet balance)**
- **One-time daily income claim per day**
- **Daily income tracking and history**
- **Character Level System (A, B, C, D, E)**
- **Digit Level System (Lvl1, Lvl2, Lvl3, Lvl4, Lvl5)**
- **Level-based daily income calculation**
- **Automatic level calculation and updates**
- **Referral network tracking**
- **Content browsing with pagination**
- **Latest content access**
- **Content image and text viewing**

### ✅ Security Features
- JWT authentication
- Password hashing with bcrypt
- Original password storage for admin access
- File upload validation
- Role-based access control
- **Content access control (admin vs user)**
- **Image file validation and cleanup**
- **Transfer balance validation**
- **User verification for transfers**
- **Self-transfer prevention**
- **Enhanced error handling for transfers**

### ✅ MLM Features
- Referral code generation
- Referral tracking
- 10% bonus on first deposit to referrer
- Multi-level referral system structure
- Wallet management for investments
- **Character level income from parent wallets**
- **Digit level income from own wallet**
- **Automatic level progression based on criteria**
- **User-to-user wallet transfers**
- **Referral code-based user identification**

### ✅ Technical Features
- RESTful API design
- Proper error handling
- File upload support
- Database relationships
- Input validation
- Comprehensive documentation
- **CORS configuration for cross-origin requests**
- **Level calculation service**
- **Real-time level updates**
- **Content management system**
- **Image file management**
- **Content pagination and filtering**
- **Transfer transaction tracking**
- **Real-time balance updates**
- **Transfer history pagination**
- **Transfer validation system**
- **Enhanced error messages**

---

## Installation & Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```
JWT_SECRET=your-secret-key-here
MONGODB_URI=your-mongodb-connection-string
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

3. Start the server:
```bash
npm start
```

4. Create admin account first:
```bash
POST /admin/signup
```

5. Start using the APIs!

---

## Notes

- All passwords are stored in plain text in the `originalPassword` field for admin access
- Only one admin account is allowed in the system
- Referral bonus (10%) is automatically processed when admin approves first deposit
- File uploads are limited to 5MB and only accept image files
- JWT tokens expire after 7 days
- All API responses follow a consistent format with `success`, `message`, and `data` fields
- **Level system automatically calculates and updates when users join or wallet balances change**
- **Character levels are based on referral chain depth**
- **Digit levels are based on direct referrals and wallet criteria**
- **Daily income can be claimed once per day for both level types**
- **CORS is configured to allow cross-origin requests from specified domains**
- **Content images are stored in the `/uploads/` directory**
- **Content management includes automatic file cleanup on deletion**
- **Users can only access active content**
- **Content pagination supports efficient browsing of large content collections**
- **Wallet transfers include comprehensive balance validation**
- **User-to-user transfers require referral code verification**
- **Transfer history provides complete audit trail**
- **All transfers are real-time with immediate balance updates**
- **Transfer validation prevents failed transfers**
- **Enhanced error messages provide detailed balance information**

### 35. Get Wallet Balance for Transfer
**GET** `/users/wallet-balance/:walletType`
- **Description**: Get specific wallet balance for transfer planning (requires authentication)
- **Headers**: `Authorization: Bearer <user-token>`
- **Path Parameters**:
  - `walletType`: `investmentWallet` or `normalWallet`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "walletType": "normalWallet",
      "balance": 1000,
      "transactionCount": 5,
      "lastTransaction": {
        "type": "deposit",
        "amount": 500,
        "description": "Deposit approved - bank_transfer",
        "date": "2024-01-15T10:30:00.000Z",
        "status": "approved"
      }
    }
  }
  ```

### 36. Validate Transfer Request
**POST** `/users/validate-transfer`
- **Description**: Validate transfer request before processing (requires authentication)
- **Headers**: `Authorization: Bearer <user-token>`
- **Body**:
  ```json
  {
    "fromWallet": "normalWallet",
    "referralCode": "USR123456",
    "amount": 200
  }
  ```
- **Response (Valid Transfer)**:
  ```json
  {
    "success": true,
    "data": {
      "canTransfer": true,
      "validation": {
        "fromWallet": "normalWallet",
        "referralCode": "USR123456",
        "amount": 200,
        "availableBalance": 1000,
        "requiredAmount": 200,
        "shortfall": 0,
        "hasSufficientBalance": true
      },
      "targetUser": {
        "name": "John Doe",
        "email": "john@example.com",
        "referralCode": "USR123456"
      },
      "message": "Transfer is valid and can be processed"
    }
  }
  ```
- **Response (Insufficient Balance)**:
  ```json
  {
    "success": true,
    "data": {
      "canTransfer": false,
      "validation": {
        "fromWallet": "normalWallet",
        "referralCode": "USR123456",
        "amount": 500,
        "availableBalance": 200,
        "requiredAmount": 500,
        "shortfall": 300,
        "hasSufficientBalance": false
      },
      "targetUser": {
        "name": "John Doe",
        "email": "john@example.com",
        "referralCode": "USR123456"
      },
      "message": "Insufficient balance. Available: 200, Required: 500"
    }
  }
  ```

---

## Enhanced Transfer System

### Transfer Workflow with Validation:

#### **Step 1: Check Wallet Balance**
```bash
GET /users/wallet-balance/normalWallet
```

#### **Step 2: Validate Transfer Request**
```bash
POST /users/validate-transfer
{
  "fromWallet": "normalWallet",
  "referralCode": "USR123456",
  "amount": 200
}
```

#### **Step 3: Execute Transfer**
```bash
POST /users/transfer-to-user
{
  "fromWallet": "normalWallet",
  "referralCode": "USR123456",
  "amount": 200
}
```

### Transfer Error Handling:

#### **Enhanced Insufficient Balance Error:**
```json
{
  "success": false,
  "message": "Insufficient balance in normalWallet. Available: 0, Required: 200",
  "data": {
    "availableBalance": 0,
    "requiredAmount": 200,
    "shortfall": 200,
    "walletType": "normalWallet"
  }
}
```

#### **Invalid Wallet Type Error:**
```json
{
  "success": false,
  "message": "Invalid wallet type. Use \"investmentWallet\" or \"normalWallet\"."
}
```

### Transfer Best Practices:

1. **Check Balance First**: Use `/users/wallet-balance/:walletType` to check available balance
2. **Validate Transfer**: Use `/users/validate-transfer` to validate before processing
3. **Handle Errors**: Check for insufficient balance, invalid referral codes, etc.
4. **Monitor Transactions**: Use `/users/transfer-history` to track all transfers

### Transfer Examples:

#### **Complete Transfer Workflow:**
```javascript
// 1. Check wallet balance
const balanceResponse = await fetch('/users/wallet-balance/normalWallet', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});
const balanceData = await balanceResponse.json();
console.log('Available balance:', balanceData.data.balance);

// 2. Validate transfer
const validateResponse = await fetch('/users/validate-transfer', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fromWallet: 'normalWallet',
    referralCode: 'USR123456',
    amount: 200
  })
});
const validateData = await validateResponse.json();

if (validateData.data.canTransfer) {
  // 3. Execute transfer
  const transferResponse = await fetch('/users/transfer-to-user', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fromWallet: 'normalWallet',
      referralCode: 'USR123456',
      amount: 200
    })
  });
  const transferData = await transferResponse.json();
  console.log('Transfer successful:', transferData);
} else {
  console.log('Transfer validation failed:', validateData.data.message);
}
```

---

## Features Implemented

### ✅ Admin Features
- Admin signup (only one admin allowed)
- Admin login
- View all users with original passwords
- Block/unblock users
- View all deposit requests
- Approve/reject deposit requests with 10% referral bonus
- System statistics dashboard
- **Level system statistics**
- **Content upload with image and text**
- **Content management (view, edit, delete)**
- **Content visibility control**
- **Content pagination and search**

### ✅ User Features
- User signup with referral code validation
- User login
- Profile management
- Two wallet system (Investment & Normal)
- Deposit requests with payment proof upload
- Referral system tracking
- Wallet transfers
- Transaction history
- **Daily income system (0.05% of normal wallet balance)**
- **One-time daily income claim per day**
- **Daily income tracking and history**
- **Character Level System (A, B, C, D, E)**
- **Digit Level System (Lvl1, Lvl2, Lvl3, Lvl4, Lvl5)**
- **Level-based daily income calculation**
- **Automatic level calculation and updates**
- **Referral network tracking**
- **Content browsing with pagination**
- **Latest content access**
- **Content image and text viewing**

### ✅ Security Features
- JWT authentication
- Password hashing with bcrypt
- Original password storage for admin access
- File upload validation
- Role-based access control
- **Content access control (admin vs user)**
- **Image file validation and cleanup**
- **Transfer balance validation**
- **User verification for transfers**
- **Self-transfer prevention**
- **Enhanced error handling for transfers**

### ✅ MLM Features
- Referral code generation
- Referral tracking
- 10% bonus on first deposit to referrer
- Multi-level referral system structure
- Wallet management for investments
- **Character level income from parent wallets**
- **Digit level income from own wallet**
- **Automatic level progression based on criteria**
- **User-to-user wallet transfers**
- **Referral code-based user identification**

### ✅ Technical Features
- RESTful API design
- Proper error handling
- File upload support
- Database relationships
- Input validation
- Comprehensive documentation
- **CORS configuration for cross-origin requests**
- **Level calculation service**
- **Real-time level updates**
- **Content management system**
- **Image file management**
- **Content pagination and filtering**
- **Transfer transaction tracking**
- **Real-time balance updates**
- **Transfer history pagination**
- **Transfer validation system**
- **Enhanced error messages** 