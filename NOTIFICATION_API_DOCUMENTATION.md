# Notification System API Documentation

## Overview
This document describes the API endpoints for the notification system that allows admins to send notifications to users with customizable text content and colors.

## Base URL
```
http://localhost:3000
```

## Authentication
All endpoints require authentication using JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Admin Notification Endpoints

### 1. Send Notification
**POST** `/admin-notification/send`

Send a notification to users with customizable content and color.

**Request Body:**
```json
{
  "title": "System Maintenance",
  "content": "The system will be under maintenance from 2 AM to 4 AM today.",
  "color": "#ff6b6b",
  "type": "warning",
  "priority": "high",
  "targetUsers": "all",
  "specificUsers": [],
  "targetRole": "all",
  "expiresAt": "2024-01-20T23:59:59.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification sent to 150 users successfully",
  "data": {
    "_id": "notification_id",
    "title": "System Maintenance",
    "content": "The system will be under maintenance from 2 AM to 4 AM today.",
    "color": "#ff6b6b",
    "type": "warning",
    "priority": "high",
    "targetUsers": "all",
    "specificUsers": [],
    "targetRole": "all",
    "isActive": true,
    "expiresAt": "2024-01-20T23:59:59.000Z",
    "createdBy": {
      "_id": "admin_id",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "targetCount": 150
}
```

### 2. Get All Notifications (Admin)
**GET** `/admin-notification/notifications`

Get all notifications with filtering and pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `type` (optional): Filter by type (info, success, warning, error, custom)
- `priority` (optional): Filter by priority (low, medium, high, urgent)
- `isActive` (optional): Filter by active status (true/false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "notification_id",
      "title": "System Maintenance",
      "content": "The system will be under maintenance from 2 AM to 4 AM today.",
      "color": "#ff6b6b",
      "type": "warning",
      "priority": "high",
      "targetUsers": "all",
      "targetRole": "all",
      "isActive": true,
      "expiresAt": "2024-01-20T23:59:59.000Z",
      "createdBy": {
        "_id": "admin_id",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "stats": {
    "info": 5,
    "success": 3,
    "warning": 2,
    "error": 1,
    "custom": 0,
    "total": 11
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 11,
    "itemsPerPage": 20
  }
}
```

### 3. Get Specific Notification (Admin)
**GET** `/admin-notification/notification/:notificationId`

Get detailed information about a specific notification including user read statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "notification_id",
    "title": "System Maintenance",
    "content": "The system will be under maintenance from 2 AM to 4 AM today.",
    "color": "#ff6b6b",
    "type": "warning",
    "priority": "high",
    "targetUsers": "all",
    "targetRole": "all",
    "isActive": true,
    "expiresAt": "2024-01-20T23:59:59.000Z",
    "createdBy": {
      "_id": "admin_id",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "stats": {
      "totalUsers": 150,
      "readUsers": 89,
      "unreadUsers": 61
    },
    "userNotifications": [
      {
        "_id": "user_notification_id",
        "user": {
          "_id": "user_id",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "isRead": true,
        "readAt": "2024-01-15T10:35:00.000Z",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

### 4. Update Notification
**PUT** `/admin-notification/notification/:notificationId`

Update an existing notification.

**Request Body:**
```json
{
  "title": "Updated System Maintenance",
  "content": "The maintenance has been rescheduled to 3 AM to 5 AM.",
  "color": "#ff8c42",
  "type": "warning",
  "priority": "urgent",
  "isActive": true,
  "expiresAt": "2024-01-21T23:59:59.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification updated successfully",
  "data": {
    "_id": "notification_id",
    "title": "Updated System Maintenance",
    "content": "The maintenance has been rescheduled to 3 AM to 5 AM.",
    "color": "#ff8c42",
    "type": "warning",
    "priority": "urgent",
    "isActive": true,
    "expiresAt": "2024-01-21T23:59:59.000Z",
    "createdBy": {
      "_id": "admin_id",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### 5. Delete Notification
**DELETE** `/admin-notification/notification/:notificationId`

Delete a notification and remove it from all users.

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

### 6. Get Notification Statistics
**GET** `/admin-notification/stats`

Get comprehensive statistics for the notification system.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalNotifications": 25,
    "activeNotifications": 18,
    "expiredNotifications": 7,
    "typeStats": [
      {
        "_id": "info",
        "count": 10
      },
      {
        "_id": "success",
        "count": 8
      },
      {
        "_id": "warning",
        "count": 5
      },
      {
        "_id": "error",
        "count": 2
      }
    ],
    "priorityStats": [
      {
        "_id": "medium",
        "count": 15
      },
      {
        "_id": "high",
        "count": 8
      },
      {
        "_id": "urgent",
        "count": 2
      }
    ],
    "recentNotifications": [
      {
        "_id": "notification_id",
        "title": "System Maintenance",
        "type": "warning",
        "priority": "high",
        "createdBy": {
          "_id": "admin_id",
          "name": "Admin User",
          "email": "admin@example.com"
        },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

### 7. Get Users for Targeting
**GET** `/admin-notification/users`

Get list of users for targeting specific notifications.

**Query Parameters:**
- `role` (optional): Filter by role (user, admin, all)
- `search` (optional): Search by name or email

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "user_id_1",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "role": "user"
    },
    {
      "_id": "user_id_2",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "0987654321",
      "role": "user"
    }
  ]
}
```

---

## User Notification Endpoints

### 1. Get User's Notifications
**GET** `/notification/my-notifications`

Get all notifications for the authenticated user.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `isRead` (optional): Filter by read status (true/false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "user_notification_id",
      "notification": {
        "_id": "notification_id",
        "title": "System Maintenance",
        "content": "The system will be under maintenance from 2 AM to 4 AM today.",
        "color": "#ff6b6b",
        "type": "warning",
        "priority": "high",
        "createdBy": {
          "_id": "admin_id",
          "name": "Admin User",
          "email": "admin@example.com"
        },
        "createdAt": "2024-01-15T10:30:00.000Z"
      },
      "isRead": false,
      "readAt": null,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 5,
    "itemsPerPage": 20
  }
}
```

### 2. Get Unread Count
**GET** `/notification/unread-count`

Get the number of unread notifications for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "unreadCount": 3
  }
}
```

### 3. Mark Notification as Read
**PUT** `/notification/mark-read/:notificationId`

Mark a specific notification as read.

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### 4. Mark All Notifications as Read
**PUT** `/notification/mark-all-read`

Mark all notifications as read for the authenticated user.

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

### 5. Get Specific Notification
**GET** `/notification/notification/:notificationId`

Get detailed information about a specific notification.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_notification_id",
    "user": "user_id",
    "notification": {
      "_id": "notification_id",
      "title": "System Maintenance",
      "content": "The system will be under maintenance from 2 AM to 4 AM today.",
      "color": "#ff6b6b",
      "type": "warning",
      "priority": "high",
      "targetUsers": "all",
      "targetRole": "all",
      "isActive": true,
      "expiresAt": "2024-01-20T23:59:59.000Z",
      "createdBy": {
        "_id": "admin_id",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "isRead": false,
    "readAt": null,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 6. Delete User Notification
**DELETE** `/notification/notification/:notificationId`

Remove a notification from the user's notification list.

**Response:**
```json
{
  "success": true,
  "message": "Notification removed successfully"
}
```

### 7. Get Notification Preferences
**GET** `/notification/preferences`

Get user's notification preferences (placeholder for future implementation).

**Response:**
```json
{
  "success": true,
  "data": {
    "emailNotifications": true,
    "pushNotifications": true,
    "smsNotifications": false,
    "notificationTypes": ["info", "success", "warning", "error"]
  }
}
```

---

## Notification Types

Available notification types:
- `info` - Information notifications (blue)
- `success` - Success notifications (green)
- `warning` - Warning notifications (orange/yellow)
- `error` - Error notifications (red)
- `custom` - Custom notifications (custom color)

---

## Notification Priorities

Available notification priorities:
- `low` - Low priority
- `medium` - Medium priority (default)
- `high` - High priority
- `urgent` - Urgent priority

---

## Target Users Options

Available target user options:
- `all` - Send to all users
- `specific` - Send to specific users (requires specificUsers array)
- `role_based` - Send to users with specific role

---

## Color Examples

Common color values for notifications:
- `#007bff` - Blue (info)
- `#28a745` - Green (success)
- `#ffc107` - Yellow (warning)
- `#dc3545` - Red (error)
- `#6f42c1` - Purple (custom)
- `#fd7e14` - Orange (custom)
- `#20c997` - Teal (custom)

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Title and content are required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Admin access required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Notification not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to send notification",
  "error": "Error details"
}
```

---

## Usage Examples

### Send Notification to All Users
```bash
curl -X POST \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Welcome Message",
    "content": "Welcome to our platform! We hope you enjoy your experience.",
    "color": "#28a745",
    "type": "success",
    "priority": "medium",
    "targetUsers": "all"
  }' \
  http://localhost:3000/admin-notification/send
```

### Send Notification to Specific Users
```bash
curl -X POST \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Account Update",
    "content": "Your account has been successfully updated.",
    "color": "#007bff",
    "type": "info",
    "priority": "medium",
    "targetUsers": "specific",
    "specificUsers": ["user_id_1", "user_id_2"]
  }' \
  http://localhost:3000/admin-notification/send
```

### Get User's Notifications
```bash
curl -X GET \
  -H "Authorization: Bearer <user-token>" \
  http://localhost:3000/notification/my-notifications
```

### Mark Notification as Read
```bash
curl -X PUT \
  -H "Authorization: Bearer <user-token>" \
  http://localhost:3000/notification/mark-read/notification_id
``` 