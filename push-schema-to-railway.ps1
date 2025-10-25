# Set Railway database URL temporarily
$env:DATABASE_URL="postgresql://postgres:YeBhLWVVMGLnRklInXBQWSVpggsLmcyd@switchback.proxy.rlwy.net:56643/railway"

# Navigate to database package
cd packages\database

# Push schema using Prisma (this will create all tables)
npx prisma db push --skip-generate

# Go back to root
cd ..\..
