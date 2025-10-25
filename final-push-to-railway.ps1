Write-Host "=== Pushing Schema to Railway Database ===" -ForegroundColor Green
Write-Host "Using TCP Proxy connection..." -ForegroundColor Cyan

cd packages/database

# Backup current .env
if (Test-Path .env) {
    Write-Host "`nBacking up current .env to .env.local..." -ForegroundColor Yellow
    Copy-Item .env .env.local -Force
}

# Create .env with Railway public URL (no SSL mode since TCP proxy handles it)
$railwayUrl = "DATABASE_URL=`"postgresql://postgres:YeBhLWVVMGLnRklInXBQWSVpggsLmcyd@switchback.proxy.rlwy.net:56643/railway`""
Set-Content -Path .env -Value $railwayUrl

Write-Host "`nPushing Prisma schema to Railway..." -ForegroundColor Cyan
pnpm prisma db push --accept-data-loss --skip-generate

# Restore original .env
if (Test-Path .env.local) {
    Write-Host "`nRestoring original .env..." -ForegroundColor Yellow
    Move-Item .env.local .env -Force
}

Write-Host "`n✅ Done!" -ForegroundColor Green
