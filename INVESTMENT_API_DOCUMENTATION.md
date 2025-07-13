# Investment System API Documentation

## Overview
The investment system allows admins to create investment plans and users to purchase them. The system automatically calculates daily earnings and tracks investment progress.

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

## Admin Investment Management

### 1. Create Investment Plan
**POST** `/investment/admin/plans`
- **Description**: Create a new investment plan (Admin only)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Body** (multipart/form-data):
  ```
  title: "Gold Investment Plan"
  description: "High-yield investment with daily returns"
  investmentRequired: 1000
  dailyPercentage: 2.5
  durationDays: 30
  totalReturnPercentage: 75
  image: [file upload]
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Investment plan created successfully",
    "data": {
      "id": "plan_id",
      "title": "Gold Investment Plan",
      "description": "High-yield investment with daily returns",
      "image": "investment-1234567890.jpg",
      "investmentRequired": 1000,
      "dailyPercentage": 2.5,
      "durationDays": 30,
      "totalReturnPercentage": 75,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

### 2. Get All Investment Plans (Admin)
**GET** `/investment/admin/plans`
- **Description**: Get all investment plans (Admin only)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "plan_id",
        "title": "Gold Investment Plan",
        "description": "High-yield investment with daily returns",
        "image": "investment-1234567890.jpg",
        "investmentRequired": 1000,
        "dailyPercentage": 2.5,
        "durationDays": 30,
        "totalReturnPercentage": 75,
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
  ```

### 3. Update Investment Plan
**PUT** `/investment/admin/plans/:planId`
- **Description**: Update an investment plan (Admin only)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Body** (multipart/form-data, all fields optional):
  ```
  title: "Updated Plan Title"
  description: "Updated description"
  investmentRequired: 1500
  dailyPercentage: 3.0
  durationDays: 45
  totalReturnPercentage: 90
  image: [file upload] (optional)
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Investment plan updated successfully",
    "data": {
      "id": "plan_id",
      "title": "Updated Plan Title",
      "description": "Updated description",
      "image": "investment-1234567890.jpg",
      "investmentRequired": 1500,
      "dailyPercentage": 3.0,
      "durationDays": 45,
      "totalReturnPercentage": 90,
      "isActive": true,
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

### 4. Toggle Investment Plan Status
**PATCH** `/investment/admin/plans/:planId/toggle`
- **Description**: Activate/deactivate investment plan (Admin only)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Investment plan activated successfully",
    "data": {
      "id": "plan_id",
      "isActive": true
    }
  }
  ```

### 5. Delete Investment Plan
**DELETE** `/investment/admin/plans/:planId`
- **Description**: Delete investment plan (Admin only)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Investment plan deleted successfully"
  }
  ```

### 6. Get All User Investments (Admin)
**GET** `/investment/admin/investments`
- **Description**: View all user investments (Admin only)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "investment_id",
        "userId": {
          "id": "user_id",
          "name": "John Doe",
          "email": "john@example.com",
          "phone": "1234567890"
        },
        "planId": {
          "id": "plan_id",
          "title": "Gold Investment Plan"
        },
        "investmentAmount": 1000,
        "dailyEarning": 2.5,
        "totalEarned": 75,
        "startDate": "2024-01-01T00:00:00.000Z",
        "endDate": "2024-01-31T00:00:00.000Z",
        "isCompleted": false,
        "isWithdrawn": false,
        "remainingDays": 15,
        "totalReturnAmount": 1075
      }
    ]
  }
  ```

---

## User Investment Management

### 7. Get Active Investment Plans
**GET** `/investment/plans`
- **Description**: Get all active investment plans available for purchase
- **Headers**: `Authorization: Bearer <user-token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "plan_id",
        "title": "Gold Investment Plan",
        "description": "High-yield investment with daily returns",
        "image": "investment-1234567890.jpg",
        "investmentRequired": 1000,
        "dailyPercentage": 2.5,
        "durationDays": 30,
        "totalReturnPercentage": 75,
        "isActive": true
      }
    ]
  }
  ```

### 8. Purchase Investment Plan
**POST** `/investment/purchase`
- **Description**: Purchase an investment plan
- **Headers**: `Authorization: Bearer <user-token>`
- **Body**:
  ```json
  {
    "planId": "plan_id",
    "investmentAmount": 1000
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Investment purchased successfully",
    "data": {
      "investment": {
        "id": "investment_id",
        "userId": "user_id",
        "planId": "plan_id",
        "investmentAmount": 1000,
        "dailyEarning": 2.5,
        "totalEarned": 0,
        "startDate": "2024-01-01T00:00:00.000Z",
        "endDate": "2024-01-31T00:00:00.000Z",
        "isCompleted": false,
        "isWithdrawn": false
      },
      "plan": {
        "id": "plan_id",
        "title": "Gold Investment Plan",
        "durationDays": 30
      },
      "remainingBalance": 500
    }
  }
  ```

### 9. Get User's Investments
**GET** `/investment/my-investments`
- **Description**: Get all investments of the authenticated user
- **Headers**: `Authorization: Bearer <user-token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "investment_id",
        "planId": {
          "id": "plan_id",
          "title": "Gold Investment Plan",
          "description": "High-yield investment with daily returns",
          "image": "investment-1234567890.jpg"
        },
        "investmentAmount": 1000,
        "dailyEarning": 2.5,
        "totalEarned": 75,
        "startDate": "2024-01-01T00:00:00.000Z",
        "endDate": "2024-01-31T00:00:00.000Z",
        "isCompleted": false,
        "isWithdrawn": false,
        "remainingDays": 15,
        "totalReturnAmount": 1075,
        "dailyEarnings": [
          {
            "date": "2024-01-01T00:00:00.000Z",
            "amount": 25,
            "isClaimed": false
          }
        ]
      }
    ]
  }
  ```

### 10. Withdraw Completed Investment
**POST** `/investment/withdraw/:investmentId`
- **Description**: Withdraw a completed investment to normal wallet
- **Headers**: `Authorization: Bearer <user-token>`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Investment withdrawn successfully",
    "data": {
      "withdrawnAmount": 1075,
      "investmentAmount": 1000,
      "totalEarned": 75,
      "newBalance": 1575
    }
  }
  ```

### 11. Get Investment Details
**GET** `/investment/investment/:investmentId`
- **Description**: Get detailed information about a specific investment
- **Headers**: `Authorization: Bearer <user-token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "investment_id",
      "planId": {
        "id": "plan_id",
        "title": "Gold Investment Plan",
        "description": "High-yield investment with daily returns",
        "image": "investment-1234567890.jpg"
      },
      "investmentAmount": 1000,
      "dailyEarning": 2.5,
      "totalEarned": 75,
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T00:00:00.000Z",
      "isCompleted": false,
      "isWithdrawn": false,
      "remainingDays": 15,
      "totalReturnAmount": 1075,
      "dailyEarnings": [
        {
          "date": "2024-01-01T00:00:00.000Z",
          "amount": 25,
          "isClaimed": false
        }
      ]
    }
  }
  ```

---

## Investment System Features

### Daily Earnings Calculation
- Automatic daily earnings based on investment amount and daily percentage
- Earnings calculated daily and added to total earned amount
- No duplicate earnings for the same day

### Investment Progress Tracking
- Real-time calculation of remaining days
- Total earned amount tracking
- Investment completion status
- Withdrawal eligibility checking

### Investment Workflow
1. **Admin creates investment plan** with image, title, description, amount, percentage, duration
2. **User views available plans** and selects one to purchase
3. **System deducts amount** from user's normal wallet
4. **Daily earnings are calculated** and added automatically
5. **Investment completes** after duration period
6. **User can withdraw** completed investment to normal wallet

### Investment Error Handling

#### Insufficient Balance Error:
```json
{
  "success": false,
  "message": "Insufficient balance in normal wallet",
  "currentBalance": 500,
  "requiredAmount": 1000
}
```

#### Investment Not Completed Error:
```json
{
  "success": false,
  "message": "Investment is not yet completed",
  "remainingDays": 5
}
```

#### Already Withdrawn Error:
```json
{
  "success": false,
  "message": "Investment has already been withdrawn"
}
```

### Investment Best Practices

1. **Check Available Plans**: Use `/investment/plans` to view all active plans
2. **Verify Balance**: Ensure sufficient balance before purchasing
3. **Monitor Progress**: Use `/investment/my-investments` to track investment progress
4. **Withdraw Promptly**: Withdraw completed investments to avoid delays
5. **Track Earnings**: Monitor daily earnings and total returns

### Investment Plan Fields

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| title | String | Investment plan title | Yes |
| description | String | Detailed description | Yes |
| image | File | Plan image (max 5MB) | Yes |
| investmentRequired | Number | Minimum investment amount | Yes |
| dailyPercentage | Number | Daily earning percentage (0-100) | Yes |
| durationDays | Number | Investment duration in days | Yes |
| totalReturnPercentage | Number | Total return percentage | Yes |
| isActive | Boolean | Plan availability status | Auto |

### User Investment Fields

| Field | Type | Description |
|-------|------|-------------|
| userId | ObjectId | User who purchased the investment |
| planId | ObjectId | Reference to investment plan |
| investmentAmount | Number | Amount invested by user |
| dailyEarning | Number | Daily earning percentage |
| totalEarned | Number | Total earnings so far |
| startDate | Date | Investment start date |
| endDate | Date | Investment end date |
| isCompleted | Boolean | Investment completion status |
| isWithdrawn | Boolean | Withdrawal status |
| remainingDays | Virtual | Calculated remaining days |
| totalReturnAmount | Virtual | Calculated total return amount |

### Example Investment Scenarios

#### Scenario 1: 30-Day Investment
- **Investment Amount**: $1,000
- **Daily Percentage**: 2.5%
- **Duration**: 30 days
- **Daily Earnings**: $25 (1,000 × 2.5%)
- **Total Earnings**: $750 (25 × 30 days)
- **Total Return**: $1,750 (1,000 + 750)

#### Scenario 2: 60-Day Investment
- **Investment Amount**: $2,000
- **Daily Percentage**: 1.5%
- **Duration**: 60 days
- **Daily Earnings**: $30 (2,000 × 1.5%)
- **Total Earnings**: $1,800 (30 × 60 days)
- **Total Return**: $3,800 (2,000 + 1,800)

### Security Features
- **Admin-only plan creation**: Only admins can create/modify investment plans
- **Balance validation**: System checks sufficient balance before purchase
- **Investment ownership**: Users can only access their own investments
- **Completion validation**: Only completed investments can be withdrawn
- **Image validation**: Only image files accepted for plan images
- **File size limits**: Maximum 5MB for uploaded images

### Technical Implementation
- **Automatic daily earnings**: System calculates and adds earnings daily
- **Real-time progress tracking**: Virtual fields for remaining days and returns
- **Transaction logging**: All investment activities are logged
- **Error handling**: Comprehensive error messages for all scenarios
- **Data validation**: Input validation for all investment parameters 