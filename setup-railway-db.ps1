Write-Host "Setting up Railway database with Prisma..." -ForegroundColor Green

# Set Railway DATABASE_URL
$env:DATABASE_URL = "postgresql://postgres:YeBhLWVVMGLnRklInXBQWSVpggsLmcyd@switchback.proxy.rlwy.net:56643/railway"

# Navigate to database package
cd packages/database

# Generate Prisma Client
Write-Host "`nGenerating Prisma Client..." -ForegroundColor Cyan
pnpm generate

# Push schema to Railway
Write-Host "`nPushing schema to Railway database..." -ForegroundColor Cyan
pnpm prisma db push --accept-data-loss

Write-Host "`nSchema pushed successfully! Now we need to import the data..." -ForegroundColor Green
