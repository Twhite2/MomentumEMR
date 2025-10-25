Write-Host "📥 Importing data to Railway PostgreSQL..." -ForegroundColor Cyan
Write-Host ""

# Navigate to database package
Set-Location packages\database

# Run the import using Railway's database connection
Write-Host "Running import script..." -ForegroundColor Yellow
pnpm import-data

Set-Location ..\..

Write-Host ""
Write-Host "✅ Import complete!" -ForegroundColor Green
