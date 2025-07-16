# Lucky Draw API Documentation

## Overview

The Lucky Draw API provides a comprehensive system for creating, managing, and participating in lucky draws. It includes both admin and user functionalities for complete lucky draw management.

## Base URLs
```
Admin API: http://localhost:3100/admin-luckydraw
User API: http://localhost:3100/luckydraw
```

## Authentication
- **Admin endpoints**: Require admin authentication using JWT token
- **User endpoints**: Require user authentication using JWT token
```
Authorization: Bearer <token>
```

---

## Admin Lucky Draw API

### 1. Create Lucky Draw
**POST** `/admin-luckydraw/create`

**Description**: Create a new lucky draw with specified details.

**Body**:
```json
{
  "title": "Weekly Lucky Draw",
  "description": "Join our weekly lucky draw for a chance to win!",
  "amount": 10000,
  "maxParticipants": 100,
  "startDate": "2024-01-15T00:00:00.000Z",
  "endDate": "2024-01-27T00:00:00.000Z",
  "drawDate": "2024-01-28T00:00:00.000Z"
}
```

**Note**: Start date can be current date or future date. Past dates are not allowed.

**Response**:
```json
{
  "success": true,
  "message": "Lucky draw created successfully",
  "data": {
    "id": "lucky_draw_id",
    "title": "Weekly Lucky Draw",
    "description": "Join our weekly lucky draw for a chance to win!",
    "amount": 10000,
    "maxParticipants": 100,
    "currentParticipants": 0,
    "status": "active",
    "startDate": "2024-01-20T00:00:00.000Z",
    "endDate": "2024-01-27T00:00:00.000Z",
    "drawDate": "2024-01-28T00:00:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Get All Lucky Draws
**GET** `/admin-luckydraw/all`

**Query Parameters**:
- `status` (optional): Filter by status (active, completed, cancelled)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response**:
```json
{
  "success": true,
  "data": {
    "luckyDraws": [
      {
        "_id": "lucky_draw_id",
        "title": "Weekly Lucky Draw",
        "description": "Join our weekly lucky draw for a chance to win!",
        "amount": 10000,
        "maxParticipants": 100,
        "currentParticipants": 25,
        "status": "active",
        "startDate": "2024-01-20T00:00:00.000Z",
        "endDate": "2024-01-27T00:00:00.000Z",
        "drawDate": "2024-01-28T00:00:00.000Z",
        "createdBy": {
          "_id": "admin_id",
          "name": "Admin User",
          "email": "admin@example.com"
        },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  }
}
```

### 3. Get Lucky Draw by ID
**GET** `/admin-luckydraw/:luckyDrawId`

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "lucky_draw_id",
    "title": "Weekly Lucky Draw",
    "description": "Join our weekly lucky draw for a chance to win!",
    "amount": 10000,
    "maxParticipants": 100,
    "currentParticipants": 25,
    "status": "active",
    "startDate": "2024-01-20T00:00:00.000Z",
    "endDate": "2024-01-27T00:00:00.000Z",
    "drawDate": "2024-01-28T00:00:00.000Z",
    "participants": [
      {
        "userId": {
          "_id": "user_id",
          "name": "User Name",
          "email": "user@example.com",
          "phone": "1234567890"
        },
        "userName": "User Name",
        "userEmail": "user@example.com",
        "joinedAt": "2024-01-16T10:30:00.000Z",
        "isWinner": false,
        "hasClaimed": false
      }
    ],
    "winners": [],
    "createdBy": {
      "_id": "admin_id",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Update Lucky Draw
**PUT** `/admin-luckydraw/:luckyDrawId`

**Body**:
```json
{
  "title": "Updated Lucky Draw",
  "description": "Updated description",
  "amount": 15000,
  "maxParticipants": 150
}
```

**Response**:
```json
{
  "success": true,
  "message": "Lucky draw updated successfully",
  "data": {
    "_id": "lucky_draw_id",
    "title": "Updated Lucky Draw",
    "description": "Updated description",
    "amount": 15000,
    "maxParticipants": 150,
    "status": "active"
  }
}
```

### 5. Delete Lucky Draw
**DELETE** `/admin-luckydraw/:luckyDrawId`

**Response**:
```json
{
  "success": true,
  "message": "Lucky draw deleted successfully"
}
```

### 6. Add Users to Lucky Draw
**POST** `/admin-luckydraw/:luckyDrawId/add-users`

**Body**:
```json
{
  "userIds": ["user_id_1", "user_id_2", "user_id_3"]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Added 3 users to lucky draw",
  "data": {
    "addedUsers": [
      {
        "userId": "user_id_1",
        "name": "User 1",
        "email": "user1@example.com"
      }
    ],
    "failedUsers": [
      {
        "userId": "user_id_2",
        "name": "User 2",
        "email": "user2@example.com",
        "reason": "User already participated"
      }
    ],
    "currentParticipants": 26,
    "maxParticipants": 100
  }
}
```

### 7. Remove Users from Lucky Draw
**POST** `/admin-luckydraw/:luckyDrawId/remove-users`

**Body**:
```json
{
  "userIds": ["user_id_1", "user_id_2"]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Removed 2 users from lucky draw",
  "data": {
    "removedUsers": ["user_id_1", "user_id_2"],
    "failedUsers": [],
    "currentParticipants": 24,
    "maxParticipants": 100
  }
}
```

### 8. Draw Winners
**POST** `/admin-luckydraw/:luckyDrawId/draw-winners`

**Response**:
```json
{
  "success": true,
  "message": "Drew 3 winners successfully",
  "data": {
    "winners": [
      {
        "userId": "user_id_1",
        "userName": "Winner 1",
        "userEmail": "winner1@example.com",
        "amount": 3333.33,
        "hasClaimed": false
      }
    ],
    "totalPrize": 10000,
    "prizePerWinner": 3333.33,
    "totalParticipants": 25
  }
}
```

### 9. Get Lucky Draw Statistics
**GET** `/admin-luckydraw/:luckyDrawId/stats`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "lucky_draw_id",
    "title": "Weekly Lucky Draw",
    "status": "completed",
    "totalParticipants": 25,
    "maxParticipants": 100,
    "participationRate": 25,
    "totalWinners": 3,
    "totalPrize": 10000,
    "claimedPrizes": 2,
    "unclaimedPrizes": 1,
    "startDate": "2024-01-20T00:00:00.000Z",
    "endDate": "2024-01-27T00:00:00.000Z",
    "drawDate": "2024-01-28T00:00:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## User Lucky Draw API

### 1. Get All Lucky Draws
**GET** `/luckydraw/all`

**Description**: Get all lucky draws regardless of status (active, completed, cancelled).

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response**:
```json
{
  "success": true,
  "data": {
    "luckyDraws": [
      {
        "_id": "lucky_draw_id",
        "title": "Weekly Lucky Draw",
        "description": "Join our weekly lucky draw for a chance to win!",
        "amount": 10000,
        "maxParticipants": 100,
        "currentParticipants": 25,
        "status": "active",
        "startDate": "2024-01-15T00:00:00.000Z",
        "endDate": "2024-01-27T00:00:00.000Z",
        "drawDate": "2024-01-28T00:00:00.000Z",
        "userParticipation": {
          "isParticipant": false,
          "isWinner": false,
          "canJoin": true,
          "joinReason": "Can join"
        }
      },
      {
        "_id": "completed_draw_id",
        "title": "Completed Lucky Draw",
        "description": "This lucky draw has ended",
        "amount": 5000,
        "maxParticipants": 50,
        "currentParticipants": 30,
        "status": "completed",
        "startDate": "2024-01-01T00:00:00.000Z",
        "endDate": "2024-01-10T00:00:00.000Z",
        "drawDate": "2024-01-11T00:00:00.000Z",
        "userParticipation": {
          "isParticipant": true,
          "isWinner": true,
          "canJoin": false,
          "joinReason": "Lucky draw is completed"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 15,
      "itemsPerPage": 10
    }
  }
}
```

### 2. Get Active Lucky Draws Only
**GET** `/luckydraw/active`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response**:
```json
{
  "success": true,
  "data": {
    "luckyDraws": [
      {
        "_id": "lucky_draw_id",
        "title": "Weekly Lucky Draw",
        "description": "Join our weekly lucky draw for a chance to win!",
        "amount": 10000,
        "maxParticipants": 100,
        "currentParticipants": 25,
        "status": "active",
        "startDate": "2024-01-20T00:00:00.000Z",
        "endDate": "2024-01-27T00:00:00.000Z",
        "drawDate": "2024-01-28T00:00:00.000Z",
        "userParticipation": {
          "isParticipant": false,
          "isWinner": false,
          "canJoin": true
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 15,
      "itemsPerPage": 10
    }
  }
}
```

### 3. Get Lucky Draw Details
**GET** `/luckydraw/:luckyDrawId`

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "lucky_draw_id",
    "title": "Weekly Lucky Draw",
    "description": "Join our weekly lucky draw for a chance to win!",
    "amount": 10000,
    "maxParticipants": 100,
    "currentParticipants": 25,
    "status": "active",
    "startDate": "2024-01-20T00:00:00.000Z",
    "endDate": "2024-01-27T00:00:00.000Z",
    "drawDate": "2024-01-28T00:00:00.000Z",
    "participants": [
      {
        "userId": {
          "_id": "user_id",
          "name": "User Name",
          "email": "user@example.com",
          "phone": "1234567890"
        },
        "userName": "User Name",
        "userEmail": "user@example.com",
        "joinedAt": "2024-01-16T10:30:00.000Z",
        "isWinner": false,
        "hasClaimed": false
      }
    ],
    "winners": [],
    "userParticipation": {
      "isParticipant": false,
      "isWinner": false,
      "canJoin": true,
      "canClaim": false,
      "joinReason": "User can join",
      "claimReason": "User is not a winner"
    }
  }
}
```

### 4. Join Lucky Draw
**POST** `/luckydraw/:luckyDrawId/join`

**Response**:
```json
{
  "success": true,
  "message": "Successfully joined lucky draw",
  "data": {
    "luckyDrawId": "lucky_draw_id",
    "title": "Weekly Lucky Draw",
    "currentParticipants": 26,
    "maxParticipants": 100,
    "joinedAt": "2024-01-16T10:30:00.000Z"
  }
}
```

### 5. Claim Prize
**POST** `/luckydraw/:luckyDrawId/claim`

**Response**:
```json
{
  "success": true,
  "message": "Prize claimed successfully",
  "data": {
    "luckyDrawId": "lucky_draw_id",
    "title": "Weekly Lucky Draw",
    "prizeAmount": 3333.33,
    "newBalance": 13333.33,
    "claimedAt": "2024-01-28T10:30:00.000Z"
  }
}
```

### 6. Get User's Lucky Draw History
**GET** `/luckydraw/my/history`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response**:
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "lucky_draw_id",
        "title": "Weekly Lucky Draw",
        "description": "Join our weekly lucky draw for a chance to win!",
        "amount": 10000,
        "status": "completed",
        "startDate": "2024-01-20T00:00:00.000Z",
        "endDate": "2024-01-27T00:00:00.000Z",
        "drawDate": "2024-01-28T00:00:00.000Z",
        "joinedAt": "2024-01-16T10:30:00.000Z",
        "isWinner": true,
        "prizeAmount": 3333.33,
        "hasClaimed": true,
        "claimedAt": "2024-01-28T10:30:00.000Z",
        "totalParticipants": 25,
        "maxParticipants": 100
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 5,
      "itemsPerPage": 10
    }
  }
}
```

### 7. Get User's Lucky Draw Statistics
**GET** `/luckydraw/my/stats`

**Response**:
```json
{
  "success": true,
  "data": {
    "totalParticipated": 10,
    "totalWon": 3,
    "totalPrizeAmount": 10000,
    "totalClaimed": 2,
    "totalUnclaimed": 1,
    "winRate": 30
  }
}
```

### 8. Get User's Unclaimed Prizes
**GET** `/luckydraw/my/unclaimed`

**Response**:
```json
{
  "success": true,
  "data": {
    "unclaimedPrizes": [
      {
        "luckyDrawId": "lucky_draw_id",
        "title": "Weekly Lucky Draw",
        "description": "Join our weekly lucky draw for a chance to win!",
        "prizeAmount": 3333.33,
        "drawDate": "2024-01-28T00:00:00.000Z",
        "canClaim": true
      }
    ],
    "totalUnclaimed": 1,
    "totalAmount": 3333.33
  }
}
```

---

## Lucky Draw Workflow

### Admin Workflow:
1. **Create Lucky Draw**: Admin creates a new lucky draw with details
2. **Add Users**: Admin adds users to the lucky draw
3. **Monitor Participation**: Track participant count and status
4. **Draw Winners**: Admin draws winners when draw date arrives
5. **Track Claims**: Monitor prize claims and statistics

### User Workflow:
1. **View Active Draws**: Users can see available lucky draws
2. **Join Draw**: Users can join active lucky draws
3. **Check Results**: Users can check if they won
4. **Claim Prize**: Winners can claim their prizes
5. **View History**: Users can view their participation history

---

## Features

### ✅ Admin Features
- **Create Lucky Draws**: Set title, description, amount, participants limit
- **Manage Participants**: Add/remove users from lucky draws
- **Draw Winners**: Random selection of winners
- **Track Statistics**: Monitor participation and claim rates
- **Update/Delete**: Modify lucky draws before they start

### ✅ User Features
- **View Active Draws**: See available lucky draws
- **Join Draws**: Participate in active lucky draws
- **Claim Prizes**: Claim won prizes to normal wallet
- **View History**: Complete participation history
- **Check Statistics**: Personal lucky draw statistics

### ✅ System Features
- **Date Validation**: Ensures proper timing for draws
- **Status Tracking**: Active, completed, cancelled states
- **Prize Distribution**: Automatic prize calculation
- **Wallet Integration**: Direct credit to normal wallet
- **Transaction History**: Complete audit trail

### ✅ Security Features
- **Authentication**: JWT-based access control
- **Role-based Access**: Admin vs user permissions
- **Validation**: Input validation and error handling
- **Status Checks**: Prevents invalid operations

---

## Error Responses

### Authentication Error
```json
{
  "success": false,
  "message": "Access denied. Authentication required."
}
```

### Lucky Draw Not Found
```json
{
  "success": false,
  "message": "Lucky draw not found"
}
```

### Already Participated
```json
{
  "success": false,
  "message": "User already participated"
}
```

### Cannot Join
```json
{
  "success": false,
  "message": "Lucky draw is not active"
}
```

### Cannot Claim
```json
{
  "success": false,
  "message": "User is not a winner"
}
```

---

## Usage Examples

### Admin: Create Lucky Draw
```bash
curl -X POST "http://localhost:3100/admin-luckydraw/create" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Weekly Lucky Draw",
    "description": "Join our weekly lucky draw for a chance to win!",
    "amount": 10000,
    "maxParticipants": 100,
    "startDate": "2024-01-20T00:00:00.000Z",
    "endDate": "2024-01-27T00:00:00.000Z",
    "drawDate": "2024-01-28T00:00:00.000Z"
  }'
```

### Admin: Add Users
```bash
curl -X POST "http://localhost:3100/admin-luckydraw/lucky_draw_id/add-users" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["user_id_1", "user_id_2", "user_id_3"]
  }'
```

### Admin: Draw Winners
```bash
curl -X POST "http://localhost:3100/admin-luckydraw/lucky_draw_id/draw-winners" \
  -H "Authorization: Bearer <admin-token>"
```

### User: Join Lucky Draw
```bash
curl -X POST "http://localhost:3100/luckydraw/lucky_draw_id/join" \
  -H "Authorization: Bearer <user-token>"
```

### User: Claim Prize
```bash
curl -X POST "http://localhost:3100/luckydraw/lucky_draw_id/claim" \
  -H "Authorization: Bearer <user-token>"
```

### User: Get All Lucky Draws
```bash
curl -X GET "http://localhost:3100/luckydraw/all" \
  -H "Authorization: Bearer <user-token>"
```

### User: Get Active Lucky Draws Only
```bash
curl -X GET "http://localhost:3100/luckydraw/active" \
  -H "Authorization: Bearer <user-token>"
```

---

## Integration Notes

### Database Requirements
- Lucky draw model with participants and winners tracking
- User model with wallet integration
- Transaction history for prize claims

### Wallet Integration
- Prizes are credited to user's normal wallet
- Transaction type: `lucky_draw_prize`
- Automatic balance updates

### Date Management
- Start date: When users can join (can be current date or future)
- End date: When joining closes
- Draw date: When winners are selected

### Prize Distribution
- Total prize amount divided among winners
- Up to 3 winners per lucky draw
- Equal distribution among winners

This comprehensive lucky draw system provides complete functionality for both admins and users, with proper validation, security, and wallet integration. 