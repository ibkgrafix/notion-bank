# NorthVault Bank

A complete, full-stack fictional U.S.-style digital banking platform built with Next.js 15, TypeScript, Tailwind CSS, PostgreSQL, and Prisma ORM.

> ⚠️ **IMPORTANT DISCLAIMER**: NorthVault Bank is a fictional banking application for demonstration purposes only. All accounts, transactions, balances, routing numbers, and financial data are entirely simulated and non-production. This application does not connect to real banking networks, real bank accounts, real ACH rails, or any real financial systems. No real money is involved.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT (jose) + bcryptjs |
| Validation | Zod |
| Icons | Lucide React |
| UI Primitives | Radix UI |

---

## Features

### Public Website
- Professional banking homepage with hero, products, features, stats
- Product pages: checking, savings, cards, loans, mortgages, business banking
- About, contact, help center pages
- Responsive navigation with mobile menu

### Customer Portal
- Full registration & login flow
- Forgot/reset password (with token-based reset)
- Banking dashboard with account overview
- Checking & savings account views
- Transaction history
- Transfer system (with admin approval workflow)
- Bill payments
- Card management (freeze/unfreeze)
- Loan applications
- Account statements (printable)
- In-app notifications
- Session management & security settings

### Admin Portal
- Operations dashboard with live statistics
- Customer management with search & filtering
- Customer detail pages with full account visibility
- Transaction management with approve/decline workflow
- Loan application review
- Card management
- Audit log
- Admin actions: freeze accounts, initiate password resets, send notifications, suspend users

### Security
- Passwords hashed with bcrypt (cost factor 12)
- JWT sessions stored in httpOnly cookies
- Server-side role verification on every protected route
- Database-level data scoping (users only see their own data)
- Atomic database transactions for financial operations
- Available balance holds prevent double-spending
- Complete audit trail of all administrative actions

---

## Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Setup

1. **Clone and install dependencies**
```bash
cd "notion bank"
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your database credentials and secrets
```

3. **Set up the database**
```bash
# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate
```

4. **Seed with development data**
```bash
npm run db:seed
```

5. **Start development server**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing (use a strong random value) |
| `NEXT_PUBLIC_APP_URL` | Application base URL |
| `SESSION_DURATION_HOURS` | Session expiry in hours (default: 24) |

---

## Development Credentials

After running `npm run db:seed`:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@northvaultbank.com | Admin@NorthVault1 |
| Customer | john.carter@example.com | Customer@1234 |
| Customer | maria.rodriguez@example.com | Customer@5678 |

---

## Application Routes

### Public
| Route | Description |
|-------|-------------|
| `/` | Homepage |
| `/personal-banking` | Personal banking overview |
| `/checking` | Checking account info |
| `/savings` | Savings account info |
| `/cards` | Card products |
| `/loans` | Loan products |
| `/mortgages` | Mortgage info |
| `/business-banking` | Business banking |
| `/about` | About page |
| `/contact` | Contact page |
| `/help` | Help center / FAQs |
| `/security` | Security info |
| `/login` | Customer login |
| `/register` | Customer registration |
| `/forgot-password` | Password reset request |
| `/reset-password` | Password reset form |

### Customer Dashboard
| Route | Description |
|-------|-------------|
| `/dashboard` | Account overview |
| `/dashboard/accounts` | Account details & history |
| `/dashboard/transfers` | Transfer money |
| `/dashboard/payments` | Bill payments |
| `/dashboard/cards` | Card management |
| `/dashboard/loans` | Loan applications |
| `/dashboard/statements` | Account statements |
| `/dashboard/notifications` | Notifications |
| `/dashboard/settings` | Account settings |

### Admin Portal
| Route | Description |
|-------|-------------|
| `/admin` | Operations dashboard |
| `/admin/users` | Customer list |
| `/admin/users/[id]` | Customer detail |
| `/admin/transactions` | All transactions |
| `/admin/loans` | Loan applications |
| `/admin/cards` | Card management |
| `/admin/audit-logs` | Audit trail |

---

## Architecture

```
app/
├── (public)/          # Public website (layout with navbar + footer)
├── (dashboard)/       # Customer portal (auth-protected)
├── (admin)/           # Admin portal (admin-role-protected)
└── api/               # REST API routes
    ├── auth/          # Authentication endpoints
    ├── accounts/      # Customer account data
    ├── transactions/  # Transaction history
    ├── transfers/     # Initiate transfers
    ├── beneficiaries/ # Manage recipients
    ├── cards/         # Card operations
    ├── loans/         # Loan applications
    ├── notifications/ # In-app notifications
    ├── payments/      # Bill payments
    ├── billers/       # Manage billers
    └── admin/         # Admin-only endpoints

components/
├── ui/                # Design system (button, input, card, modal, badge, toast, etc.)
├── public/            # Public website components (navbar, footer)
├── dashboard/         # Customer dashboard components
└── admin/             # Admin portal components

lib/
├── auth.ts            # Session management, JWT
├── db.ts              # Prisma client
├── utils.ts           # Formatters, helpers
├── validations.ts     # Zod schemas
├── audit.ts           # Audit logging
└── notifications.ts   # Notification helpers

prisma/
├── schema.prisma      # Database schema
└── seed.ts            # Development seed data
```

---

## Transfer Workflow

The full transfer lifecycle:

```
Customer initiates transfer
  → Amount held from available balance
  → Transaction created (status: PENDING)
  → Customer receives notification
  → Admin sees pending transaction on dashboard

Admin reviews transaction
  → Approves: balance deducted atomically, status → COMPLETED, customer notified, audit log created
  → Declines: held amount released, status → DECLINED, customer notified with reason, audit log created
```

All financial state changes use Prisma transactions to ensure atomicity and prevent double-spending.

---

## Database Schema

Key models: User, Account, Transaction, Beneficiary, Card, Loan, Notification, UserSession, PasswordReset, AuditLog, Biller

Financial amounts are stored as integer cents (e.g., $12.50 = 1250) to avoid floating-point precision issues.
