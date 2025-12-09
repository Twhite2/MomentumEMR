#!/bin/bash
#####################################################################
# Momentum EMR - Complete Production Deployment Script
# Digital Ocean | Node.js 24 | PostgreSQL | Nginx | SSL
# 
# Run on server: bash deploy-production.sh
#####################################################################

set -e  # Exit on error

echo "============================================================"
echo "  Momentum EMR - Production Deployment"
echo "  Digital Ocean - momentumhealthcare.io"
echo "============================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Configuration
PROJECT_DIR="/home/momentum/Momentum_EMR"
APP_NAME="momentum-emr"

#####################################################################
# STEP 1: Clean Up Previous Installations
#####################################################################

echo ""
echo "============================================================"
echo "STEP 1: Cleaning Up Previous Installations"
echo "============================================================"

# Stop and delete PM2 processes
if pm2 list | grep -q "$APP_NAME"; then
    print_warning "Stopping existing PM2 process..."
    pm2 stop $APP_NAME 2>/dev/null || true
    pm2 delete $APP_NAME 2>/dev/null || true
fi

# Navigate to project
cd $PROJECT_DIR

# Clean build artifacts
print_status "Cleaning build artifacts..."
rm -rf apps/web/.next 2>/dev/null || true
rm -rf apps/web/node_modules 2>/dev/null || true
rm -rf node_modules 2>/dev/null || true
rm -rf packages/*/node_modules 2>/dev/null || true

print_status "Cleanup complete"

#####################################################################
# STEP 2: Generate NEXTAUTH_SECRET
#####################################################################

echo ""
echo "============================================================"
echo "STEP 2: Generating Security Keys"
echo "============================================================"

NEXTAUTH_SECRET=$(openssl rand -base64 32)
print_status "NEXTAUTH_SECRET generated"

#####################################################################
# STEP 3: Create Environment Files
#####################################################################

echo ""
echo "============================================================"
echo "STEP 3: Creating Environment Files"
echo "============================================================"

# Root .env.production
cat > $PROJECT_DIR/.env.production << EOF
# Database
DATABASE_URL="postgresql://momentum_user:Baridueh2025%40@localhost:5432/momentum_emr?schema=public"
DIRECT_URL="postgresql://momentum_user:Baridueh2025%40@localhost:5432/momentum_emr?schema=public"

# NextAuth
NEXTAUTH_URL=https://momentumhealthcare.io
NEXTAUTH_SECRET=$NEXTAUTH_SECRET

# Environment
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Backblaze B2
USE_S3=true
S3_REGION=us-east-005
S3_ENDPOINT=https://s3.us-east-005.backblazeb2.com
S3_ACCESS_KEY_ID=005c34bea4b227f0000000001
S3_SECRET_ACCESS_KEY=K005enXUKcTykLTTMeKQw49gXwyXuHs
S3_BUCKET_NAME=emr-upload

# Notifications
NOTIFICATION_CLIENT_ID=ftnfl1yz97xkek1gwtzh3xcjqh
NOTIFICATION_CLIENT_SECRET=cxr0lpe0sk5e9dpk1syqu47jlb4rap5v9nct7g0jo8om15burepttmdi34
NOTIFICATION_PROVIDER=custom

# CORS
ALLOWED_ORIGINS=http://momentumhealthcare.io,https://momentumhealthcare.io,http://www.momentumhealthcare.io,https://www.momentumhealthcare.io

# Upload & Session
MAX_FILE_SIZE=52428800
SESSION_MAX_AGE=2592000
EOF

# Copy to all needed locations
cp $PROJECT_DIR/.env.production $PROJECT_DIR/.env
cp $PROJECT_DIR/.env.production $PROJECT_DIR/apps/web/.env.production
cp $PROJECT_DIR/.env.production $PROJECT_DIR/apps/web/.env.local
cp $PROJECT_DIR/.env.production $PROJECT_DIR/apps/web/.env
cp $PROJECT_DIR/.env.production $PROJECT_DIR/packages/database/.env

print_status "Environment files created in all locations"
print_status "NEXTAUTH_SECRET: $NEXTAUTH_SECRET"

#####################################################################
# STEP 4: Install Dependencies
#####################################################################

echo ""
echo "============================================================"
echo "STEP 4: Installing Dependencies"
echo "============================================================"

cd $PROJECT_DIR
pnpm install --frozen-lockfile

print_status "Dependencies installed"

#####################################################################
# STEP 5: Database Setup
#####################################################################

echo ""
echo "============================================================"
echo "STEP 5: Setting Up Database"
echo "============================================================"

cd $PROJECT_DIR/packages/database

# Generate Prisma Client
pnpm prisma generate

print_status "Prisma client generated"

# Run migrations
pnpm prisma migrate deploy

print_status "Database migrations complete"

#####################################################################
# STEP 6: Build Application
#####################################################################

echo ""
echo "============================================================"
echo "STEP 6: Building Application"
echo "============================================================"

cd $PROJECT_DIR/apps/web
pnpm build

print_status "Application built successfully"

#####################################################################
# STEP 7: Start with PM2
#####################################################################

echo ""
echo "============================================================"
echo "STEP 7: Starting Application with PM2"
echo "============================================================"

cd $PROJECT_DIR/apps/web

# Start with PM2
pm2 start npm --name $APP_NAME -- start

# Save PM2 process list
pm2 save

print_status "Application started with PM2"

#####################################################################
# STEP 8: Setup PM2 Startup
#####################################################################

echo ""
echo "============================================================"
echo "STEP 8: Configuring PM2 Auto-Start"
echo "============================================================"

# Generate startup script
pm2 startup systemd -u momentum --hp /home/momentum | grep "sudo" | bash

print_status "PM2 configured to start on boot"

#####################################################################
# STEP 9: Verify Installation
#####################################################################

echo ""
echo "============================================================"
echo "STEP 9: Verifying Installation"
echo "============================================================"

# Wait for app to start
sleep 5

# Check PM2 status
PM2_STATUS=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.status")

if [ "$PM2_STATUS" = "online" ]; then
    print_status "PM2 process is online"
else
    print_error "PM2 process is not online. Status: $PM2_STATUS"
fi

# Check if app is listening on port 3000
if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
    print_status "Application listening on port 3000"
else
    print_warning "Application may not be listening on port 3000"
fi

# Test local connection
if curl -s http://localhost:3000 | grep -q "<!DOCTYPE html>"; then
    print_status "Application responding to HTTP requests"
else
    print_warning "Application may not be responding correctly"
fi

#####################################################################
# DEPLOYMENT SUMMARY
#####################################################################

echo ""
echo "============================================================"
echo "  ✓ DEPLOYMENT COMPLETE!"
echo "============================================================"
echo ""
echo "APPLICATION INFORMATION:"
echo "------------------------"
echo "• URL:         https://momentumhealthcare.io"
echo "• Status:      $(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.status")"
echo "• PM2 Name:    $APP_NAME"
echo "• Directory:   $PROJECT_DIR"
echo ""
echo "CREDENTIALS:"
echo "------------"
echo "• Database:    momentum_emr"
echo "• DB User:     momentum_user"
echo "• DB Password: Baridueh2025@"
echo "• Auth Secret: $NEXTAUTH_SECRET"
echo ""
echo "PM2 COMMANDS:"
echo "-------------"
echo "• View status:  pm2 status"
echo "• View logs:    pm2 logs $APP_NAME"
echo "• Restart app:  pm2 restart $APP_NAME"
echo "• Stop app:     pm2 stop $APP_NAME"
echo ""
echo "DEPLOYMENT COMMANDS (For Future Updates):"
echo "------------------------------------------"
echo "cd $PROJECT_DIR"
echo "git pull origin main"
echo "cd packages/database && pnpm prisma migrate deploy && pnpm prisma generate"
echo "cd ../../apps/web && pnpm build"
echo "pm2 restart $APP_NAME"
echo ""
echo "============================================================"
echo ""

# Show PM2 status
pm2 status

echo ""
print_status "Open https://momentumhealthcare.io in your browser!"
echo ""
