# Complete Database Migration to Railway
Write-Host "🚀 Starting Complete Migration to Railway..." -ForegroundColor Green
Write-Host ""

# Step 1: Link to momentumdb
Write-Host "Step 1: Linking to Railway database project..." -ForegroundColor Cyan
railway link

# Step 2: Create tables using Railway's internal connection
Write-Host ""
Write-Host "Step 2: Creating database schema on Railway..." -ForegroundColor Cyan
Set-Location packages\database

# Use Railway's internal DATABASE_URL by running in Railway context
$createSchemaScript = @"
cd packages\database
npx prisma db push --accept-data-loss --skip-generate
"@

$createSchemaScript | railway run powershell -Command -

# Step 3: Import data
Write-Host ""
Write-Host "Step 3: Importing data to Railway..." -ForegroundColor Cyan

$importScript = @"
cd packages\database
npm run import-data
"@

$importScript | railway run powershell -Command -

Set-Location ..\..

Write-Host ""
Write-Host "✅ Database migration complete!" -ForegroundColor Green
Write-Host ""

# Step 4: Link to web service and deploy
Write-Host "Step 4: Deploying web application..." -ForegroundColor Cyan
railway link

Write-Host ""
Write-Host "Step 5: Triggering deployment..." -ForegroundColor Cyan
railway up --detach

Write-Host ""
Write-Host "🎉 Complete! Your application is deploying..." -ForegroundColor Green
Write-Host "🌐 URL: https://momentumweb-production-dbc7.up.railway.app" -ForegroundColor White
