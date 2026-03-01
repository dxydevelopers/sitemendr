# Sitemendr Backend - Testing & Documentation Guide

## Overview

This guide covers the testing infrastructure and API documentation added to the Sitemendr backend.

---

## 🧪 Testing Setup

### Dependencies Added

- **Vitest** - Modern test framework (fast, ESM-native)
- **Supertest** - HTTP assertions for Express apps
- **TypeScript types** - Full type definitions

### Running Tests

```bash
# Install dependencies first
cd backend
npm install

# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```
backend/
├── tests/
│   ├── setup.ts          # Test configuration & mocks
│   ├── health.test.js   # Health check API tests
│   └── auth.test.js     # Authentication tests
├── vitest.config.ts     # Vitest configuration
└── package.json
```

### Writing Tests

Example test structure:

```javascript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';

describe('API Endpoint', () => {
  const app = express();
  app.use(express.json());
  
  // Your routes here
  
  it('should return expected response', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});
```

### CI/CD

GitHub Actions workflow is configured at:
- `.github/workflows/test.yml`

The workflow runs:
1. **Test job** - Unit tests with PostgreSQL
2. **Lint job** - ESLint validation
3. **Build job** - TypeScript compilation check

---

## 📚 API Documentation (Swagger/OpenAPI)

### Accessing Documentation

Once the server is running:

- **UI**: http://localhost:5000/api-docs
- **JSON**: http://localhost:5000/api-docs/json
- **YAML**: http://localhost:5000/api-docs/yaml

### Features

- **Interactive API explorer** - Try endpoints directly from the browser
- **Request/Response schemas** - Full type definitions
- **Authentication support** - Enter JWT token to test protected endpoints
- **Code generation** - Generate clients in various languages

### Available Endpoints

The documentation covers:

| Tag | Description |
|-----|-------------|
| Auth | Login, registration, password reset |
| Users | User management |
| Subscriptions | Subscription CRUD |
| Assessments | AI website assessments |
| Payments | Paystack integration |
| Leads | Lead management |
| Support | Ticket system |
| Blog | Blog management |
| Analytics | Reporting endpoints |
| Health | System health checks |

### Customization

Edit `config/swagger.ts` to:
- Add new endpoints
- Update descriptions
- Add response examples
- Modify security schemes

---

## 🔧 TypeScript Configuration

### Setup

A `tsconfig.json` is included with:
- Strict mode enabled
- Node.js and Express types
- Source maps enabled
- ES2022 target

### Type Checking

```bash
# Run type checking
npm run type-check

# Build TypeScript (for future migration)
npm run build:ts
```

### Adding Types to JavaScript

Use JSDoc comments for type hints in JavaScript files:

```javascript
/**
 * @param {string} userId
 * @returns {Promise<User|null>}
 */
async function getUser(userId) {
  // ...
}
```

---

## 📝 Next Steps

1. **Run `npm install`** to install new dependencies
2. **Run `npm test`** to verify tests work
3. **Start server** and visit `/api-docs` to see Swagger UI
4. **Add more tests** for controllers and services
5. **Migrate critical files** to TypeScript as needed

---

## Troubleshooting

### "Cannot find module 'vitest'"
```bash
cd backend
npm install
```

### "Cannot find type definitions"
```bash
cd backend
npm install -D @types/node @types/express
```

### Swagger not loading
- Ensure `swagger-ui-express` and `swagger-jsdoc` are installed
- Check server is running on port 5000
- Verify `/api-docs` route is registered in `server.js`

### Tests failing
- Check environment variables are set in `.env`
- Ensure PostgreSQL is running for integration tests
- Review `tests/setup.ts` for mock configurations
