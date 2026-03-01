# Backend Structure - AI Assessment APIs

## Overview
The AI Assessment APIs handle the collection, processing, and management of business assessments for generating personalized website recommendations. These endpoints support the interactive questionnaire flow, AI processing, and lead management.

## API Endpoints

### POST /api/assessment/start

**Purpose:** Initialize a new assessment session
**Authentication:** None required

#### Request Body
```json
{
  "source": "string (optional, e.g., 'homepage', 'email')",
  "referrer": "string (optional, URL)"
}
```

#### Response (Success - 201)
```json
{
  "success": true,
  "assessmentId": "string (UUID)",
  "sessionToken": "string (JWT for session tracking)",
  "expiresAt": "ISO date string"
}
```

### POST /api/assessment/:id/responses

**Purpose:** Save questionnaire responses for an assessment
**Authentication:** Session token in header

#### Request Body
```json
{
  "step": "number (1-8)",
  "responses": {
    "businessType": "string",
    "goals": ["array of strings"],
    "currentWebsite": "boolean",
    "designPreferences": "object",
    "technicalRequirements": ["array"],
    "budget": "string",
    "timeline": "string"
  }
}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "assessmentId": "string",
  "step": "number",
  "nextStep": "number or null",
  "progress": "number (0-100)"
}
```

### POST /api/assessment/:id/process

**Purpose:** Trigger AI processing of assessment responses
**Authentication:** Session token in header

#### Request Body
```json
{
  "finalResponses": "object (complete assessment data)"
}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "assessmentId": "string",
  "processingId": "string (UUID)",
  "status": "processing",
  "estimatedTime": "number (seconds)"
}
```

### GET /api/assessment/:id/results

**Purpose:** Retrieve processed assessment results
**Authentication:** Session token in header

#### Response (Success - 200)
```json
{
  "success": true,
  "assessmentId": "string",
  "results": {
    "recommendedPackage": "string",
    "confidence": "number (0-100)",
    "features": ["array of recommended features"],
    "pricing": "object",
    "timeline": "string",
    "mockupUrl": "string (optional)",
    "customizations": ["array"]
  },
  "generatedAt": "ISO date string"
}
```

### POST /api/assessment/:id/lead

**Purpose:** Convert assessment to qualified lead
**Authentication:** Session token in header

#### Request Body
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "phone": "string (optional)",
  "company": "string (optional)",
  "website": "string (optional)",
  "timeline": "string (optional)",
  "consent": "boolean (required, GDPR)"
}
```

#### Response (Success - 201)
```json
{
  "success": true,
  "leadId": "string",
  "message": "Lead captured successfully. Our team will contact you within 24 hours.",
  "nextSteps": ["array of strings"]
}
```

### GET /api/assessment/stats

**Purpose:** Get assessment completion statistics (admin only)
**Authentication:** Admin JWT required

#### Response (Success - 200)
```json
{
  "success": true,
  "stats": {
    "totalAssessments": "number",
    "completedAssessments": "number",
    "conversionRate": "number",
    "popularBusinessTypes": ["array"],
    "averageCompletionTime": "number (minutes)"
  }
}
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "field": "Error message"
  }
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Assessment not found"
}
```

### Processing Error (500)
```json
{
  "success": false,
  "message": "AI processing failed. Please try again."
}
```

## Rate Limiting
- Assessment start: 10 per hour per IP
- Response saving: 60 per minute per session
- Results retrieval: 30 per minute per session

## Data Retention
- Assessment sessions: 30 days
- Completed assessments: 1 year
- Leads: Indefinite (CRM integration)