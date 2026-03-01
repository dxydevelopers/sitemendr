import swaggerJsdoc from 'swagger-jsdoc';
import { Options } from 'swagger-jsdoc';

const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Sitemendr API',
      version: '1.0.0',
      description: `
## Sitemendr Backend API Documentation

Sitemendr is a web development platform that provides:
- AI-powered website building
- Subscription management
- Payment processing via Paystack
- Real-time chat support
- Assessment and template generation

### Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
\`Authorization: Bearer <your-token>\`

### Rate Limiting
- 100 requests per 15 minutes for authenticated users
- 20 requests per 15 minutes for unauthenticated users

### Error Responses
All errors follow a consistent format:
\`\`\`json
{
  "success": false,
  "message": "Error description"
}
\`\`\`
      `,
      contact: {
        name: 'Sitemendr Support',
        email: 'support@sitemendr.com',
        url: 'https://sitemendr.com/contact'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local development server'
      },
      {
        url: 'https://api.sitemendr.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/auth/login'
        },
        ApiKeyHeader: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for admin endpoints'
        }
      },
      schemas: {
        // Error Response
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            }
          }
        },
        // Success Response
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        },
        // User
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin', 'manager'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        // Subscription
        Subscription: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            plan: { type: 'string', enum: ['ai_foundation', 'pro_enhancement', 'enterprise', 'maintenance', 'self_hosted'] },
            status: { type: 'string', enum: ['active', 'suspended', 'cancelled', 'pending'] },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' }
          }
        },
        // Assessment
        Assessment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            businessName: { type: 'string' },
            businessType: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        // Lead
        Lead: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            source: { type: 'string' },
            status: { type: 'string', enum: ['new', 'contacted', 'qualified', 'converted', 'lost'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        // Support Ticket
        SupportTicket: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            subject: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['open', 'in_progress', 'resolved', 'closed'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      },
      responses: {
        Unauthorized: {
          description: 'Unauthorized - Invalid or missing authentication',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Access denied. No token provided.'
              }
            }
          }
        },
        Forbidden: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Access denied. Admin role required.'
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Resource not found'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Validation failed',
                errors: [
                  { field: 'email', message: 'Invalid email format' }
                ]
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'An unexpected error occurred'
              }
            }
          }
        }
      }
    },
    security: [
      { BearerAuth: [] }
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints'
      },
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Subscriptions',
        description: 'Subscription management'
      },
      {
        name: 'Assessments',
        description: 'AI Website Assessment'
      },
      {
        name: 'Payments',
        description: 'Payment processing via Paystack'
      },
      {
        name: 'Leads',
        description: 'Lead management'
      },
      {
        name: 'Support',
        description: 'Support ticket management'
      },
      {
        name: 'Blog',
        description: 'Blog management'
      },
      {
        name: 'Analytics',
        description: 'Analytics and reporting'
      },
      {
        name: 'Health',
        description: 'System health and monitoring'
      }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js', './docs/**/*.yaml']
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;
