Write-Host "Migrating database through Railway environment..." -ForegroundColor Green

cd packages/database

Write-Host "`nStep 1: Generating Prisma Client..." -ForegroundColor Cyan
railway run pnpm generate

Write-Host "`nStep 2: Pushing schema to Railway database..." -ForegroundColor Cyan
railway run pnpm prisma db push --accept-data-loss --skip-generate

Write-Host "`n✅ Schema migrated successfully!" -ForegroundColor Green
Write-Host "`n⚠️ Note: This created the tables but no data yet." -ForegroundColor Yellow
Write-Host "You'll need to manually migrate data or re-seed the database." -ForegroundColor Yellow
