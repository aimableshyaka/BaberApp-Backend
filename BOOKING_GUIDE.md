# Barber App - Booking System Documentation

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [API Endpoints](#api-endpoints)
4. [Booking Creation (4.3)](#booking-creation-43)
5. [Booking Management (4.4)](#booking-management-44)
6. [Booking Approval (4.5)](#booking-approval-45)
7. [Email Notifications](#email-notifications)
8. [Database Schema](#database-schema)
9. [Error Handling](#error-handling)
10. [Usage Examples](#usage-examples)

---

## Overview

The Booking System allows customers to book services at salons and enables salon owners to manage and approve bookings. The system includes:

- **Booking Creation**: Customers select a service, date, and time
- **Booking Management**: Customers can view, cancel, or reschedule bookings
- **Booking Approval**: Salon owners can approve or reject booking requests
- **Email Notifications**: Automated emails are sent to both customers and salon owners

### Key Features

- Real-time availability checking to prevent double bookings
- Automatic email notifications for all booking status changes
- Permission-based access control for customers and salon owners
- Soft cancellation with audit trails

---

## System Architecture

### Models

#### Booking Model

```typescript
{
  userId: ObjectId,           // Reference to Customer
  salonId: ObjectId,          // Reference to Salon
  serviceId: ObjectId,        // Reference to Service
  bookingDate: Date,          // Date of booking
  startTime: String,          // Format: "HH:MM"
  endTime: String,            // Format: "HH:MM"
  status: BookingStatus,      // pending | confirmed | cancelled | completed
  notes: String,              // Optional customer notes
  createdAt: Date,
  updatedAt: Date
}
```

### Booking Status Flow

```
PENDING → CONFIRMED → COMPLETED
   ↓
CANCELLED
```

- **PENDING**: Initial state after booking creation, awaiting salon owner approval
- **CONFIRMED**: Booking approved by salon owner
- **COMPLETED**: Service has been completed
- **CANCELLED**: Booking cancelled by customer or rejected by salon owner

---

## API Endpoints

### Base URL

```
http://localhost:3000/api/booking
```

### Authentication

All endpoints require JWT authentication via `Authorization` header:

```
Authorization: Bearer <token>
```

---

## Booking Creation (4.3)

### 1. Create Booking (Customer)

**Endpoint**: `POST /api/booking`

**Authentication**: Required (Customer)

**Request Body**:

```json
{
  "salonId": "salon_id",
  "serviceId": "service_id",
  "bookingDate": "2024-02-20",
  "startTime": "10:30",
  "notes": "Optional notes or preferences"
}
```

**Response (Success)**:

```json
{
  "success": true,
  "message": "Booking created successfully. Awaiting salon owner approval.",
  "booking": {
    "id": "booking_id",
    "salonId": "salon_id",
    "serviceId": "service_id",
    "bookingDate": "2024-02-20T00:00:00.000Z",
    "startTime": "10:30",
    "endTime": "11:00",
    "status": "pending"
  }
}
```

**Response (Error)**:

```json
{
  "error": "Time slot is already booked"
}
```

**Validation Rules**:

- All fields (salonId, serviceId, bookingDate, startTime) are required
- Booking date must be in the future
- Service must exist and belong to the specified salon
- No overlapping bookings for the same salon
- End time is automatically calculated based on service duration

**Emails Sent**:

- ✉️ Customer: Booking confirmation email
- ✉️ Salon Owner: New booking request notification

---

## Booking Management (4.4)

### 1. Get Booking History (Customer)

**Endpoint**: `GET /api/booking/customer/history`

**Authentication**: Required (Customer)

**Response**:

```json
{
  "success": true,
  "count": 5,
  "bookings": [
    {
      "_id": "booking_id",
      "salonId": {
        "_id": "salon_id",
        "salonName": "Premium Barber Shop",
        "location": "123 Main St",
        "phone": "555-1234",
        "email": "salon@example.com"
      },
      "serviceId": {
        "_id": "service_id",
        "name": "Haircut",
        "description": "Professional haircut",
        "price": 25,
        "duration": 30
      },
      "bookingDate": "2024-02-20T00:00:00.000Z",
      "startTime": "10:30",
      "endTime": "11:00",
      "status": "confirmed",
      "notes": "Optional notes"
    }
  ]
}
```

---

### 2. Cancel Booking (Customer)

**Endpoint**: `PUT /api/booking/:bookingId/cancel`

**Authentication**: Required (Customer who owns the booking)

**Response (Success)**:

```json
{
  "success": true,
  "message": "Booking cancelled successfully"
}
```

**Response (Error)**:

```json
{
  "error": "Cannot cancel completed booking"
}
```

**Cancellation Rules**:

- Customer must own the booking
- Cannot cancel already cancelled bookings
- Cannot cancel completed bookings
- Cancellation resets status to CANCELLED

**Emails Sent**:

- ✉️ Customer: Booking cancellation confirmation
- ✉️ Salon Owner: Booking cancellation notification

---

### 3. Reschedule Booking (Customer)

**Endpoint**: `PUT /api/booking/:bookingId/reschedule`

**Authentication**: Required (Customer who owns the booking)

**Request Body**:

```json
{
  "newBookingDate": "2024-02-22",
  "newStartTime": "14:00"
}
```

**Response (Success)**:

```json
{
  "success": true,
  "message": "Booking rescheduled successfully. Awaiting approval.",
  "booking": {
    "_id": "booking_id",
    "bookingDate": "2024-02-22T00:00:00.000Z",
    "startTime": "14:00",
    "endTime": "14:30",
    "status": "pending"
  }
}
```

**Reschedule Rules**:

- Customer must own the booking
- New date must be in the future
- No overlapping bookings at new time slot
- Booking status is reset to PENDING for re-approval
- Cannot reschedule cancelled or completed bookings

**Emails Sent**:

- ✉️ Customer: Reschedule confirmation email
- ✉️ Salon Owner: Rescheduled booking notification

---

## Booking Approval (4.5)

### 1. Get Salon Bookings (Salon Owner)

**Endpoint**: `GET /api/booking/salon/:salonId/bookings`

**Authentication**: Required (Salon owner)

**Response**:

```json
{
  "success": true,
  "count": 10,
  "summary": {
    "pending": 3,
    "confirmed": 5,
    "completed": 1,
    "cancelled": 1
  },
  "bookings": [
    {
      "_id": "booking_id",
      "userId": {
        "_id": "user_id",
        "firstname": "John",
        "email": "john@example.com"
      },
      "serviceId": {
        "_id": "service_id",
        "name": "Haircut",
        "price": 25,
        "duration": 30
      },
      "bookingDate": "2024-02-20T00:00:00.000Z",
      "startTime": "10:30",
      "endTime": "11:00",
      "status": "pending"
    }
  ]
}
```

---

### 2. Approve Booking (Salon Owner)

**Endpoint**: `PUT /api/booking/:bookingId/approve`

**Authentication**: Required (Salon owner)

**Response (Success)**:

```json
{
  "success": true,
  "message": "Booking approved successfully",
  "booking": {
    "_id": "booking_id",
    "status": "confirmed",
    "bookingDate": "2024-02-20T00:00:00.000Z",
    "startTime": "10:30"
  }
}
```

**Approval Rules**:

- Salon owner must own the salon
- Only PENDING bookings can be approved
- Status changes from PENDING to CONFIRMED

**Email Sent**:

- ✉️ Customer: Booking confirmation email with all details

---

### 3. Reject Booking (Salon Owner)

**Endpoint**: `PUT /api/booking/:bookingId/reject`

**Authentication**: Required (Salon owner)

**Request Body**:

```json
{
  "rejectionReason": "Service not available at requested time"
}
```

**Response (Success)**:

```json
{
  "success": true,
  "message": "Booking rejected successfully"
}
```

**Rejection Rules**:

- Salon owner must own the salon
- Only PENDING bookings can be rejected
- Status changes from PENDING to CANCELLED
- Optional rejection reason is included in email to customer

**Email Sent**:

- ✉️ Customer: Booking rejection notification with reason (if provided)

---

### 4. Get Booking Details

**Endpoint**: `GET /api/booking/:bookingId`

**Authentication**: Required (Customer or Salon owner)

**Response**:

```json
{
  "success": true,
  "booking": {
    "_id": "booking_id",
    "userId": {
      "_id": "user_id",
      "firstname": "John",
      "email": "john@example.com"
    },
    "salonId": {
      "_id": "salon_id",
      "salonName": "Premium Barber Shop",
      "location": "123 Main St",
      "phone": "555-1234",
      "email": "salon@example.com"
    },
    "serviceId": {
      "_id": "service_id",
      "name": "Haircut",
      "description": "Professional haircut",
      "price": 25,
      "duration": 30
    },
    "bookingDate": "2024-02-20T00:00:00.000Z",
    "startTime": "10:30",
    "endTime": "11:00",
    "status": "confirmed"
  }
}
```

**Permission Rules**:

- Customer can view their own bookings
- Salon owner can view bookings for their salons
- Unauthorized users receive 403 Forbidden

---

## Email Notifications

### Email Configuration

The system uses the existing email configuration in `sendEmail.ts`:

- **Service**: Gmail
- **Environment Variables**: EMAIL_USER, EMAIL_PASS
- **From Address**: Support <EMAIL_USER>

### Email Scenarios

#### 1. Booking Creation - Customer Email

**Subject**: "Booking Confirmation"

**Content**:

- Booking confirmation with pending approval status
- Full booking details (salon, service, date, time, duration, price)
- Notification about awaiting salon owner approval

#### 2. Booking Creation - Salon Owner Email

**Subject**: "New Booking Request"

**Content**:

- New booking request notification
- Customer name and service details
- Booking date and time
- Action required: approve or reject in dashboard

#### 3. Booking Approval - Customer Email

**Subject**: "Booking Confirmed"

**Content**:

- Confirmation that booking has been approved
- All booking details
- Salon contact information
- Thank you message

#### 4. Booking Rejection - Customer Email

**Subject**: "Booking Rejected"

**Content**:

- Rejection notification
- Reason for rejection (if provided)
- Encouragement to try another time slot
- Salon contact information

#### 5. Booking Cancellation - Customer Email

**Subject**: "Booking Cancelled"

**Content**:

- Cancellation confirmation
- Booking ID reference
- Contact salon for questions

#### 6. Booking Cancellation - Salon Owner Email

**Subject**: "Booking Cancelled"

**Content**:

- Notification of customer cancellation
- Booking ID reference
- Time slot is now available

#### 7. Booking Reschedule - Customer Email

**Subject**: "Booking Rescheduled"

**Content**:

- Reschedule confirmation
- Old booking details
- New booking details
- Notification about awaiting approval

---

## Database Schema

### Booking Collection

```
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  salonId: ObjectId (ref: Salon),
  serviceId: ObjectId (ref: Service),
  bookingDate: Date,
  startTime: String (HH:MM format),
  endTime: String (HH:MM format),
  status: String (enum: [pending, confirmed, cancelled, completed]),
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

For optimal performance, create these indexes:

```javascript
db.bookings.createIndex({ userId: 1, bookingDate: -1 });
db.bookings.createIndex({ salonId: 1, bookingDate: -1 });
db.bookings.createIndex({ salonId: 1, bookingDate: 1, startTime: 1 });
db.bookings.createIndex({ status: 1 });
```

---

## Error Handling

### Common Errors

| Status | Error Message                      | Cause                              |
| ------ | ---------------------------------- | ---------------------------------- |
| 400    | All fields are required            | Missing required fields            |
| 400    | Booking date must be in the future | Past date selected                 |
| 400    | Time slot is already booked        | Overlapping booking exists         |
| 401    | Unauthorized                       | Missing or invalid JWT token       |
| 403    | You don't have permission          | Unauthorized user trying to access |
| 404    | Salon not found                    | Invalid salon ID                   |
| 404    | Service not found                  | Invalid service ID                 |
| 404    | Booking not found                  | Invalid booking ID                 |
| 409    | Time slot is already booked        | Conflict with existing booking     |
| 500    | Failed to create booking           | Server error                       |

---

## Usage Examples

### Example 1: Complete Booking Flow

#### Step 1: Customer Creates Booking

```bash
curl -X POST http://localhost:3000/api/booking \
  -H "Authorization: Bearer <customer_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "salonId": "507f1f77bcf86cd799439011",
    "serviceId": "507f1f77bcf86cd799439012",
    "bookingDate": "2024-02-20",
    "startTime": "10:30",
    "notes": "Please use beard oil"
  }'
```

**Result**:

- Booking created with PENDING status
- ✉️ Customer receives confirmation email
- ✉️ Salon owner receives new booking request

#### Step 2: Salon Owner Approves Booking

```bash
curl -X PUT http://localhost:3000/api/booking/507f1f77bcf86cd799439013/approve \
  -H "Authorization: Bearer <owner_token>" \
  -H "Content-Type: application/json"
```

**Result**:

- Booking status changes to CONFIRMED
- ✉️ Customer receives approval email with full details

#### Step 3: Customer Views Booking History

```bash
curl -X GET http://localhost:3000/api/booking/customer/history \
  -H "Authorization: Bearer <customer_token>"
```

**Result**: Returns all bookings for the customer with their statuses

---

### Example 2: Reschedule Booking

#### Step 1: Customer Reschedules

```bash
curl -X PUT http://localhost:3000/api/booking/507f1f77bcf86cd799439013/reschedule \
  -H "Authorization: Bearer <customer_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "newBookingDate": "2024-02-22",
    "newStartTime": "14:00"
  }'
```

**Result**:

- Booking date and time updated
- Status reset to PENDING
- ✉️ Emails sent to customer and salon owner

---

### Example 3: Cancel Booking

```bash
curl -X PUT http://localhost:3000/api/booking/507f1f77bcf86cd799439013/cancel \
  -H "Authorization: Bearer <customer_token>" \
  -H "Content-Type: application/json"
```

**Result**:

- Booking status changed to CANCELLED
- ✉️ Emails sent to customer and salon owner

---

### Example 4: Reject Booking

```bash
curl -X PUT http://localhost:3000/api/booking/507f1f77bcf86cd799439013/reject \
  -H "Authorization: Bearer <owner_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "rejectionReason": "Stylist is unavailable at that time"
  }'
```

**Result**:

- Booking status changed to CANCELLED
- ✉️ Customer receives rejection email with reason

---

## Integration Checklist

- [x] Booking model created
- [x] Booking controller with all functions implemented
- [x] Booking routes configured
- [x] Routes integrated into app.ts
- [x] Email notifications integrated
- [x] Time slot conflict checking implemented
- [x] Permission-based access control implemented
- [x] Error handling implemented
- [x] Comprehensive documentation created

---

## Future Enhancements

1. **SMS Notifications**: Add SMS reminders for upcoming bookings
2. **Availability Calendar**: Display real-time availability for each service
3. **Waitlist**: Allow customers to join waitlist for fully booked slots
4. **Rating & Reviews**: Add post-completion booking ratings
5. **Payment Integration**: Process payments for bookings
6. **Google Calendar Sync**: Sync bookings with Google Calendar
7. **Automatic Reminders**: Send reminders 24 hours before appointment
8. **No-show Tracking**: Track and manage customer no-shows

---

## Support & Troubleshooting

### Issue: Email not sending

- Verify EMAIL_USER and EMAIL_PASS environment variables are set correctly
- Check Gmail app-specific password is being used (not regular password)
- Ensure "Less secure app access" is enabled in Gmail settings

### Issue: Time slot conflicts

- Check for overlapping bookings in the same time period
- Verify service duration is correctly set in service model
- Ensure booking times are in valid HH:MM format

### Issue: Permission denied errors

- Verify JWT token is valid and not expired
- Confirm user is authenticated
- Check user role matches required role for the operation

---

**Last Updated**: February 4, 2026
**Version**: 1.0
