Write-Host "📋 Pushing schema to Railway..." -ForegroundColor Cyan
cd packages\database
npx prisma db push --accept-data-loss

Write-Host ""
Write-Host "✅ Schema pushed!" -ForegroundColor Green
Write-Host ""
Write-Host "📥 Importing data to Railway..." -ForegroundColor Cyan
pnpm import-data

Write-Host ""
Write-Host "🎉 Migration Complete!" -ForegroundColor Green
