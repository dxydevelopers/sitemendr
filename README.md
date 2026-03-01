# Sitemendr - Complete Website

A comprehensive, AI-powered website development platform built with Next.js, React, Node.js, and Prisma.

## 🎯 Project Overview

Sitemendr is a full-stack web application that provides AI-powered website development services. The platform features:

- **AI-Powered Assessment System** - Interactive questionnaires to understand client needs
- **Subscription Management** - Complete payment and subscription system with Paystack integration
- **Blog Platform** - Full-featured content management system
- **Admin Dashboard** - Comprehensive admin interface for managing content and users
- **Client Dashboard** - User portal for managing projects and subscriptions
- **Modern UI/UX** - Beautiful, responsive design with dark theme

## 🏗️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Prisma ORM** - Database ORM
- **PostgreSQL** - Database (configured for Neon)
- **JWT** - Authentication
- **Paystack** - Payment processing
- **OpenAI/Groq** - AI integration

### Infrastructure
- **Environment Variables** - Secure configuration management
- **Cron Jobs** - Automated tasks
- **Email Integration** - SMTP-based email system

## 📁 Project Structure

```
sitemendr/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   │   ├── admin/       # Admin dashboard
│   │   │   ├── blog/        # Blog pages
│   │   │   ├── dashboard/   # Client dashboard
│   │   │   ├── payment/     # Payment pages
│   │   │   └── ...         # Other pages
│   │   ├── components/      # Reusable components
│   │   ├── lib/            # Utility functions
│   │   └── styles/         # Global styles
│   └── public/             # Static assets
│
├── backend/                # Node.js backend API
│   ├── controllers/        # Route controllers
│   ├── routes/            # API routes
│   ├── middleware/        # Authentication middleware
│   ├── scripts/           # Utility scripts
│   ├── prisma/           # Database schema
│   └── config/           # Configuration files
│
├── plans/                 # Project documentation
└── README.md             # This file
```

## 🚀 Features Implemented

### ✅ Authentication & Authorization
- User registration and login
- JWT-based authentication
- Admin role management
- Email verification system
- Password reset functionality

### ✅ AI Assessment System
- Interactive assessment questionnaire
- AI-powered response processing
- Lead generation and management
- Assessment results display
- Conversion to leads

### ✅ Payment System
- **Paystack Integration** - Complete payment processing
- Subscription management
- Payment verification
- Reactivation system for suspended accounts
- Payment history tracking

### ✅ Blog Platform
- Full CRUD operations for blog posts
- Comment system with moderation
- Like functionality
- SEO optimization
- Category and tag management
- Reading time calculation

### ✅ Admin Dashboard
- User management
- Blog post management
- Subscription oversight
- Payment monitoring
- System health checks
- Content moderation

### ✅ Client Dashboard
- Subscription status
- Project management
- Billing history
- Account settings
- Support tickets

### ✅ Modern UI/UX
- Dark theme throughout
- Responsive design
- Smooth animations
- Professional typography
- Consistent color scheme

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- Paystack account for payments
- OpenAI API key for AI features

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd sitemendr

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup
```bash
# Copy environment file
cp backend/.env.example backend/.env

# Update database connection in backend/.env
DATABASE_URL="postgresql://username:password@localhost:5432/sitemendr"

# Run database migrations
cd backend
npx prisma migrate dev
```

### 3. Environment Configuration
Update `backend/.env` with your configuration:

```env
# Database
DATABASE_URL="your_database_url"

# Authentication
JWT_SECRET="your_jwt_secret_key"
JWT_EXPIRES_IN="7d"

# Email
EMAIL_USER="your_email@gmail.com"
EMAIL_PASS="your_app_password"
ADMIN_EMAIL="admin@yoursite.com"

# Paystack
PAYSTACK_PUBLIC_KEY="pk_test_your_key"
PAYSTACK_SECRET_KEY="sk_test_your_key"
PAYSTACK_WEBHOOK_SECRET="your_webhook_secret"

# AI Integration
OPENAI_API_KEY="your_openai_key"
GROQ_API_KEY="your_groq_key"
```

### 4. Start Development Servers
```bash
# Start backend
cd backend
npm start

# Start frontend (in new terminal)
cd frontend
npm run dev
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Admin Panel**: http://localhost:3000/admin

## 🔧 Key Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

### Assessment
- `POST /api/assessment/start` - Start new assessment
- `POST /api/assessment/:id/responses` - Save assessment responses
- `POST /api/assessment/:id/process` - Process assessment with AI
- `GET /api/assessment/:id/results` - Get assessment results

### Blog
- `GET /api/blog/posts` - Get published posts
- `GET /api/blog/posts/:slug` - Get single post
- `POST /api/blog/posts/:slug/comments` - Add comment
- `POST /api/blog/posts/:slug/like` - Toggle like

### Payment
- `POST /api/payments/initialize` - Initialize payment
- `GET /api/payments/verify/:reference` - Verify payment
- `GET /api/subscriptions/my-subscription` - Get user subscription

### Admin
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/users` - Get all users
- `GET /api/admin/posts` - Get all blog posts
- `POST /api/admin/posts` - Create blog post

## 🎨 Design System

### Color Palette
- **AI Blue**: `#0066FF` - Primary brand color
- **Tech Purple**: `#7C3AED` - Secondary accent
- **Expert Green**: `#10B981` - Success states
- **Dark Background**: `#0F172A` - Main background
- **Light Text**: `#F8FAFC` - Primary text
- **Medium Gray**: `#94A3B8` - Secondary text

### Typography
- **Primary Font**: System font stack
- **Headings**: Bold, uppercase tracking
- **Body Text**: Medium weight, readable spacing
- **Code**: Monospace for technical content

### Components
- **Buttons**: Rounded, gradient backgrounds
- **Cards**: Glassmorphism with borders
- **Forms**: Clean inputs with focus states
- **Navigation**: Sticky header with smooth transitions

## 🔄 Payment Flow

1. **Subscription Selection**: User selects plan on `/payment`
2. **Payment Initialization**: Backend creates Paystack transaction
3. **Redirect to Paystack**: User completes payment on Paystack
4. **Callback Verification**: Paystack redirects to `/payment/callback`
5. **Payment Verification**: Backend verifies payment with Paystack
6. **Subscription Activation**: User subscription is activated
7. **Success Page**: User sees confirmation at `/payment/success`

## 🤖 AI Assessment Flow

1. **Start Assessment**: User begins questionnaire
2. **Save Responses**: Responses saved to database
3. **AI Processing**: Groq/OpenAI processes responses
4. **Generate Results**: AI creates personalized recommendations
5. **Display Results**: Results shown to user
6. **Lead Conversion**: Option to convert to lead

## 📊 Database Schema

The application uses Prisma ORM with the following main models:

- **User**: Authentication and user data
- **BlogPost**: Blog content management
- **Comment**: Blog post comments
- **Subscription**: User subscriptions
- **Payment**: Payment transactions
- **Assessment**: AI assessment data
- **Lead**: Generated leads from assessments

## 🚨 Important Notes

### Security
- All API endpoints are protected with JWT authentication
- Admin routes require admin role verification
- Input validation is implemented throughout
- Passwords are hashed using bcrypt

### Performance
- Database queries are optimized with Prisma
- Frontend uses efficient rendering patterns
- Images are optimized for web delivery
- Caching strategies implemented where appropriate

### Scalability
- Modular architecture allows for easy expansion
- Database schema designed for growth
- API endpoints follow REST conventions
- Frontend components are reusable

## 🧪 Testing

Run the test script to verify the installation:

```bash
node test-website.js
```

This script checks:
- Required files exist
- Package.json files are present
- Key components are implemented
- Payment pages are created
- Blog functionality is complete
- Database schema is valid
- Environment configuration is set up

## 📈 Next Steps

After completing the setup:

1. **Create Admin User**: Use the admin registration system
2. **Seed Blog Content**: Run the blog seeding script
3. **Configure Payment**: Set up Paystack webhooks
4. **Test AI Features**: Configure OpenAI/Groq keys
5. **Deploy**: Consider deployment options (Vercel, Railway, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the project documentation in `/plans/`
- Review the API documentation
- Create an issue for bug reports
- Contact the development team

---

**Built with ❤️ using modern web technologies**