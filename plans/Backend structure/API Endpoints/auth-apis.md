# Backend Structure - Authentication APIs

## Overview
The Authentication API endpoints handle user registration, login, password management, and session management for the Sitemendr platform.

## API Endpoints

### POST /api/auth/register

**Purpose:** Create new user account
**Authentication:** None required

#### Request Body
```json
{
  "name": "string (required, 2-50 chars)",
  "email": "string (required, valid email)",
  "password": "string (required, min 8 chars)",
  "phone": "string (optional)",
  "company": "string (optional)",
  "source": "string (optional, e.g., 'assessment', 'homepage')"
}
```

#### Response (Success - 201)
```json
{
  "success": true,
  "message": "Account created successfully. Please check your email to verify your account.",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "verified": false,
    "createdAt": "ISO date string"
  },
  "token": "JWT token for immediate login"
}
```

#### Response (Validation Error - 400)
```json
{
  "success": false,
  "message": "Registration failed",
  "errors": {
    "email": "Email already exists",
    "password": "Password must be at least 8 characters"
  }
}
```

#### Business Logic
- Validate email format and uniqueness
- Hash password with bcrypt (12 rounds)
- Create user record with unverified status
- Send verification email with JWT token
- Auto-login user with temporary token
- Track registration source for analytics

### POST /api/auth/login

**Purpose:** Authenticate existing user
**Authentication:** None required

#### Request Body
```json
{
  "email": "string (required)",
  "password": "string (required)",
  "rememberMe": "boolean (optional, default false)"
}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string (client/admin)",
    "verified": true,
    "lastLogin": "ISO date string"
  },
  "token": "JWT token",
  "expiresIn": "number (seconds)"
}
```

#### Response (Invalid Credentials - 401)
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

#### Response (Unverified Account - 403)
```json
{
  "success": false,
  "message": "Please verify your email before logging in",
  "resendLink": "/api/auth/resend-verification"
}
```

#### Business Logic
- Find user by email
- Verify password with bcrypt
- Check account verification status
- Update last login timestamp
- Generate JWT token (24h or 30 days based on rememberMe)
- Return user data (exclude sensitive fields)

### POST /api/auth/verify-email

**Purpose:** Verify user email address
**Authentication:** None required

#### Request Body
```json
{
  "token": "string (required, JWT verification token)"
}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "message": "Email verified successfully. You can now log in."
}
```

#### Response (Invalid Token - 400)
```json
{
  "success": false,
  "message": "Invalid or expired verification token"
}
```

#### Business Logic
- Verify JWT token signature and expiration
- Find user by token payload
- Update user verification status
- Clear any failed login attempts
- Trigger welcome email sequence

### POST /api/auth/forgot-password

**Purpose:** Initiate password reset process
**Authentication:** None required

#### Request Body
```json
{
  "email": "string (required, valid email)"
}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "message": "If an account with that email exists, we've sent password reset instructions."
}
```

#### Business Logic
- Find user by email (don't reveal if email exists)
- Generate secure reset token (UUID + expiration)
- Store reset token in database with expiration
- Send password reset email with secure link
- Log reset request for security monitoring

### POST /api/auth/reset-password

**Purpose:** Complete password reset
**Authentication:** None required

#### Request Body
```json
{
  "token": "string (required, reset token)",
  "password": "string (required, min 8 chars)",
  "confirmPassword": "string (required, must match password)"
}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "message": "Password reset successfully. You can now log in with your new password."
}
```

#### Response (Invalid Token - 400)
```json
{
  "success": false,
  "message": "Invalid or expired reset token"
}
```

#### Business Logic
- Validate token exists and not expired
- Validate password strength and confirmation
- Hash new password with bcrypt
- Update user password
- Delete used reset token
- Log password change for security

### POST /api/auth/resend-verification

**Purpose:** Resend email verification
**Authentication:** None required

#### Request Body
```json
{
  "email": "string (required)"
}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "message": "Verification email sent. Please check your inbox."
}
```

#### Business Logic
- Find unverified user by email
- Check rate limiting (max 3 per hour)
- Generate new verification token
- Send verification email
- Update last verification sent timestamp

### GET /api/auth/me

**Purpose:** Get current user profile
**Authentication:** JWT token required

#### Response (Success - 200)
```json
{
  "success": true,
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "phone": "string",
    "company": "string",
    "role": "string",
    "verified": true,
    "createdAt": "ISO date string",
    "lastLogin": "ISO date string",
    "subscriptions": ["array of subscription IDs"]
  }
}
```

#### Response (Unauthorized - 401)
```json
{
  "success": false,
  "message": "Authentication required"
}
```

#### Business Logic
- Verify JWT token
- Fetch user data with related subscriptions
- Exclude sensitive fields (password, tokens)
- Return comprehensive user profile

### PUT /api/auth/profile

**Purpose:** Update user profile
**Authentication:** JWT token required

#### Request Body
```json
{
  "name": "string (optional)",
  "phone": "string (optional)",
  "company": "string (optional)"
}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": { /* updated user object */ }
}
```

#### Business Logic
- Verify JWT token and user ownership
- Validate input data
- Update user record
- Log profile change
- Return updated user data

### POST /api/auth/change-password

**Purpose:** Change user password
**Authentication:** JWT token required

#### Request Body
```json
{
  "currentPassword": "string (required)",
  "newPassword": "string (required, min 8 chars)",
  "confirmPassword": "string (required)"
}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### Business Logic
- Verify JWT token
- Validate current password
- Validate new password strength
- Hash and update password
- Invalidate existing sessions (optional)
- Send security notification email

### POST /api/auth/logout

**Purpose:** Logout user (client-side token removal)
**Authentication:** JWT token required

#### Response (Success - 200)
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Business Logic
- Verify token (for logging purposes)
- Client handles token removal
- Optional: Add token to blacklist for server-side invalidation

## Security Measures

### Rate Limiting
- Login: 5 attempts per 15 minutes per IP
- Registration: 3 per hour per IP
- Password reset: 3 per hour per email
- Verification resend: 3 per hour per email

### Input Validation
- Email: RFC compliant validation
- Password: Minimum 8 chars, complexity requirements
- Names: Alphanumeric, spaces, apostrophes only
- Tokens: UUID format, expiration checks

### Data Sanitization
- XSS prevention with input sanitization
- SQL injection prevention with parameterized queries
- CSRF protection with JWT

### Monitoring & Logging
- Failed login attempts logged with IP
- Password changes trigger security alerts
- Suspicious activity flagged for review
- Audit trail for all auth operations

## Error Handling

### Generic Error Response
```json
{
  "success": false,
  "message": "An error occurred. Please try again.",
  "errorCode": "AUTH_001"
}
```

### Error Codes
- AUTH_001: Internal server error
- AUTH_002: Invalid request format
- AUTH_003: Rate limit exceeded
- AUTH_004: Account locked
- AUTH_005: Token expired

## Performance Optimization

### Database Indexing
- Email field indexed for fast lookups
- Token fields indexed with TTL
- User ID indexed for profile queries

### Caching Strategy
- User sessions cached in Redis
- Rate limiting counters in Redis
- Frequently accessed user data cached

### Async Operations
- Email sending handled asynchronously
- Password hashing in background
- Audit logging queued

## Testing Requirements

### Unit Tests
- Password hashing/verification
- JWT token generation/validation
- Input validation functions
- Rate limiting logic

### Integration Tests
- Full registration flow
- Login/logout cycle
- Password reset process
- Email verification flow

### Security Tests
- SQL injection attempts
- XSS payload testing
- Brute force protection
- Token tampering tests

## Monitoring & Alerts

### Key Metrics
- Registration conversion rate
- Login success rate
- Password reset frequency
- Account verification rate

### Alert Conditions
- High failed login rate (>10/minute)
- Password reset abuse (>50/hour)
- Registration spam detection
- System performance degradation