# Momentum EMR/EHR System

A production-ready, multi-tenant Electronic Health Records platform built with modern technologies.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router) + TypeScript + TailwindCSS + shadcn/ui
- **Backend**: NestJS + Prisma ORM
- **Database**: PostgreSQL (Railway)
- **Cache/Queue**: Redis (Railway)
- **Auth**: NextAuth.js v5 with RBAC
- **File Storage**: Cloudflare R2
- **Hosting**: Railway

## Project Structure

```
momentum-emr/
├── apps/
│   ├── web/              # Next.js frontend
│   └── api/              # NestJS backend
├── packages/
│   ├── database/         # Prisma schema & migrations
│   ├── ui/              # Shared React components
│   └── config/          # Shared configurations
└── prisma/              # Database schema
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL (or Railway account)
- Redis (or Railway addon)

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Run development servers
pnpm dev
```

### Environment Variables

Create `.env` files in both `apps/web` and `apps/api` directories. See `.env.example` files for required variables.

## Features

- ✅ Multi-tenant architecture (8 user roles)
- ✅ Patient registration & management
- ✅ Appointment scheduling & queue management
- ✅ Medical records with file attachments
- ✅ Lab orders & results (DICOM support)
- ✅ Prescription & treatment plans
- ✅ Pharmacy inventory management
- ✅ Billing with HMO/Corporate client support
- ✅ Payment gateway integration
- ✅ Analytics dashboards
- ✅ Notification system (Email/SMS/Push)
- ✅ Patient satisfaction surveys
- ✅ Audit logs & security features

## User Roles

1. **Momentum (Super Admin)** - Platform administration
2. **Hospital Admin** - Hospital management
3. **Doctor** - Clinical care & prescriptions
4. **Nurse** - Patient care & vitals
5. **Pharmacist** - Medication dispensing
6. **Cashier** - Billing & payments
7. **Lab Technician** - Lab results management
8. **Patient** - Patient portal access

## License

Proprietary - Momentum Healthcare Solutions
