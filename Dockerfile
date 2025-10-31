# Multi-stage build for Next.js monorepo
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@9

# Stage 1: Install dependencies
FROM base AS dependencies
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/database/package.json ./packages/database/
COPY packages/ui/package.json ./packages/ui/
COPY apps/web/package.json ./apps/web/

# Copy Prisma schema BEFORE installing (needed for postinstall hook)
COPY packages/database/prisma ./packages/database/prisma

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Build application
FROM base AS builder
WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=dependencies /app/packages/ui/node_modules ./packages/ui/node_modules
COPY --from=dependencies /app/apps/web/node_modules ./apps/web/node_modules

# Copy source code
COPY . .

# Generate Prisma Client
RUN cd packages/database && pnpm prisma generate

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN pnpm --filter @momentum/web build

# Stage 3: Production runtime
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=builder /app/packages/database/*.ts ./packages/database/
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/next.config.ts ./apps/web/
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules

# Copy built Next.js application
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules

# Expose port
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create startup script
RUN echo '#!/bin/sh\n\
set -e\n\
echo "🚀 Starting deployment..."\n\
echo "📊 DATABASE_URL is set: $([ -n "$DATABASE_URL" ] && echo "YES" || echo "NO")"\n\
cd /app/packages/database\n\
echo "🔄 Pushing database schema..."\n\
pnpm prisma db push --accept-data-loss --skip-generate || echo "⚠️ Schema push failed or already up to date"\n\
echo "🌱 Running seed script..."\n\
pnpm seed || echo "⚠️ Seed failed or already completed"\n\
cd /app\n\
echo "✅ Starting Next.js server..."\n\
exec pnpm --filter @momentum/web start\n\
' > /start.sh && chmod +x /start.sh

# Switch to non-root user
USER nextjs

# Start command
CMD ["/start.sh"]
