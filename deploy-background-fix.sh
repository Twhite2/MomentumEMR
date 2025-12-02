#!/bin/bash
# Deploy Background Image Fix
# Run this on your server

set -e

echo "🚀 Deploying Background Image Fix..."

# Step 1: Check if column exists
echo ""
echo "📊 Step 1: Checking database column..."
COLUMN_EXISTS=$(sudo -u postgres psql momentum_emr -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hospitals' AND column_name='background_image_url');")

if [ "$COLUMN_EXISTS" = "f" ]; then
    echo "❌ Column 'background_image_url' not found. Adding it..."
    sudo -u postgres psql momentum_emr -c "ALTER TABLE hospitals ADD COLUMN background_image_url TEXT;"
    echo "✅ Column added successfully!"
else
    echo "✅ Column 'background_image_url' already exists!"
fi

# Step 2: Verify column
echo ""
echo "📊 Step 2: Verifying column..."
sudo -u postgres psql momentum_emr -c "\d hospitals" | grep background_image_url || echo "⚠️  Column not found in table description"

# Step 3: Pull latest code
echo ""
echo "📦 Step 3: Pulling latest code..."
cd /root/Momentum_EMR
git pull origin main

# Step 4: Regenerate Prisma Client
echo ""
echo "🔄 Step 4: Regenerating Prisma Client..."
cd packages/database
pnpm prisma generate

# Step 5: Build application
echo ""
echo "🔨 Step 5: Building application..."
cd /root/Momentum_EMR/apps/web  
pnpm build

# Step 6: Restart PM2
echo ""
echo "♻️  Step 6: Restarting application..."
pm2 restart momentum

# Step 7: Check logs
echo ""
echo "📋 Step 7: Checking logs (press Ctrl+C to exit)..."
sleep 2
pm2 logs momentum --lines 20 --nostream

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🧪 Test by visiting: https://function.momentumhealthcare.io/login"
echo "You should now see background images working!"
