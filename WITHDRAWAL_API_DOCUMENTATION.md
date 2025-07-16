# Withdrawal API Documentation

This document describes the Withdrawal API endpoints for the MLM platform. Users can request withdrawals from their normal wallet balance, and admins can approve or reject these requests.

## Base URL
```
http://localhost:3000/withdrawal
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## User Endpoints

### 1. Request Withdrawal
**POST** `/request`

Submit a withdrawal request from the user's normal wallet balance.

**Request Body:**
```json
{
    "amount": 1000,
    "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
}
```

**Response (201 Created):**
```json
{
    "success": true,
    "message": "Withdrawal request submitted successfully",
    "data": {
        "requestId": "64f8a1b2c3d4e5f678901234",
        "amount": 1000,
        "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
        "status": "pending",
        "createdAt": "2024-01-15T10:30:00.000Z"
    }
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields or invalid amount
- `400 Bad Request`: Insufficient balance
- `403 Forbidden`: Account is blocked
- `404 Not Found`: User not found

### 2. Get My Withdrawal Requests
**GET** `/my-requests`

Get all withdrawal requests for the authenticated user.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (pending, approved, rejected)

**Response:**
```json
{
    "success": true,
    "data": {
        "requests": [
            {
                "_id": "64f8a1b2c3d4e5f678901234",
                "userId": "64f8a1b2c3d4e5f678901235",
                "userEmail": "user@example.com",
                "userName": "John Doe",
                "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
                "amount": 1000,
                "walletType": "normal",
                "status": "pending",
                "adminId": null,
                "adminName": null,
                "approvedAt": null,
                "rejectedAt": null,
                "rejectionReason": null,
                "transactionHash": null,
                "notes": null,
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

---

## Admin Endpoints

### 3. Get All Withdrawal Requests
**GET** `/all-requests`

Get all withdrawal requests (admin only).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (pending, approved, rejected)

**Response:**
```json
{
    "success": true,
    "data": {
        "requests": [
            {
                "_id": "64f8a1b2c3d4e5f678901234",
                "userId": {
                    "_id": "64f8a1b2c3d4e5f678901235",
                    "name": "John Doe",
                    "email": "user@example.com",
                    "phone": "+1234567890"
                },
                "userEmail": "user@example.com",
                "userName": "John Doe",
                "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
                "amount": 1000,
                "walletType": "normal",
                "status": "pending",
                "adminId": null,
                "adminName": null,
                "approvedAt": null,
                "rejectedAt": null,
                "rejectionReason": null,
                "transactionHash": null,
                "notes": null,
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

### 4. Approve Withdrawal Request
**PUT** ``-

Approve a withdrawal request (admin only).

**Request Body:**
```json
{
    "transactionHash": "0x1234567890abcdef...",
    "notes": "Payment processed successfully"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Withdrawal request approved successfully",
    "data": {
        "requestId": "64f8a1b2c3d4e5f678901234",
        "status": "approved",
        "approvedAt": "2024-01-15T11:00:00.000Z",
        "adminName": "Admin User"
    }
}
```

**Error Responses:**
- `403 Forbidden`: Access denied (non-admin)
- `404 Not Found`: Request not found
- `400 Bad Request`: Request already processed

### 5. Reject Withdrawal Request
**PUT** `/reject/:requestId`

Reject a withdrawal request (admin only).

**Request Body:**
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
        "requestId": "64f8a1b2c3d4e5f678901234",
        "status": "rejected",
        "rejectedAt": "2024-01-15T11:00:00.000Z",
        "rejectionReason": "Invalid wallet address provided",
        "adminName": "Admin User"
    }
}
```

**Error Responses:**
- `403 Forbidden`: Access denied (non-admin)
- `400 Bad Request`: Rejection reason required
- `404 Not Found`: Request not found
- `400 Bad Request`: Request already processed

### 6. Get Withdrawal Statistics
**GET** `/statistics`

Get withdrawal statistics (admin only).

**Response:**
```json
{
    "success": true,
    "data": {
        "totalRequests": 50,
        "pendingRequests": 10,
        "approvedRequests": 35,
        "rejectedRequests": 5,
        "totalAmount": 50000,
        "pendingAmount": 10000,
        "approvedAmount": 35000
    }
}
```

---

## Withdrawal Request Status

- **pending**: Request submitted, waiting for admin approval
- **approved**: Request approved by admin, payment processed
- **rejected**: Request rejected by admin, amount refunded to wallet

---

## Wallet Integration

When a withdrawal request is submitted:
1. Amount is deducted from user's normal wallet balance
2. Transaction is recorded in wallet history with 'pending' status
3. If approved: Transaction status changes to 'approved'
4. If rejected: Amount is refunded to wallet, transaction status changes to 'rejected'

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid input or insufficient balance |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Access denied or account blocked |
| 404 | Not Found - User or request not found |
| 500 | Internal Server Error |

---

## Example Usage

### User requesting withdrawal:
```bash
curl -X POST http://localhost:3000/withdrawal/request \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
  }'
```

### Admin approving withdrawal:
```bash
curl -X PUT http://localhost:3000/withdrawal/approve/64f8a1b2c3d4e5f678901234 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionHash": "0x1234567890abcdef...",
    "notes": "Payment processed successfully"
  }'
```

### Admin rejecting withdrawal:
```bash
curl -X PUT http://localhost:3000/withdrawal/reject/64f8a1b2c3d4e5f678901234 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "rejectionReason": "Invalid wallet address provided"
  }'
```

---

## Admin Dashboard Integration

### Admin Withdrawal Management Workflow

#### 1. **View Pending Requests**
Admins should regularly check for new withdrawal requests:
```bash
GET /withdrawal/all-requests?status=pending
```

#### 2. **Review Request Details**
For each pending request, verify:
- User information (name, email, phone)
- Wallet address format and validity
- Requested amount
- User's current wallet balance
- User's account status (not blocked)

#### 3. **Approve Request Process**
When approving a withdrawal:

1. **Verify Payment Processing**: Ensure the payment has been sent to the user's wallet address
2. **Record Transaction Hash**: Add the blockchain transaction hash for tracking
3. **Add Notes**: Include any relevant information about the payment
4. **Update Status**: Mark the request as approved

**Example Approval:**
```bash
curl -X PUT http://localhost:3000/withdrawal/approve/64f8a1b2c3d4e5f678901234 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "notes": "Payment processed via Binance Smart Chain. Gas fee: 0.001 BNB"
  }'
```

#### 4. **Reject Request Process**
When rejecting a withdrawal:

1. **Provide Clear Reason**: Explain why the request is being rejected
2. **Verify Refund**: Ensure the amount is automatically refunded to user's wallet
3. **Update Status**: Mark the request as rejected

**Example Rejection:**
```bash
curl -X PUT http://localhost:3000/withdrawal/reject/64f8a1b2c3d4e5f678901234 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "rejectionReason": "Invalid wallet address format. Please provide a valid Ethereum/BSC address."
  }'
```

### Admin Dashboard Features

#### **Withdrawal Statistics Dashboard**
```bash
GET /withdrawal/statistics
```

**Dashboard Metrics:**
- Total withdrawal requests
- Pending requests count
- Approved requests count
- Rejected requests count
- Total amount requested
- Pending amount
- Approved amount

#### **Filtering and Search**
```bash
# Get only pending requests
GET /withdrawal/all-requests?status=pending

# Get requests from specific user
GET /withdrawal/all-requests?userId=64f8a1b2c3d4e5f678901235

# Pagination
GET /withdrawal/all-requests?page=1&limit=20
```

### Admin Approval Guidelines

#### **Before Approving:**
1. ✅ Verify user's identity and account status
2. ✅ Confirm wallet address is valid and belongs to the user
3. ✅ Ensure payment has been processed to the correct address
4. ✅ Record the blockchain transaction hash
5. ✅ Add relevant notes for future reference

#### **Before Rejecting:**
1. ✅ Provide clear and specific rejection reason
2. ✅ Ensure the reason is communicated to the user
3. ✅ Verify the refund process is automatic
4. ✅ Document the rejection for audit purposes

#### **Common Rejection Reasons:**
- Invalid wallet address format
- Wallet address doesn't match user's registered address
- Insufficient funds in admin wallet for payment
- User account under investigation
- Payment processing error
- Duplicate request

### Admin API Response Examples

#### **Successful Approval Response:**
```json
{
    "success": true,
    "message": "Withdrawal request approved successfully",
    "data": {
        "requestId": "64f8a1b2c3d4e5f678901234",
        "status": "approved",
        "approvedAt": "2024-01-15T11:00:00.000Z",
        "adminName": "Admin User",
        "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "notes": "Payment processed via Binance Smart Chain"
    }
}
```

#### **Successful Rejection Response:**
```json
{
    "success": true,
    "message": "Withdrawal request rejected successfully",
    "data": {
        "requestId": "64f8a1b2c3d4e5f678901234",
        "status": "rejected",
        "rejectedAt": "2024-01-15T11:00:00.000Z",
        "rejectionReason": "Invalid wallet address format",
        "adminName": "Admin User",
        "refundedAmount": 1000
    }
}
```

### Admin Security Considerations

1. **Authentication**: Only admin users can access approval/rejection endpoints
2. **Audit Trail**: All admin actions are logged with admin ID and timestamp
3. **Validation**: System validates request status before processing
4. **Refund Safety**: Automatic refund ensures no funds are lost
5. **Transaction Tracking**: All blockchain transactions are recorded

### Admin Dashboard UI Recommendations

#### **Withdrawal Management Interface:**
- **Pending Requests Tab**: Show all pending requests with user details
- **Approved Requests Tab**: Show approved requests with transaction details
- **Rejected Requests Tab**: Show rejected requests with reasons
- **Statistics Panel**: Display real-time withdrawal statistics
- **Bulk Actions**: Option to approve/reject multiple requests
- **Search & Filter**: Advanced filtering by user, amount, date, status
- **Export Functionality**: Export withdrawal data for accounting

#### **Request Details Modal:**
- User information (name, email, phone, registration date)
- Wallet address with copy functionality
- Request amount and timestamp
- User's current wallet balances
- Admin action buttons (Approve/Reject)
- Transaction hash input field
- Notes/Reason input field

## Notes

1. **Wallet Address Validation**: The API accepts any wallet address format. Consider adding validation for specific blockchain addresses if needed.

2. **Transaction Hash**: Optional field for admins to record blockchain transaction hash when processing payments.

3. **Refund Process**: When a withdrawal is rejected, the amount is automatically refunded to the user's normal wallet balance.

4. **Security**: Only admins can approve/reject requests. Users can only view their own requests.

5. **Balance Check**: The system ensures users cannot withdraw more than their available balance.

6. **Account Status**: Blocked users cannot submit withdrawal requests.

7. **Admin Workflow**: Admins should follow a systematic approval process to ensure security and accuracy.

8. **Audit Trail**: All admin actions are logged for security and compliance purposes. 