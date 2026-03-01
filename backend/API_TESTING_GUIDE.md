# API Testing Guide

## Overview

This guide explains how to systematically test all Sitemendr backend API endpoints to identify and fix issues.

## Prerequisites

1. **Backend server must be running** on port 5000
2. **Database connection** must be active (Neon PostgreSQL)
3. **Environment variables** must be configured in `.env`

## Quick Start

### 1. Start the Backend Server

```bash
cd backend
npm start
```

The server should start and show:
```
🚀 Sitemendr Backend API running on port 5000
📱 Frontend URL: http://localhost:3000
✅ Neon (PostgreSQL) Connected via Prisma
```

### 2. Run the API Tests

In a new terminal (keep the server running):

```bash
cd backend
npm run test-api
```

### 3. Review Results

The test script will:
- Test all public and authenticated endpoints
- Display results in color-coded format
- Save detailed results to `api-test-results.json`
- Show a summary of passed/failed tests
- List all failed endpoints with error details

## Test Coverage

The test script covers the following endpoint categories:

### 1. Health Check
- `GET /api/health` - Server health status

### 2. Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (authenticated)
- `PUT /api/auth/profile` - Update profile (authenticated)

### 3. Blog
- `GET /api/blog/posts` - Get published posts
- `GET /api/blog/meta` - Get blog metadata
- `GET /api/blog/posts/:slug` - Get post by slug
- `GET /api/blog/posts/:slug/related` - Get related posts
- `POST /api/blog/posts/:slug/comments` - Add comment (authenticated)
- `POST /api/blog/posts/:slug/like` - Toggle like (authenticated)
- `GET /api/blog/posts/:slug/comments` - Get comments (authenticated)

### 4. Support
- `POST /api/support/chat` - AI support chat (public)
- `POST /api/support/tickets` - Create support ticket (authenticated)
- `GET /api/support/tickets` - Get user tickets (authenticated)

### 5. Client Dashboard
- `GET /api/client/stats` - Dashboard statistics
- `GET /api/client/projects` - Get projects
- `GET /api/client/activities` - Get activities
- `GET /api/client/billing` - Get billing info
- `GET /api/client/messages` - Get messages
- `GET /api/client/resources` - Get resources
- `GET /api/client/support` - Get support tickets
- `GET /api/client/domains` - Get domains

### 6. Assessment
- `POST /api/assessment/start` - Start assessment
- `POST /api/assessment/:id/responses` - Save responses
- `POST /api/assessment/:id/process` - Process assessment
- `GET /api/assessment/:id/results` - Get results

### 7. Contact
- `POST /api/contact` - Submit contact form

### 8. Managed Domain
- `POST /api/request-managed-domain` - Request managed domain

### 9. Payments
- `POST /api/payments/initialize` - Initialize payment
- `GET /api/payments/my-payments` - Get user payments (authenticated)

### 10. Subscriptions
- `GET /api/subscriptions/my-subscription` - Get user subscription
- `POST /api/subscriptions/create-or-update` - Create/update subscription

### 11. Monitoring
- `POST /api/monitoring/analyze` - Analyze site performance
- `GET /api/monitoring/uptime` - Check site uptime

### 12. Admin (Skipped - requires admin token)
- All admin endpoints require admin authentication
- These are marked as skipped in the test results

## Understanding Test Results

### Color Codes
- 🟢 **Green**: Test passed (2xx or 3xx status)
- 🔴 **Red**: Test failed (4xx or 5xx status, or error)
- 🟡 **Yellow**: Warning or additional information
- 🔵 **Blue**: Section headers

### Status Codes
- **200-299**: Success
- **300-399**: Redirect (considered success)
- **400-499**: Client error (test failed)
- **500-599**: Server error (test failed)

### Common Errors

#### ECONNREFUSED
**Meaning**: Server is not running
**Solution**: Start the backend server with `npm start`

#### 401 Unauthorized
**Meaning**: Authentication required but not provided
**Solution**: Check if endpoint requires authentication and token is valid

#### 403 Forbidden
**Meaning**: User doesn't have permission
**Solution**: Check user role and permissions

#### 404 Not Found
**Meaning**: Endpoint doesn't exist
**Solution**: Verify the endpoint path is correct

#### 429 Too Many Requests
**Meaning**: Rate limit exceeded
**Solution**: Wait and retry, or adjust rate limits

#### 500 Internal Server Error
**Meaning**: Server-side error
**Solution**: Check server logs for detailed error message

## Interpreting Results File

The `api-test-results.json` file contains detailed information:

```json
{
  "timestamp": "2026-02-01T05:00:00.000Z",
  "summary": {
    "total": 50,
    "passed": 45,
    "failed": 5,
    "skipped": 20
  },
  "endpoints": [
    {
      "method": "GET",
      "endpoint": "/api/health",
      "description": "Health check endpoint",
      "url": "http://localhost:5000/api/health",
      "status": "passed",
      "statusCode": 200,
      "responseTime": 15,
      "error": null,
      "data": { ... }
    }
  ]
}
```

## Troubleshooting

### Issue: Tests fail with "Server not running"
**Cause**: Backend server is not started
**Fix**: Run `cd backend && npm start`

### Issue: Database connection errors
**Cause**: DATABASE_URL is incorrect or database is down
**Fix**: 
1. Check `.env` file for correct DATABASE_URL
2. Verify Neon database is active
3. Check network connectivity

### Issue: Authentication failures
**Cause**: JWT token is invalid or expired
**Fix**: 
1. Check JWT_SECRET in `.env`
2. Ensure token is not expired
3. Verify authentication middleware is working

### Issue: OpenAI/Groq API errors
**Cause**: API keys are invalid or quota exceeded
**Fix**:
1. Check OPENAI_API_KEY and GROQ_API_KEY in `.env`
2. Verify API quotas and billing
3. The system now falls back to Groq if OpenAI fails

### Issue: Prisma connection pool timeout
**Cause**: Too many concurrent database connections
**Fix**: Already fixed - connection pool increased to 20 with 30s timeout

## Manual Testing with Postman/cURL

If you need to test specific endpoints manually:

### Using cURL

```bash
# Health check
curl http://localhost:5000/api/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test123456!"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456!"}'

# Get blog posts
curl http://localhost:5000/api/blog/posts
```

### Using Postman

1. Import the endpoints from the test script
2. Set base URL to `http://localhost:5000`
3. For authenticated endpoints, add `Authorization: Bearer <token>` header
4. Send requests and review responses

## Continuous Testing

To run tests automatically during development:

### Option 1: Manual
Run `npm run test-api` after making changes

### Option 2: Watch Mode (requires nodemon)
```bash
npm run dev
```
Then in another terminal:
```bash
npm run test-api
```

## Next Steps After Testing

1. **Review failed endpoints** - Check the error messages
2. **Fix identified issues** - Update controllers, routes, or middleware
3. **Re-run tests** - Verify fixes work
4. **Document changes** - Update this guide with any new findings

## Known Issues Fixed

### ✅ Prisma Connection Pool Timeout
- **Issue**: Connection pool too small (5 connections, 10s timeout)
- **Fix**: Increased to 20 connections, 30s timeout
- **Status**: Resolved

### ✅ OpenAI API Rate Limit
- **Issue**: OpenAI quota exceeded causing support chat failures
- **Fix**: Added Groq API as fallback
- **Status**: Resolved

## Support

For issues or questions:
1. Check server logs in the terminal
2. Review `api-test-results.json` for detailed error information
3. Verify all environment variables are set correctly
4. Ensure database is accessible

## API Endpoint Reference

Complete list of all endpoints can be found in:
- `backend/routes/authRoutes.js`
- `backend/routes/blogRoutes.js`
- `backend/routes/supportRoutes.js`
- `backend/routes/clientRoutes.js`
- `backend/routes/paymentRoutes.js`
- `backend/routes/subscriptionRoutes.js`
- `backend/routes/assessmentRoutes.js`
- `backend/routes/contactRoutes.js`
- `backend/routes/monitoringRoutes.js`
- `backend/routes/adminRoutes.js`
- `backend/routes/analyticsRoutes.js`
- `backend/routes/requestManagedDomain.js`
