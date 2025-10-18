# Momentum EMR - Pre-Deployment Build Check Script
# This script ensures all errors are caught before pushing to production

Write-Host "🚀 Momentum EMR - Pre-Deployment Check" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

# Clear all caches
Write-Host "🧹 Step 1: Clearing caches..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Force tsconfig.tsbuildinfo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue

Write-Host "✅ Caches cleared!`n" -ForegroundColor Green

# Run TypeScript check with no cache
Write-Host "📝 Step 2: Running TypeScript type check (strict mode)..." -ForegroundColor Yellow
npx tsc --noEmit --incremental false

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ TypeScript errors found!" -ForegroundColor Red
    Write-Host "Fix the errors above before deploying.`n" -ForegroundColor Red
    exit 1
}

Write-Host "✅ TypeScript check passed!`n" -ForegroundColor Green

# Run ESLint (but don't fail on warnings)
Write-Host "📋 Step 3: Running ESLint..." -ForegroundColor Yellow
pnpm lint

Write-Host "`n✅ Linting complete!`n" -ForegroundColor Green

# Run fresh production build
Write-Host "🔨 Step 4: Running production build (no cache)..." -ForegroundColor Yellow
$env:NEXT_TELEMETRY_DISABLED = "1"
pnpm build

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Build failed!" -ForegroundColor Red
    Write-Host "Fix the build errors above before deploying.`n" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Build successful!" -ForegroundColor Green

# Summary
Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "🎉 All checks passed!" -ForegroundColor Green
Write-Host "🚀 Ready for deployment to Railway!" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan
