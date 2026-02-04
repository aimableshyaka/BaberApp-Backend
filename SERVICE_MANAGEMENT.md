# Service Management Module Guide

## Overview

This module handles salon services offered to customers. It provides functionality for salon owners to create, update, and manage their services.

## Features

### 3.1 Service Creation

- Create new services with name, description, price, and duration
- Services are linked to a specific salon
- Automatic timestamp tracking

### 3.2 Service Update

- Edit service details (name, description)
- Update pricing
- Update service duration
- All changes are tracked with updated timestamps

### 3.3 Service Deletion

- Soft delete implementation (data is preserved but marked as deleted)
- Deleted services don't appear in regular queries
- Admin can view deleted services for audit purposes

## Service Model Fields

```json
{
  "_id": "MongoDB ObjectId",
  "salonId": "Reference to Salon",
  "name": "String - Service name",
  "description": "String - Service description",
  "price": "Number - Service price (≥ 0)",
  "duration": "Number - Service duration in minutes (≥ 1)",
  "isDeleted": "Boolean - Soft delete flag (default: false)",
  "createdAt": "Date - Creation timestamp",
  "updatedAt": "Date - Last update timestamp"
}
```

## API Endpoints

All endpoints require authentication with `Authorization: Bearer <token>` header.

### 1. Create Service

**POST** `/api/service/:salonId`

**Body:**

```json
{
  "name": "Haircut",
  "description": "Professional haircut with styling",
  "price": 25.99,
  "duration": 45
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Service created successfully",
  "service": {
    "_id": "507f1f77bcf86cd799439011",
    "salonId": "507f1f77bcf86cd799439012",
    "name": "Haircut",
    "description": "Professional haircut with styling",
    "price": 25.99,
    "duration": 45,
    "isDeleted": false,
    "createdAt": "2026-02-04T10:30:00.000Z",
    "updatedAt": "2026-02-04T10:30:00.000Z"
  }
}
```

---

### 2. Get All Active Services for a Salon

**GET** `/api/service/:salonId`

**Response (200 OK):**

```json
{
  "success": true,
  "count": 5,
  "services": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "salonId": "507f1f77bcf86cd799439012",
      "name": "Haircut",
      "description": "Professional haircut with styling",
      "price": 25.99,
      "duration": 45,
      "isDeleted": false,
      "createdAt": "2026-02-04T10:30:00.000Z",
      "updatedAt": "2026-02-04T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "salonId": "507f1f77bcf86cd799439012",
      "name": "Hair Coloring",
      "description": "Professional hair coloring service",
      "price": 45.0,
      "duration": 90,
      "isDeleted": false,
      "createdAt": "2026-02-04T10:35:00.000Z",
      "updatedAt": "2026-02-04T10:35:00.000Z"
    }
  ]
}
```

---

### 3. Get All Services (Including Deleted)

**GET** `/api/service/:salonId/all`

**Response (200 OK):**

```json
{
  "success": true,
  "count": 6,
  "activeCount": 5,
  "deletedCount": 1,
  "services": [
    // Active and deleted services
  ]
}
```

---

### 4. Get Specific Service

**GET** `/api/service/:salonId/:serviceId`

**Response (200 OK):**

```json
{
  "success": true,
  "service": {
    "_id": "507f1f77bcf86cd799439011",
    "salonId": "507f1f77bcf86cd799439012",
    "name": "Haircut",
    "description": "Professional haircut with styling",
    "price": 25.99,
    "duration": 45,
    "isDeleted": false,
    "createdAt": "2026-02-04T10:30:00.000Z",
    "updatedAt": "2026-02-04T10:30:00.000Z"
  }
}
```

---

### 5. Update Service

**PUT** `/api/service/:salonId/:serviceId`

**Body (any or all fields):**

```json
{
  "name": "Premium Haircut",
  "description": "Professional haircut with premium styling",
  "price": 35.99,
  "duration": 60
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Service updated successfully",
  "service": {
    "_id": "507f1f77bcf86cd799439011",
    "salonId": "507f1f77bcf86cd799439012",
    "name": "Premium Haircut",
    "description": "Professional haircut with premium styling",
    "price": 35.99,
    "duration": 60,
    "isDeleted": false,
    "createdAt": "2026-02-04T10:30:00.000Z",
    "updatedAt": "2026-02-04T11:00:00.000Z"
  }
}
```

---

### 6. Delete Service (Soft Delete)

**DELETE** `/api/service/:salonId/:serviceId`

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Service deleted successfully"
}
```

---

## Testing in Postman

### Prerequisites

1. Have a salon created with ID
2. Have a valid JWT token from login

### Step-by-Step Testing

**1. Create a Service:**

- Method: POST
- URL: `http://localhost:3000/api/service/YOUR_SALON_ID`
- Headers: `Authorization: Bearer YOUR_JWT_TOKEN`
- Body:

```json
{
  "name": "Haircut",
  "description": "Professional haircut",
  "price": 25.99,
  "duration": 45
}
```

**2. Get All Services:**

- Method: GET
- URL: `http://localhost:3000/api/service/YOUR_SALON_ID`
- Headers: `Authorization: Bearer YOUR_JWT_TOKEN`

**3. Update Service:**

- Method: PUT
- URL: `http://localhost:3000/api/service/YOUR_SALON_ID/SERVICE_ID`
- Headers: `Authorization: Bearer YOUR_JWT_TOKEN`
- Body:

```json
{
  "price": 35.99,
  "duration": 60
}
```

**4. Delete Service:**

- Method: DELETE
- URL: `http://localhost:3000/api/service/YOUR_SALON_ID/SERVICE_ID`
- Headers: `Authorization: Bearer YOUR_JWT_TOKEN`

---

## Error Responses

### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### 400 Bad Request

```json
{
  "error": "All fields are required (name, description, price, duration)"
}
```

### 404 Not Found

```json
{
  "error": "Salon not found or you don't have permission"
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to create service"
}
```

---

## Soft Delete Behavior

- When you delete a service, `isDeleted` flag is set to `true`
- Deleted services don't appear in regular GET requests
- Use `GET /api/service/:salonId/all` to see deleted services
- Data is preserved for audit purposes
- Can be used for analytics and historical records

---

## Validation Rules

| Field       | Rules                                       |
| ----------- | ------------------------------------------- |
| name        | Required, trimmed                           |
| description | Required, trimmed                           |
| price       | Required, must be ≥ 0                       |
| duration    | Required, must be ≥ 1 minute                |
| salonId     | Must exist and belong to authenticated user |

---

## Notes

- All prices are stored as numbers (not strings)
- Duration is in minutes
- Timestamps are automatically managed
- Service can only be managed by the salon owner
- Deleted services are permanently marked but data is retained
