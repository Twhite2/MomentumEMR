# Momentum EMR - Setup Guide

This guide will help you set up and run the Momentum EMR/EHR system locally and deploy to Railway.

## Prerequisites

- Node.js 20+ installed
- pnpm 9+ installed (`npm install -g pnpm`)
- PostgreSQL database (Railway provides this)
- Git installed

## Quick Start (Local Development)

### 1. Install Dependencies

```bash
# Install all dependencies
pnpm install

# Generate Prisma Client
pnpm db:generate
```

### 2. Set Up Database

#### Option A: Using Railway (Recommended)

1. Create a Railway account at https://railway.app
2. Create a new project
3. Add PostgreSQL database
4. Copy the DATABASE_URL from Railway
5. Create `.env` file in `apps/web/`:

```env
DATABASE_URL="postgresql://user:pass@host:port/dbname"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

#### Option B: Using Local PostgreSQL

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/momentum_emr"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

### 3. Initialize Database

```bash
# Push schema to database
pnpm db:push

# Seed with sample data
cd packages/database
pnpm seed
```

### 4. Run Development Server

```bash
# Start all apps in development mode
pnpm dev

# Or run specific apps
cd apps/web
pnpm dev
```

The app will be available at http://localhost:3000

## Demo Credentials

After seeding, you can log in with these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@citygeneralhospital.com | password123 |
| Doctor | sarah.johnson@citygeneralhospital.com | password123 |
| Doctor | michael.chen@citygeneralhospital.com | password123 |
| Nurse | emily.williams@citygeneralhospital.com | password123 |
| Pharmacist | david.brown@citygeneralhospital.com | password123 |
| Cashier | lisa.anderson@citygeneralhospital.com | password123 |
| Lab Tech | james.wilson@citygeneralhospital.com | password123 |

## Project Structure

```
momentum-emr/
├── apps/
│   └── web/              # Next.js frontend application
│       ├── src/
│       │   ├── app/      # App Router pages
│       │   ├── components/ # React components
│       │   └── lib/      # Utilities and configurations
│       └── package.json
├── packages/
│   ├── database/         # Prisma schema and database utilities
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── seed.ts
│   │   └── index.ts
│   └── ui/               # Shared UI components
│       ├── components/
│       └── lib/
└── package.json
```

## Database Management

### View Database in Prisma Studio

```bash
pnpm db:studio
```

This opens a visual database browser at http://localhost:5555

### Create a Migration

```bash
pnpm db:migrate
```

### Reset Database (DANGER: Deletes all data)

```bash
cd packages/database
pnpm prisma migrate reset
```

## Deployment to Railway

### 1. Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy on Railway

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will auto-detect Next.js and deploy

### 3. Configure Environment Variables

In Railway dashboard, add these environment variables:

```env
DATABASE_URL=<provided-by-railway-postgres>
NEXTAUTH_URL=<your-railway-app-url>
NEXTAUTH_SECRET=<generate-secure-secret>
NODE_ENV=production
```

### 4. Set Up Database

In Railway's terminal or locally:

```bash
# Generate Prisma client
pnpm db:generate

# Push schema
pnpm db:push

# Seed database
cd packages/database && pnpm seed
```

### 5. Custom Build Commands (if needed)

Railway should auto-detect, but you can set:

- **Build Command**: `pnpm install && pnpm db:generate && pnpm build`
- **Start Command**: `cd apps/web && pnpm start`

## Development Workflow

### Adding a New Page

1. Create page in `apps/web/src/app/your-page/page.tsx`
2. Add route to sidebar in `apps/web/src/components/layout/sidebar.tsx`
3. Create components in `apps/web/src/components/your-feature/`

### Adding Database Models

1. Edit `packages/database/prisma/schema.prisma`
2. Run `pnpm db:push` or `pnpm db:migrate`
3. Update seed data in `packages/database/seed.ts`

### Creating UI Components

1. Add component to `packages/ui/components/`
2. Export from `packages/ui/index.tsx`
3. Use in apps: `import { Component } from '@momentum/ui'`

## Troubleshooting

### Port 3000 Already in Use

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change port
PORT=3001 pnpm dev
```

### Database Connection Issues

- Verify DATABASE_URL is correct
- Check PostgreSQL is running (if local)
- Ensure firewall allows connection
- For Railway: check if database is provisioned

### Prisma Client Not Generated

```bash
pnpm db:generate
```

### Build Errors

```bash
# Clean install
rm -rf node_modules
pnpm install

# Clear Next.js cache
rm -rf apps/web/.next
```

## Next Steps

After setup, continue with:

1. **Phase 2**: Complete CRUD operations for all modules
2. **Phase 3**: Add file upload (Cloudflare R2)
3. **Phase 4**: Implement notifications (Email/SMS)
4. **Phase 5**: Add payment gateway (Paystack)
5. **Phase 6**: Real-time features (WebSockets)
6. **Phase 7**: Analytics and reporting

## Support

For issues or questions:
- Check documentation in `PROJECT.md` and `PAGE_Flow.md`
- Review `emr_schema.dbml` for database structure
- Contact: support@momentum-emr.com

---

© 2025 Momentum Healthcare Solutions
