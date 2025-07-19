# Wallet Management API Documentation

## Overview
This system allows users to set their wallet address and QR code image. First time setup is automatically approved, while subsequent changes require admin approval. The wallet information is used for withdrawal requests.

## User APIs

### 1. Set Wallet Information (First Time Setup)
**POST** `/users/set-wallet-info`

Set wallet address and QR code for the first time. This is automatically approved and verified.

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data
```

**Body (Form Data):**
```
walletAddress: "0x1234567890abcdef..."
qrCode: [QR Code Image File]
```

**Response:**
```json
{
    "success": true,
    "message": "Wallet information set successfully and automatically verified",
    "data": {
        "walletAddress": "0x1234567890abcdef...",
        "qrCode": "uploads/qr-1234567890.png",
        "isVerified": true,
        "lastUpdated": "2024-01-15T10:30:00.000Z"
    }
}
```

### 2. Get Wallet Information
**GET** `/users/wallet-info`

Get current wallet information and pending change requests.

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
    "success": true,
    "data": {
        "walletInfo": {
            "address": "0x1234567890abcdef...",
            "qrCode": "uploads/qr-1234567890.png",
            "isVerified": true,
            "lastUpdated": "2024-01-15T10:30:00.000Z"
        },
        "pendingRequests": [],
        "totalRequests": 2
    }
}
```

### 3. Request Wallet Change
**POST** `/users/request-wallet-change`

Request to change wallet address and QR code (requires admin approval for subsequent changes).

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data
```

**Body (Form Data):**
```
newWalletAddress: "0xabcdef1234567890..."
reason: "Lost access to old wallet"
newQrCode: [New QR Code Image File]
```

**Response:**
```json
{
    "success": true,
    "message": "Wallet change request submitted successfully",
    "data": {
        "requestId": "WCR_1705312200000_abc123def",
        "oldAddress": "0x1234567890abcdef...",
        "newAddress": "0xabcdef1234567890...",
        "reason": "Lost access to old wallet",
        "status": "pending",
        "requestedAt": "2024-01-15T10:30:00.000Z"
    }
}
```

### 4. Get Wallet Change Request Status
**GET** `/users/wallet-change-status/:requestId`

Get status of a specific wallet change request.

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
    "success": true,
    "data": {
        "requestId": "WCR_1705312200000_abc123def",
        "oldAddress": "0x1234567890abcdef...",
        "newAddress": "0xabcdef1234567890...",
        "reason": "Lost access to old wallet",
        "status": "approved",
        "adminNotes": "Approved after verification",
        "requestedAt": "2024-01-15T10:30:00.000Z",
        "processedAt": "2024-01-15T11:00:00.000Z"
    }
}
```

### 5. Get All Wallet Change Requests
**GET** `/users/wallet-change-requests?page=1&limit=10&status=pending`

Get paginated list of wallet change requests.

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
                "requestId": "WCR_1705312200000_abc123def",
                "oldAddress": "0x1234567890abcdef...",
                "newAddress": "0xabcdef1234567890...",
                "reason": "Lost access to old wallet",
                "status": "pending",
                "requestedAt": "2024-01-15T10:30:00.000Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 10,
            "total": 5,
            "pages": 1
        },
        "summary": {
            "total": 5,
            "pending": 2,
            "approved": 2,
            "rejected": 1
        }
    }
}
```

## Admin APIs

### 1. Get All Wallet Change Requests
**GET** `/admin/wallet-change-requests?page=1&limit=20&status=pending&userId=123`

Get all wallet change requests with filtering options.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status
- `userId` (optional): Filter by specific user

**Response:**
```json
{
    "success": true,
    "data": {
        "requests": [
            {
                "requestId": "WCR_1705312200000_abc123def",
                "oldAddress": "0x1234567890abcdef...",
                "newAddress": "0xabcdef1234567890...",
                "reason": "Lost access to old wallet",
                "status": "pending",
                "requestedAt": "2024-01-15T10:30:00.000Z",
                "user": {
                    "id": "507f1f77bcf86cd799439011",
                    "name": "John Doe",
                    "email": "john@example.com",
                    "phone": "+1234567890"
                }
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 15,
            "pages": 1
        },
        "summary": {
            "total": 15,
            "pending": 8,
            "approved": 5,
            "rejected": 2
        }
    }
}
```

### 2. Get Pending Wallet Changes
**GET** `/admin/pending-wallet-changes?page=1&limit=20`

Get only pending wallet change requests.

**Response:**
```json
{
    "success": true,
    "data": {
        "requests": [
            {
                "requestId": "WCR_1705312200000_abc123def",
                "oldAddress": "0x1234567890abcdef...",
                "newAddress": "0xabcdef1234567890...",
                "reason": "Lost access to old wallet",
                "status": "pending",
                "requestedAt": "2024-01-15T10:30:00.000Z",
                "user": {
                    "id": "507f1f77bcf86cd799439011",
                    "name": "John Doe",
                    "email": "john@example.com",
                    "phone": "+1234567890"
                }
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 8,
            "pages": 1
        },
        "summary": {
            "totalPending": 8
        }
    }
}
```

### 3. Process Wallet Change Request
**POST** `/admin/process-wallet-change/:requestId`

Approve or reject a wallet change request.

**Headers:**
```
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
    "action": "approve",
    "adminNotes": "Approved after verification"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Wallet change request approved successfully",
    "data": {
        "requestId": "WCR_1705312200000_abc123def",
        "action": "approve",
        "status": "approved",
        "adminNotes": "Approved after verification",
        "processedAt": "2024-01-15T11:00:00.000Z",
        "user": {
            "id": "507f1f77bcf86cd799439011",
            "name": "John Doe",
            "email": "john@example.com"
        },
        "walletInfo": {
            "address": "0xabcdef1234567890...",
            "qrCode": "uploads/qr-new-1234567890.png",
            "isVerified": true,
            "lastUpdated": "2024-01-15T11:00:00.000Z"
        }
    }
}
```

### 4. Get Wallet Change Request Details
**GET** `/admin/wallet-change-details/:requestId`

Get detailed information about a specific wallet change request.

**Response:**
```json
{
    "success": true,
    "data": {
        "request": {
            "requestId": "WCR_1705312200000_abc123def",
            "oldAddress": "0x1234567890abcdef...",
            "newAddress": "0xabcdef1234567890...",
            "oldQrCode": "uploads/qr-old-1234567890.png",
            "newQrCode": "uploads/qr-new-1234567890.png",
            "reason": "Lost access to old wallet",
            "status": "pending",
            "requestedAt": "2024-01-15T10:30:00.000Z",
            "user": {
                "id": "507f1f77bcf86cd799439011",
                "name": "John Doe",
                "email": "john@example.com",
                "phone": "+1234567890"
            }
        },
        "currentWalletInfo": {
            "address": "0x1234567890abcdef...",
            "qrCode": "uploads/qr-old-1234567890.png",
            "isVerified": true,
            "lastUpdated": "2024-01-10T09:00:00.000Z"
        }
    }
}
```

### 5. Bulk Process Wallet Changes
**POST** `/admin/bulk-process-wallet-changes`

Process multiple wallet change requests at once.

**Headers:**
```
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
    "requests": [
        {
            "requestId": "WCR_1705312200000_abc123def",
            "action": "approve",
            "adminNotes": "Approved"
        },
        {
            "requestId": "WCR_1705312300000_def456ghi",
            "action": "reject",
            "adminNotes": "Invalid wallet address"
        }
    ]
}
```

**Response:**
```json
{
    "success": true,
    "message": "Bulk processing completed",
    "data": {
        "processed": 2,
        "errors": 0,
        "details": [
            {
                "requestId": "WCR_1705312200000_abc123def",
                "status": "success",
                "action": "approve"
            },
            {
                "requestId": "WCR_1705312300000_def456ghi",
                "status": "success",
                "action": "reject"
            }
        ]
    }
}
```

## Updated Withdrawal API

### Withdrawal Request (Updated)
**POST** `/withdrawal/request`

Now uses the user's verified wallet information automatically.

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
    "amount": 100
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
        "status": "pending",
        "createdAt": "2024-01-15T10:30:00.000Z"
    }
}
```

## Error Responses

### Wallet Not Set
```json
{
    "success": false,
    "message": "Wallet information not set. Please set your wallet address and QR code first."
}
```

### Wallet Not Verified
```json
{
    "success": false,
    "message": "Wallet information not verified. Please contact admin for verification. Note: First-time wallet setup should be automatically verified."
}
```

### Pending Request Exists
```json
{
    "success": false,
    "message": "You already have a pending wallet change request",
    "data": {
        "requestId": "WCR_1705312200000_abc123def",
        "requestedAt": "2024-01-15T10:30:00.000Z"
    }
}
```

## Workflow

### For Users:
1. **First Time**: Set wallet address and QR code using `/users/set-wallet-info` (automatically approved and verified)
2. **Withdrawals**: Can immediately request withdrawals (uses verified wallet)
3. **Changes**: Request changes through `/users/request-wallet-change` (requires admin approval)
4. **Track Status**: Monitor request status through provided APIs

### For Admins:
1. **Review Requests**: View pending wallet change requests
2. **Process Requests**: Approve or reject with notes
3. **Bulk Processing**: Handle multiple requests efficiently
4. **Monitor Changes**: Track wallet information changes for security

## Security Features

- ✅ Automatic approval for first-time wallet setup
- ✅ Admin approval required for wallet changes
- ✅ QR code image validation
- ✅ Request tracking and audit trail
- ✅ Bulk processing with error handling
- ✅ Verification status tracking
- ✅ Automatic wallet address usage in withdrawals 