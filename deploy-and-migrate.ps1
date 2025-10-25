Write-Host "=== Railway Deployment + Database Migration ===" -ForegroundColor Green

Write-Host "`nStep 1: Committing current changes..." -ForegroundColor Cyan
git add .
git commit -m "prepare for railway database migration" --allow-empty

Write-Host "`nStep 2: Pushing to GitHub..." -ForegroundColor Cyan
git push momentum main

Write-Host "`nStep 3: Triggering Railway deployment..." -ForegroundColor Cyan
railway up

Write-Host "`nStep 4: Running Prisma migration on Railway..." -ForegroundColor Cyan
railway run pnpm --filter @momentum/database prisma db push --accept-data-loss --skip-generate

Write-Host "`n✅ Migration complete!" -ForegroundColor Green
Write-Host "Your schema is now on Railway database." -ForegroundColor Yellow
