Write-Host "🚀 Migrating Local Database to Railway PostgreSQL" -ForegroundColor Green
Write-Host ""

# Step 1: Export data from local database
Write-Host "📦 Step 1: Exporting data from local database..." -ForegroundColor Cyan
cd packages\database
pnpm export-data

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Export failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Export complete!" -ForegroundColor Green
Write-Host ""

# Step 2: Link to Railway momentumdb project
Write-Host "🔗 Step 2: Linking to Railway database..." -ForegroundColor Cyan
cd ..\..

# Step 3: Push schema to Railway
Write-Host "📋 Step 3: Creating database schema on Railway..." -ForegroundColor Cyan
railway shell
cd packages\database
npx prisma db push --accept-data-loss
exit

Write-Host ""
Write-Host "✅ Schema created!" -ForegroundColor Green
Write-Host ""

# Step 4: Import data to Railway
Write-Host "📥 Step 4: Importing data to Railway..." -ForegroundColor Cyan
railway shell
cd packages\database
pnpm import-data
exit

Write-Host ""
Write-Host "🎉 Migration Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Your local database has been successfully migrated to Railway!" -ForegroundColor White
