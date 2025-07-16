# Chat/Support System API Documentation

## Overview
This document describes the API endpoints for the chat/support system that allows users to create support tickets and admins to manage them.

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

## User Chat Endpoints

### 1. Create Support Ticket
**POST** `/chat/create-ticket`

Create a new support ticket with initial message.

**Request Body:**
```json
{
  "subject": "Payment Issue",
  "category": "payment",
  "priority": "high",
  "message": "I'm having trouble with my payment"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Support ticket created successfully",
  "data": {
    "_id": "ticket_id",
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890"
    },
    "admin": null,
    "subject": "Payment Issue",
    "status": "open",
    "priority": "high",
    "category": "payment",
    "messages": [
      {
        "_id": "message_id",
        "sender": {
          "_id": "user_id",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "senderType": "user",
        "content": "I'm having trouble with my payment",
        "messageType": "text",
        "fileUrl": null,
        "isRead": false,
        "timestamp": "2024-01-15T10:30:00.000Z"
      }
    ],
    "lastMessage": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Get User's Tickets
**GET** `/chat/my-tickets`

Get all tickets created by the authenticated user.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (open, in_progress, resolved, closed)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "ticket_id",
      "user": {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890"
      },
      "admin": {
        "_id": "admin_id",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "subject": "Payment Issue",
      "status": "in_progress",
      "priority": "high",
      "category": "payment",
      "lastMessage": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 10
  }
}
```

### 3. Get Specific Ticket
**GET** `/chat/ticket/:ticketId`

Get detailed information about a specific ticket including all messages.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "ticket_id",
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890"
    },
    "admin": {
      "_id": "admin_id",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "subject": "Payment Issue",
    "status": "in_progress",
    "priority": "high",
    "category": "payment",
    "messages": [
      {
        "_id": "message_id_1",
        "sender": {
          "_id": "user_id",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "senderType": "user",
        "content": "I'm having trouble with my payment",
        "messageType": "text",
        "fileUrl": null,
        "isRead": true,
        "timestamp": "2024-01-15T10:30:00.000Z"
      },
      {
        "_id": "message_id_2",
        "sender": {
          "_id": "admin_id",
          "name": "Admin User",
          "email": "admin@example.com"
        },
        "senderType": "admin",
        "content": "I'll help you with that. Can you provide more details?",
        "messageType": "text",
        "fileUrl": null,
        "isRead": false,
        "timestamp": "2024-01-15T10:35:00.000Z"
      }
    ],
    "lastMessage": "2024-01-15T10:35:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

### 4. Send Message
**POST** `/chat/ticket/:ticketId/message`

Send a message to a specific ticket. Supports text and file uploads.

**Request Body (Form Data):**
```
message: "Thank you for your help"
messageType: "text" (optional, default: "text")
file: [file upload] (optional)
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "_id": "ticket_id",
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890"
    },
    "admin": {
      "_id": "admin_id",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "subject": "Payment Issue",
    "status": "in_progress",
    "priority": "high",
    "category": "payment",
    "messages": [
      // ... all messages including the new one
    ],
    "lastMessage": "2024-01-15T10:40:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:40:00.000Z"
  }
}
```

### 5. Close Ticket
**PUT** `/chat/ticket/:ticketId/close`

Close a support ticket.

**Response:**
```json
{
  "success": true,
  "message": "Ticket closed successfully",
  "data": {
    "_id": "ticket_id",
    "status": "closed",
    // ... other ticket data
  }
}
```

### 6. Get Unread Count
**GET** `/chat/unread-count`

Get the number of unread messages for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

---

## Admin Chat Endpoints

### 1. Get All Tickets (Admin)
**GET** `/admin-chat/tickets`

Get all support tickets with filtering and pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority
- `category` (optional): Filter by category
- `assignedTo` (optional): Filter by assigned admin

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "ticket_id",
      "user": {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890"
      },
      "admin": {
        "_id": "admin_id",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "subject": "Payment Issue",
      "status": "in_progress",
      "priority": "high",
      "category": "payment",
      "lastMessage": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "stats": {
    "open": 5,
    "in_progress": 3,
    "resolved": 10,
    "closed": 2,
    "total": 20
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 20,
    "itemsPerPage": 20
  }
}
```

### 2. Get Specific Ticket (Admin)
**GET** `/admin-chat/ticket/:ticketId`

Get detailed information about a specific ticket (admin view).

**Response:** Same as user endpoint but accessible to admins.

### 3. Assign Admin to Ticket
**PUT** `/admin-chat/ticket/:ticketId/assign`

Assign an admin to handle a ticket.

**Request Body:**
```json
{
  "adminId": "admin_user_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin assigned successfully",
  "data": {
    "_id": "ticket_id",
    "admin": {
      "_id": "admin_id",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "status": "in_progress",
    // ... other ticket data
  }
}
```

### 4. Send Message as Admin
**POST** `/admin-chat/ticket/:ticketId/message`

Send a message as admin to a ticket.

**Request Body (Form Data):**
```
message: "I'm looking into this issue"
messageType: "text" (optional, default: "text")
file: [file upload] (optional)
```

**Response:** Same as user message endpoint.

### 5. Update Ticket Status
**PUT** `/admin-chat/ticket/:ticketId/status`

Update the status of a ticket.

**Request Body:**
```json
{
  "status": "resolved"
}
```

**Valid Status Values:**
- `open`
- `in_progress`
- `resolved`
- `closed`

**Response:**
```json
{
  "success": true,
  "message": "Ticket status updated successfully",
  "data": {
    "_id": "ticket_id",
    "status": "resolved",
    // ... other ticket data
  }
}
```

### 6. Update Ticket Priority
**PUT** `/admin-chat/ticket/:ticketId/priority`

Update the priority of a ticket.

**Request Body:**
```json
{
  "priority": "urgent"
}
```

**Valid Priority Values:**
- `low`
- `medium`
- `high`
- `urgent`

**Response:**
```json
{
  "success": true,
  "message": "Ticket priority updated successfully",
  "data": {
    "_id": "ticket_id",
    "priority": "urgent",
    // ... other ticket data
  }
}
```

### 7. Get Admin Statistics
**GET** `/admin-chat/stats`

Get comprehensive statistics for the support system.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTickets": 50,
    "openTickets": 5,
    "inProgressTickets": 3,
    "resolvedTickets": 35,
    "closedTickets": 7,
    "priorityStats": [
      {
        "_id": "high",
        "count": 15
      },
      {
        "_id": "medium",
        "count": 25
      },
      {
        "_id": "low",
        "count": 10
      }
    ],
    "categoryStats": [
      {
        "_id": "payment",
        "count": 20
      },
      {
        "_id": "technical",
        "count": 15
      },
      {
        "_id": "general",
        "count": 15
      }
    ],
    "recentTickets": [
      {
        "_id": "ticket_id",
        "user": {
          "_id": "user_id",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "admin": {
          "_id": "admin_id",
          "name": "Admin User",
          "email": "admin@example.com"
        },
        "subject": "Payment Issue",
        "status": "in_progress",
        "lastMessage": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

### 8. Get Admins List
**GET** `/admin-chat/admins`

Get list of all admin users.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "admin_id_1",
      "name": "Admin User 1",
      "email": "admin1@example.com",
      "phone": "1234567890"
    },
    {
      "_id": "admin_id_2",
      "name": "Admin User 2",
      "email": "admin2@example.com",
      "phone": "0987654321"
    }
  ]
}
```

### 9. Get Unassigned Tickets
**GET** `/admin-chat/unassigned`

Get all tickets that haven't been assigned to an admin yet.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "ticket_id",
      "user": {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890"
      },
      "admin": null,
      "subject": "New Issue",
      "status": "open",
      "priority": "medium",
      "category": "general",
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

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Subject and message are required"
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
  "message": "Access denied"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Ticket not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to create support ticket",
  "error": "Error details"
}
```

---

## File Upload

The chat system supports file uploads for messages. Files are uploaded using multipart/form-data and stored in the `/uploads` directory.

**Supported File Types:**
- Images (jpg, jpeg, png, gif)
- Documents (pdf, doc, docx)
- Other files (txt, zip, etc.)

**File Size Limit:** 5MB

**File Upload Example:**
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "message=Please check this screenshot" \
  -F "messageType=image" \
  -F "file=@screenshot.png" \
  http://localhost:3000/chat/ticket/ticket_id/message
```

---

## Categories

Available ticket categories:
- `general` - General inquiries
- `technical` - Technical issues
- `payment` - Payment related issues
- `investment` - Investment questions
- `withdrawal` - Withdrawal issues
- `account` - Account management
- `other` - Other issues

---

## Priorities

Available ticket priorities:
- `low` - Low priority
- `medium` - Medium priority (default)
- `high` - High priority
- `urgent` - Urgent issues

---

## Status Values

Available ticket statuses:
- `open` - New ticket, not yet assigned
- `in_progress` - Assigned to admin, being worked on
- `resolved` - Issue resolved
- `closed` - Ticket closed

---

## Message Types

Available message types:
- `text` - Text message (default)
- `image` - Image file
- `file` - Other file types 