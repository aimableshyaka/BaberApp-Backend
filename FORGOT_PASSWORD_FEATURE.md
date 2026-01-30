# Forgot Password Feature Documentation

## Overview

This document provides complete documentation for the Forgot Password feature implemented in the BaberApp Backend. This feature allows users to securely reset their passwords through an email-based verification process.

---

## Features Implemented

### 1. **Forgot Password Request**

- Users can request a password reset by providing their email
- A secure reset token is generated and sent to the user's email
- Token expires after 1 hour for security
- Security: Returns success message even if email doesn't exist (prevents email enumeration attacks)

### 2. **Password Reset**

- Users can reset their password using the token received via email
- Token validation with expiration checking
- Password requirements enforcement (minimum 6 characters)
- Confirmation email sent after successful reset

### 3. **Security Features**

- **Token Hashing**: Reset tokens are hashed using SHA256 before storage
- **Token Expiration**: Tokens automatically expire after 1 hour
- **Email Verification**: Users must have access to their email to reset password
- **Security Responses**: Generic responses prevent email enumeration

---

## Database Schema Changes

### User Model Updates

Added two new fields to the User schema:

```typescript
resetPasswordToken?: string;      // Hashed reset token
resetPasswordExpires?: Date;      // Token expiration time
```

These fields are set to `select: false` by default to ensure they're not returned in regular queries.

---

## API Endpoints

### 1. Forgot Password Request

**Endpoint:** `POST /users/forgot-password`

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**

```json
{
  "message": "If the email exists, a password reset link has been sent"
}
```

**Error Response (400):**

```json
{
  "error": "Email is required"
}
```

**Process Flow:**

1. Validate email is provided
2. Find user by email
3. Generate random reset token (32 bytes)
4. Hash token using SHA256
5. Store hashed token and expiration (1 hour from now) in database
6. Create reset URL with token and email
7. Send email with reset link
8. Return success message (whether email exists or not)

**Reset Link Format:**

```
{FRONTEND_URL}/reset-password?token={RESET_TOKEN}&email={USER_EMAIL}
```

---

### 2. Reset Password

**Endpoint:** `POST /users/reset-password`

**Request Body:**

```json
{
  "email": "user@example.com",
  "token": "reset_token_from_email",
  "newPassword": "newPassword123"
}
```

**Success Response (200):**

```json
{
  "message": "Password reset successfully"
}
```

**Error Responses:**

Missing fields (400):

```json
{
  "error": "Email, token, and new password are required"
}
```

Invalid password length (400):

```json
{
  "error": "Password must be at least 6 characters long"
}
```

Invalid/Expired token (400):

```json
{
  "error": "Invalid or expired password reset token"
}
```

**Process Flow:**

1. Validate all required fields are provided
2. Validate password length (minimum 6 characters)
3. Hash the provided token using SHA256
4. Find user with matching email, hashed token, and non-expired token
5. Update user password (automatically hashed by pre-save hook)
6. Clear reset token and expiration fields
7. Send confirmation email
8. Return success message

---

## File Changes

### 1. **User Model** (`src/model/user.model.ts`)

- Added `resetPasswordToken` field (optional String)
- Added `resetPasswordExpires` field (optional Date)
- Both fields use `select: false` for security

### 2. **JWT Utils** (`src/utils/jwt.ts`)

- Added `generateResetToken()` function
- Uses `crypto.randomBytes(32)` for secure token generation

### 3. **Email Utility** (`src/utils/sendEmail.ts`)

- Fixed function name from `sendEMail` to `sendEmail`
- Added proper export statement

### 4. **User Controller** (`src/controller/user.controller.ts`)

- Added `forgotPassword()` async function
- Added `resetPassword()` async function
- Imported required modules: `crypto`, `sendEmail`, `generateResetToken`

### 5. **User Routes** (`src/routes/users.ts`)

- Added `POST /users/forgot-password` route
- Added `POST /users/reset-password` route

---

## Environment Variables Required

Ensure the following environment variables are set in `.env`:

```env
# Email Configuration
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_app_password

# Frontend URL for reset link
FRONTEND_URL=http://localhost:3000

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Database
MONGODB_URI=your_mongodb_connection_string
```

**Note:** For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833) instead of your actual password.

---

## Email Templates

### Forgot Password Email

Sent when user requests password reset. Contains:

- Explanation of password reset request
- Clickable reset link
- Plain text link (as backup)
- 1-hour expiration warning
- Notice if user didn't request this

### Reset Success Email

Sent after successful password reset. Contains:

- Confirmation of password reset
- Security notice for unauthorized changes

---

## Security Best Practices Implemented

1. **Token Storage**: Tokens are hashed before storage (not stored in plaintext)
2. **Token Expiration**: Automatic expiration after 1 hour
3. **One-Time Use**: Token is deleted after successful password reset
4. **Email Verification**: Users must have email access to reset password
5. **Generic Responses**: Same response whether email exists or not
6. **Password Hashing**: New passwords are automatically hashed by mongoose pre-save hook
7. **HTTPS Recommended**: Use HTTPS in production for reset links
8. **Rate Limiting**: Consider implementing rate limiting on forgot-password endpoint

---

## Frontend Integration Guide

### Step 1: Forgot Password Request

```javascript
const handleForgotPassword = async (email) => {
  try {
    const response = await fetch("/api/users/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    // Show success message to user
  } catch (error) {
    console.error("Error:", error);
  }
};
```

### Step 2: Reset Password Form

```javascript
const handleResetPassword = async (email, token, newPassword) => {
  try {
    const response = await fetch("/api/users/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        token,
        newPassword,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      // Redirect to login page
    }
  } catch (error) {
    console.error("Error:", error);
  }
};
```

### Step 3: Reset Password Page

The frontend should:

1. Extract `token` and `email` from URL query parameters
2. Display a form for entering new password
3. Call reset password endpoint with token, email, and new password
4. Handle validation and error messages
5. Redirect to login on success

---

## Testing the Feature

### Using Postman

**Test 1: Forgot Password**

1. Method: POST
2. URL: `http://localhost:3000/api/users/forgot-password`
3. Body (JSON):

```json
{
  "email": "test@example.com"
}
```

**Test 2: Reset Password**

1. Method: POST
2. URL: `http://localhost:3000/api/users/reset-password`
3. Body (JSON):

```json
{
  "email": "test@example.com",
  "token": "token_from_email",
  "newPassword": "newPassword123"
}
```

### Using cURL

**Forgot Password:**

```bash
curl -X POST http://localhost:3000/api/users/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Reset Password:**

```bash
curl -X POST http://localhost:3000/api/users/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","token":"reset_token","newPassword":"newPassword123"}'
```

---

## Error Handling

### Common Errors and Solutions

| Error                                     | Cause                         | Solution                                        |
| ----------------------------------------- | ----------------------------- | ----------------------------------------------- |
| "Email is required"                       | Email not provided in request | Include email in request body                   |
| "Invalid or expired password reset token" | Token invalid or expired      | Generate new token via forgot-password endpoint |
| "Password must be at least 6 characters"  | Password too short            | Use password with minimum 6 characters          |
| Email not received                        | Email configuration issue     | Check EMAIL_USER and EMAIL_PASS in .env         |
| Token not working                         | Token corrupted or incorrect  | Ensure exact token from email is used           |

---

## Database Queries Reference

### Find user with valid reset token:

```typescript
User.findOne({
  email,
  resetPasswordToken: hashedToken,
  resetPasswordExpires: { $gt: new Date() },
});
```

### Clear reset token after use:

```typescript
user.resetPasswordToken = undefined;
user.resetPasswordExpires = undefined;
await user.save();
```

---

## Future Enhancements

1. **Rate Limiting**: Implement rate limiting to prevent brute force attacks
2. **Email Verification**: Add email verification step during signup
3. **Two-Factor Authentication**: Add 2FA for additional security
4. **Password History**: Track password changes to prevent reuse
5. **Admin Dashboard**: Allow admins to manage user password resets
6. **SMS Support**: Add SMS-based password reset option
7. **Biometric Reset**: Support biometric authentication for password reset

---

## Troubleshooting

### Email not sending?

- Verify EMAIL_USER and EMAIL_PASS in .env
- For Gmail, use [App Password](https://support.google.com/accounts/answer/185833)
- Check Email_USER has SMTP access enabled

### Token not working?

- Ensure token from email is copied exactly
- Check token hasn't expired (1 hour limit)
- Verify email matches the one used in forgot-password

### Password not updating?

- Check password meets minimum 6 character requirement
- Verify user exists in database
- Check for database connection issues

---

## Summary

The Forgot Password feature provides a secure, industry-standard password reset mechanism with:

- ✅ Secure token generation and hashing
- ✅ Time-limited tokens (1 hour)
- ✅ Email verification
- ✅ Password validation
- ✅ User feedback via email
- ✅ Security against email enumeration

All components are fully integrated and ready for use in production with proper environment configuration.
