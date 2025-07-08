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

### ✅ Security Features
- JWT authentication
- Password hashing with bcrypt
- Original password storage for admin access
- File upload validation
- Role-based access control

### ✅ MLM Features
- Referral code generation
- Referral tracking
- 10% bonus on first deposit to referrer
- Multi-level referral system structure
- Wallet management for investments

### ✅ Technical Features
- RESTful API design
- Proper error handling
- File upload support
- Database relationships
- Input validation
- Comprehensive documentation

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

### 12. Admin: Get User's First Deposit Bonus Percentage
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

### 13. Admin: Update User's First Deposit Bonus Percentage
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

### 14. Admin: List All Users' First Deposit Bonus Status
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

### 15. Admin: Get Global First Deposit Bonus Percentage
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

### 16. Admin: Set Global First Deposit Bonus Percentage
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