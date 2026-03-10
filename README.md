<div align="center">
  <img src="./public/logo.svg" alt="TikShip Logo" width="200" height="200" />
  <p><strong>Turn Ideas into Products, Launches into Cash.</strong></p>
  <p>The Rapid-Start Platform for One-Person Company.</p>
  
  <p>
    <a href="./README.md">English</a> | 
    <a href="./README.zh-CN.md">简体中文</a>
  </p>
</div>

---

> Enterprise-grade multi-language admin panel + blog + e-commerce system built with Next.js 16 App Router, Prisma, and NextAuth.

## 🚀 Core Features

### Admin Panel System

- **Complete RBAC Permission System** - Role, permission, and user-role relationship management
- **Admin Authentication** - JWT Token authentication with 24-hour validity
- **Audit Logs** - Record all critical operations (create/update/delete/view/login)
- **User Management** - Full CRUD operations for frontend users
- **Content Management** - Article/page management with categories, tags, and SEO fields
- **Product Management** - Support for one-time payment and subscription models
- **Order Management** - Complete order lifecycle management
- **Dashboard** - Real-time statistics and chart displays

### User-Facing Features

- **User Authentication** - Email/password login + Google OAuth 2.0
- **User Profile** - Personal information management, password change, avatar upload
- **Blog System** - Article list, detail pages, category filtering
- **Product Purchase** - Support for both Stripe and PayPal payment methods
- **Order Center** - View order history and status tracking

### Payment Integration

- **Stripe** - One-time payment + subscription billing
- **PayPal** - One-time payment + subscription billing
- **Flexible Configuration** - Products can choose single or dual payment methods
- **Webhook Processing** - Automatic payment status synchronization
- **Email Notifications** - Automatic emails for payment success/failure/expiration

### Technical Highlights

- **Multi-language Support** - Chinese, English, Spanish (based on next-intl)
- **Theme System** - 33 DaisyUI themes with light/dark mode switching
- **File Upload** - Support for local storage and ImgBB hosting
- **Email Service** - Resend email delivery (verification codes, password reset, order notifications)
- **API Documentation** - OpenAPI 3.0 specification with interactive API docs
- **Component Documentation** - Storybook component library with 100+ interactive examples
- **Security Protection** - CORS, CSRF, rate limiting, input validation
- **Multi-database Support** - PostgreSQL / MySQL / SQLite

## 📦 Tech Stack

### Core Framework

- **Next.js 16.1.6** - React full-stack framework (App Router)
- **React 19.2.3** - UI library
- **TypeScript 5** - Type safety
- **Prisma 7.3** - ORM database tool

### UI Components

- **TailwindCSS 4** - Atomic CSS framework
- **DaisyUI 5.5** - UI component library (33 themes)
- **Lucide React** - Icon library
- **Recharts** - Chart library
- **TipTap** - Rich text editor

### Authentication & Authorization

- **NextAuth 4.24** - User authentication
- **JWT** - Admin token authentication
- **bcrypt** - Password encryption
- **Custom RBAC** - Role-based access control system

### Payment Integration

- **Stripe** - Payment processing
- **PayPal REST API v2** - Payment processing
- **Webhook Verification** - Secure event handling

### Internationalization

- **next-intl 4.7** - Multi-language support
- **Auto-detection** - Browser language detection
- **Persistence** - localStorage preference saving

### Development Tools

- **Storybook 10.2** - Component documentation
- **ESLint 9** - Code linting
- **Prettier** - Code formatting
- **OpenAPI** - API documentation generation

### Database

- **PostgreSQL** - Production recommended
- **MySQL** - Optional
- **SQLite** - Development environment

## 🎯 Project Structure

```
tikship/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/             # Admin panel pages
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── blog/              # Blog pages
│   │   ├── products/          # Product pages
│   │   └── user/              # User center
│   ├── components/            # React components
│   │   ├── admin/            # Admin panel components
│   │   ├── auth/             # Authentication components
│   │   ├── layout/           # Layout components
│   │   ├── providers/        # Context Providers
│   │   ├── theme/            # Theme components
│   │   └── ui/               # Common UI components
│   ├── lib/                   # Business logic libraries
│   │   ├── auth/             # Authentication logic
│   │   ├── payment/          # Payment services
│   │   ├── email/            # Email services
│   │   ├── upload/           # File upload
│   │   ├── security/         # Security features
│   │   └── utils/            # Utility functions
│   ├── config/               # Configuration files
│   ├── hooks/                # Custom Hooks
│   ├── locales/              # Multi-language files
│   ├── types/                # TypeScript types
│   └── stories/              # Storybook Stories
├── prisma/
│   ├── schema.prisma         # Database models
│   ├── migrations-*/         # Database migrations
│   └── data/                 # Seed data
├── scripts/                   # Script tools
└── public/                    # Static assets
```

## 🛠️ Quick Start

### Requirements

- Node.js >= 20.9.0
- npm / pnpm / yarn
- PostgreSQL / MySQL / SQLite

### Installation Steps

1. **Clone the project**

```bash
git clone https://github.com/yorsal-org/tikship
cd tikship
```

2. **Initialize installation**

```bash
npm ci
npm run init
```

2.1 Configure the following environment variables as prompted:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/tikship"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
...
```

2.2. **Initialize seed data (automatically executed)**

```bash
npm run db:seed
```

This creates:

- All system permissions
- Default `Admin` role with 30 basic permissions
- Superuser account (username/email/password printed to console after seeding)

> The superuser credentials are configured via environment variables (`ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_NAME`) with defaults `tikship` / `tikship@example.com`. A random 8-character password is generated on first run — **save it from the console output**.

3. **(Optional) Generate test data**

```bash
npm run db:generate-test-data
```

Generates 50 users, 30 articles, 12 products, 100 orders, and other test data

4. **Start development server**

```bash
npm run dev
```

Access:

- Frontend: http://localhost:3000
- Admin Panel: http://localhost:3000/admin
- API Documentation: http://localhost:3000/api-docs
- Storybook: `npm run storybook` then visit http://localhost:6006

## 📚 Core Features Explained

### 1. RBAC Permission System

Complete role-based access control system:

**Permission Groups**:

- Admin User Management (view/create/edit/delete/assign roles)
- Role Management (view/create/edit/delete/assign permissions)
- Permission Management (view/create/edit/delete)
- Frontend User Management (view/edit/delete)
- Content Management (article/page CRUD)
- Product Management (view/create/edit)
- Order Management (view/edit)
- Audit Logs (view)

**Usage Example**:

```typescript
// Check permissions
import { requireAdminAuth } from '@/lib/auth/admin'
import { PERMISSIONS } from '@/config/permissions'

export async function GET(req: NextRequest) {
  const admin = await requireAdminAuth(req, [PERMISSIONS.USER_VIEW])
  // Only admins with USER_VIEW permission can access
}
```

### 2. Payment System

Support for both Stripe and PayPal payment methods:

**Payment Provider Management**:

Payment providers (Stripe, PayPal) are managed dynamically via the admin panel. You can add, edit, and delete providers without any code changes to control which payment methods are available.

**Payment Modes**:

- `payment` - One-time payment
- `subscription` - Subscription billing (monthly/yearly/weekly)

**Order Status**:

- `pending` - Pending
- `completed` - Completed
- `failed` - Failed
- `expired` - Expired
- `refunded` - Refunded

**Webhook Event Handling**:

- Stripe: `checkout.session.completed`, `checkout.session.expired`, etc.
- PayPal: `PAYMENT.CAPTURE.COMPLETED`, `BILLING.SUBSCRIPTION.ACTIVATED`, etc.

### 3. Content Management System

Feature-complete CMS:

**Article Types**:

- `ARTICLE` - Blog articles
- `PAGE` - Static pages

**Article Status**:

- `DRAFT` - Draft
- `PUBLISHED` - Published
- `SCHEDULED` - Scheduled
- `TRASH` - Trash

**SEO Optimization**:

- Custom SEO title and description
- Auto-generated slug
- Featured image
- Categories and tags

**Rich Text Editor**:

- Based on TipTap
- Support for images, links, lists, etc.
- Real-time preview

### 4. File Upload System

Flexible file upload solution:

**Local Upload**:

- Files stored in `public/upload/YYYY-MM-DD/`
- Automatically organized by date
- Filename: `{timestamp}-{random}.{ext}`

**ImgBB Hosting**:

- Cloud storage
- No local space required
- Requires API Key

**Security Features**:

- File type whitelist validation
- File size limit (default 5MB)
- User authentication check

### 5. Email Notification System

Email service based on Resend:

**Email Types**:

- Registration verification code
- Password reset
- Order success notification
- Order failure notification
- Order expiration notification

**Email Templates**:

- Responsive HTML templates
- Plain text fallback version
- Brand-consistent design

### 6. Multi-language System

Internationalization solution based on next-intl:

**Supported Languages**:

- English (en) - Default
- Simplified Chinese (zh)
- Spanish (es)

**Features**:

- Auto-detect browser language
- localStorage persistence
- Language switcher component
- Namespace organization

**Usage Example**:

```typescript
import { useTranslations } from 'next-intl'

function MyComponent() {
  const t = useTranslations('common')
  return <h1>{t('welcome')}</h1>
}
```

### 7. Theme System

Custom theme management system:

**Theme Modes**:

- `light` - Light mode
- `dark` - Dark mode
- `system` - Follow system

**DaisyUI Themes**:

- 33 preset themes
- Customizable light/dark themes
- Configured via environment variables

### 8. API Documentation System

Interactive documentation based on OpenAPI 3.0:

**Features**:

- Auto-generated API documentation
- Interactive testing interface
- Grouped by tags
- Complete request/response examples
- Authentication instructions

**Generate Documentation**:

```bash
npm run openapi:generate
```

**Access Documentation**:

- Online docs: http://localhost:3000/api-docs
- OpenAPI JSON: http://localhost:3000/openapi.json

### 9. Storybook Component Library

Complete component documentation system:

**Component Coverage**:

- 12 basic UI components
- 1 theme component
- 1 internationalization component
- 100+ interactive examples

**UI Components**:

- Button, Input, Card, Alert
- Modal, Table, Pagination
- StatusBadge, StatsCard
- ImageUpload, DateTimePicker, Toast

**Start Storybook**:

```bash
npm run storybook
```

Visit: http://localhost:6006

### 10. Security Features

Multi-layer security protection:

**Authentication Security**:

- JWT Token authentication (admin)
- Session authentication (user)
- Password strength validation
- Login attempt limiting

**API Security**:

- CORS configuration (multi-domain support)
- CSRF protection
- Rate limiting
- Input validation

**Data Security**:

- Webhook signature verification
- Payment amount validation
- SQL injection protection (Prisma ORM)
- XSS protection

**File Security**:

- File type whitelist
- File size limit
- User authentication check

## 🔧 Common Commands

### Development Commands

```bash
# Start development server
npm run dev

# Build production version
npm run build

# Start production server
npm start

# Code linting
npm run lint
```

### Database Commands

```bash
# Generate Prisma Client
npm run db:generate

# Run database migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# Initialize seed data
npm run db:seed

# Generate test data
npm run db:generate-test-data

# Reset admin password
npm run db:reset-admin-password

# Switch database type
npm run db:update-provider
```

### Documentation Commands

```bash
# Start Storybook
npm run storybook

# Build Storybook
npm run build-storybook

# Generate OpenAPI documentation
npm run openapi:generate

# Validate OpenAPI specification
npm run openapi:validate
```

### Utility Commands

```bash
# Check i18n translation keys
npm run i18n:check

# Initialize environment variables
npm run setup:env

# Run installation script
npm run init
```

## 🔐 Default Accounts

### Admin Account (Superuser)

The superuser account is created by `npm run db:seed`. Credentials are controlled by environment variables:

| Variable | Default |
|---|---|
| `ADMIN_USERNAME` | `tikship` |
| `ADMIN_EMAIL` | `tikship@example.com` |
| `ADMIN_NAME` | `Super Administrator` |
| Password | Random 8-char (printed to console on first seed) |

> If the account already exists, seeding is skipped and the existing password is kept. Use `npm run db:reset-admin-password` to reset.

### Test Users

After running `npm run db:generate-test-data`, 50 test users will be generated:

```
Email: john.doe@example.com
Password: User123!
```

## 🚢 Deployment Guide

### Environment Variable Configuration

Production environment requires the following environment variables:

```env
# Database (use production database)
DATABASE_URL="postgresql://..."

# NextAuth (use strong random key)
NEXTAUTH_SECRET="production-secret-key"
NEXTAUTH_URL="https://yourdomain.com"

# Payment (use production keys)
STRIPE_SECRET_KEY="sk_live_xxx"
PAYPAL_MODE="live"

# CORS (configure allowed domains) optional
ALLOWED_ORIGINS="https://yourdomain.com,https://app.yourdomain.com"

# Other service configurations...
```

### Deployment Steps

1. **Build project**

```bash
npm run build
```

2. **Run database migrations**

```bash
npx prisma migrate deploy
```

3. **Initialize seed data**

```bash
npm run db:seed
```

4. **Start server**

```bash
npm start
```

### Recommended Deployment Platforms

- **Vercel** - Official Next.js recommendation
- **Railway** - Support for database and application
- **Render** - Full-stack application deployment
- **AWS / Azure / GCP** - Enterprise-level deployment

### Important Notes

- Use HTTPS (required)
- Configure Webhook URLs
- Set environment variables
- Configure domain whitelist
- Regular database backups

### Code Standards

- Use TypeScript, avoid using `any`
- Follow ESLint rules
- Write clear comments
- Update relevant documentation

## 📝 Changelog

### v1.0.0 (2026-03-05)

**Core Features**:

- ✅ Complete admin panel system
- ✅ RBAC permission system
- ✅ User authentication (email + Google OAuth)
- ✅ Content management system (blog + pages)
- ✅ Product and order management
- ✅ Stripe + PayPal payment integration
- ✅ Multi-language support (Chinese, English, Spanish)
- ✅ Theme system (33 themes)
- ✅ File upload (local + ImgBB)
- ✅ Email notification system
- ✅ API documentation (OpenAPI 3.0)
- ✅ Storybook component library
- ✅ Security protection (CORS, CSRF, rate limiting)
- ✅ Audit log system
- ✅ Test data generator

## 📄 License / End User License Agreement

EULA

## 💬 Support

For questions or suggestions, please:

- Visit API Documentation: http://localhost:3000/api-docs
- View Storybook: http://localhost:6006
- View official tutorials and documentation: https://www.tikship.top/docs
- Submit an Issue from GitHub repo: http://github.com/yorsal/tikship
- Send email to: support@tikship.top

## 🙏 Acknowledgments

Thanks to the following open-source projects:

- Next.js
- React
- Prisma
- NextAuth
- TailwindCSS
- DaisyUI
- Stripe
- PayPal
- Resend
- Storybook

---

**Built with ❤️ by TikShip Team**
