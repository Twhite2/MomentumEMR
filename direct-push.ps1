Write-Host "Connecting directly to Railway database..." -ForegroundColor Green

# Get the DATABASE_URL from Railway
$railwayDbUrl = railway variables | Select-String "DATABASE_URL" | ForEach-Object { $_ -replace '.*DATABASE_URL=', '' }
Write-Host "Database URL: $railwayDbUrl" -ForegroundColor Cyan

# Set it temporarily
$env:DATABASE_URL = $railwayDbUrl

# Navigate to database package
cd packages/database

# Push schema
Write-Host "`nPushing Prisma schema..." -ForegroundColor Cyan
pnpm prisma db push --accept-data-loss --skip-generate

Write-Host "`n✅ Schema pushed successfully!" -ForegroundColor Green
