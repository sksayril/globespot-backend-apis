# Withdrawal API Documentation

## Overview
The withdrawal system allows users to request withdrawals with their wallet information, including withdrawal wallet text and image URL. Admins can approve or reject these requests.

## User APIs

### 1. Request Withdrawal
**POST** `/withdrawal/request`

Request a withdrawal with wallet information.

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
    "amount": 100,
    "withdrawalWalletText": "0x1234567890abcdef...",
    "withdrawalWalletImage": "https://example.com/wallet-qr.png"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Withdrawal request submitted successfully",
    "data": {
        "requestId": "507f1f77bcf86cd799439011",
        "amount": 100,
        "walletAddress": "0x1234567890abcdef...",
        "withdrawalWalletText": "0x1234567890abcdef...",
        "withdrawalWalletImage": "https://example.com/wallet-qr.png",
        "status": "pending",
        "createdAt": "2024-01-15T10:30:00.000Z"
    }
}
```

**Error Responses:**

**Insufficient Balance:**
```json
{
    "success": false,
    "message": "Insufficient balance in normal wallet",
    "availableBalance": 50
}
```

**Wallet Not Set:**
```json
{
    "success": false,
    "message": "Wallet information not set. Please set your wallet address and QR code first."
}
```

**Wallet Not Verified:**
```json
{
    "success": false,
    "message": "Wallet information not verified. Please contact admin for verification."
}
```

**Note:** First-time wallet setup is automatically verified. This error only occurs if there are issues with the wallet verification process.

### 2. Get User's Withdrawal Requests
**GET** `/withdrawal/my-requests?page=1&limit=10&status=pending`

Get paginated list of user's withdrawal requests.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (pending/approved/rejected)

**Response:**
```json
{
    "success": true,
    "data": {
        "requests": [
            {
                "_id": "507f1f77bcf86cd799439011",
                "userId": "507f1f77bcf86cd799439012",
                "userEmail": "user@example.com",
                "userName": "John Doe",
                "walletAddress": "0x1234567890abcdef...",
                "withdrawalWalletText": "0x1234567890abcdef...",
                "withdrawalWalletImage": "https://example.com/wallet-qr.png",
                "amount": 100,
                "walletType": "normal",
                "status": "pending",
                "createdAt": "2024-01-15T10:30:00.000Z",
                "updatedAt": "2024-01-15T10:30:00.000Z"
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 1,
            "totalRequests": 1,
            "hasNext": false,
            "hasPrev": false
        }
    }
}
```

### 3. Get Specific Withdrawal Request Details
**GET** `/withdrawal/my-request/:requestId`

Get details of a specific withdrawal request.

**Response:**
```json
{
    "success": true,
    "data": {
        "withdrawalRequest": {
            "_id": "507f1f77bcf86cd799439011",
            "userId": "507f1f77bcf86cd799439012",
            "userEmail": "user@example.com",
            "userName": "John Doe",
            "walletAddress": "0x1234567890abcdef...",
            "withdrawalWalletText": "0x1234567890abcdef...",
            "withdrawalWalletImage": "https://example.com/wallet-qr.png",
            "amount": 100,
            "walletType": "normal",
            "status": "approved",
            "adminId": "507f1f77bcf86cd799439013",
            "adminName": "Admin User",
            "approvedAt": "2024-01-15T11:00:00.000Z",
            "transactionHash": "0xabcdef1234567890...",
            "notes": "Approved after verification",
            "createdAt": "2024-01-15T10:30:00.000Z",
            "updatedAt": "2024-01-15T11:00:00.000Z"
        }
    }
}
```

## Admin APIs

### 1. Get All Withdrawal Requests
**GET** `/withdrawal/all-requests?page=1&limit=10&status=pending`

Get all withdrawal requests with filtering options.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (pending/approved/rejected)

**Response:**
```json
{
    "success": true,
    "data": {
        "requests": [
            {
                "_id": "507f1f77bcf86cd799439011",
                "userId": {
                    "_id": "507f1f77bcf86cd799439012",
                    "name": "John Doe",
                    "email": "user@example.com",
                    "phone": "+1234567890"
                },
                "userEmail": "user@example.com",
                "userName": "John Doe",
                "walletAddress": "0x1234567890abcdef...",
                "withdrawalWalletText": "0x1234567890abcdef...",
                "withdrawalWalletImage": "https://example.com/wallet-qr.png",
                "amount": 100,
                "walletType": "normal",
                "status": "pending",
                "createdAt": "2024-01-15T10:30:00.000Z",
                "updatedAt": "2024-01-15T10:30:00.000Z"
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 1,
            "totalRequests": 1,
            "hasNext": false,
            "hasPrev": false
        }
    }
}
```

### 2. Get Withdrawal Request Details (Admin)
**GET** `/withdrawal/request/:requestId`

Get detailed information about a specific withdrawal request.

**Response:**
```json
{
    "success": true,
    "data": {
        "withdrawalRequest": {
            "_id": "507f1f77bcf86cd799439011",
            "userId": {
                "_id": "507f1f77bcf86cd799439012",
                "name": "John Doe",
                "email": "user@example.com",
                "phone": "+1234567890",
                "profileImage": "uploads/profile-1234567890.png"
            },
            "userEmail": "user@example.com",
            "userName": "John Doe",
            "walletAddress": "0x1234567890abcdef...",
            "withdrawalWalletText": "0x1234567890abcdef...",
            "withdrawalWalletImage": "https://example.com/wallet-qr.png",
            "amount": 100,
            "walletType": "normal",
            "status": "pending",
            "createdAt": "2024-01-15T10:30:00.000Z",
            "updatedAt": "2024-01-15T10:30:00.000Z"
        },
        "userInfo": {
            "id": "507f1f77bcf86cd799439012",
            "name": "John Doe",
            "email": "user@example.com",
            "phone": "+1234567890",
            "profileImage": "uploads/profile-1234567890.png"
        }
    }
}
```

### 3. Approve Withdrawal Request
**POST** `/withdrawal/approve/:requestId`

Approve a withdrawal request.

**Headers:**
```
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
    "transactionHash": "0xabcdef1234567890...",
    "notes": "Approved after verification"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Withdrawal request approved successfully",
    "data": {
        "requestId": "507f1f77bcf86cd799439011",
        "status": "approved",
        "approvedAt": "2024-01-15T11:00:00.000Z",
        "adminName": "Admin User"
    }
}
```

### 4. Reject Withdrawal Request
**POST** `/withdrawal/reject/:requestId`

Reject a withdrawal request.

**Headers:**
```
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
    "rejectionReason": "Invalid wallet address provided"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Withdrawal request rejected successfully",
    "data": {
        "requestId": "507f1f77bcf86cd799439011",
        "status": "rejected",
        "rejectedAt": "2024-01-15T11:00:00.000Z",
        "rejectionReason": "Invalid wallet address provided",
        "adminName": "Admin User"
    }
}
```

### 5. Get Withdrawal Statistics
**GET** `/withdrawal/statistics`

Get withdrawal statistics for admin dashboard.

**Response:**
```json
{
    "success": true,
    "data": {
        "totalRequests": 50,
        "pendingRequests": 10,
        "approvedRequests": 35,
        "rejectedRequests": 5,
        "totalAmount": 5000,
        "pendingAmount": 1000,
        "approvedAmount": 3500
    }
}
```

## Withdrawal Request Model

### Fields:
- `userId`: User ID (ObjectId, required)
- `userEmail`: User's email (String, required)
- `userName`: User's name (String, required)
- `walletAddress`: User's verified wallet address (String, required)
- `withdrawalWalletText`: Withdrawal wallet text provided by user (String, required)
- `withdrawalWalletImage`: Withdrawal wallet image URL provided by user (String, required)
- `amount`: Withdrawal amount (Number, required, min: 0)
- `walletType`: Wallet type (String, enum: ['normal'], default: 'normal')
- `status`: Request status (String, enum: ['pending', 'approved', 'rejected'], default: 'pending')
- `adminId`: Admin who processed the request (ObjectId, default: null)
- `adminName`: Admin name (String, default: null)
- `approvedAt`: Approval timestamp (Date, default: null)
- `rejectedAt`: Rejection timestamp (Date, default: null)
- `rejectionReason`: Reason for rejection (String, default: null)
- `transactionHash`: Blockchain transaction hash (String, default: null)
- `notes`: Admin notes (String, default: null)
- `createdAt`: Creation timestamp (Date, default: Date.now)
- `updatedAt`: Last update timestamp (Date, default: Date.now)

## Workflow

### For Users:
1. **Set Wallet Info**: First set wallet address and QR code using wallet management APIs
2. **Request Withdrawal**: Submit withdrawal request with amount, wallet text, and image URL
3. **Track Status**: Monitor request status through provided APIs
4. **View Details**: Get detailed information about specific requests

### For Admins:
1. **Review Requests**: View all withdrawal requests with user information
2. **Check Details**: Get detailed information including withdrawal wallet text and image
3. **Process Requests**: Approve or reject with transaction hash and notes
4. **Monitor Statistics**: Track withdrawal statistics and amounts

## Security Features

- ✅ Admin approval required for all withdrawals
- ✅ Wallet verification required before withdrawal
- ✅ Transaction tracking and audit trail
- ✅ User can only access their own requests
- ✅ Admin can view all requests with user details
- ✅ Withdrawal wallet text and image URL tracking
- ✅ Automatic balance deduction and refund on rejection 