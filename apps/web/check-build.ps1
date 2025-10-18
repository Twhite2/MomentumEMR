# Momentum EMR - Pre-Deployment Build Check Script
# This script ensures all errors are caught before pushing to production

Write-Host "Momentum EMR - Pre-Deployment Check" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Clear all caches
Write-Host "Step 1: Clearing caches..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Force tsconfig.tsbuildinfo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue

Write-Host "Caches cleared!" -ForegroundColor Green
Write-Host ""

# Run TypeScript check with no cache
Write-Host "Step 2: Running TypeScript type check (strict mode)..." -ForegroundColor Yellow
npx tsc --noEmit --incremental false

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: TypeScript errors found!" -ForegroundColor Red
    Write-Host "Fix the errors above before deploying." -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "TypeScript check passed!" -ForegroundColor Green
Write-Host ""

# Run ESLint (but don't fail on warnings)
Write-Host "Step 3: Running ESLint..." -ForegroundColor Yellow
pnpm lint

Write-Host ""
Write-Host "Linting complete!" -ForegroundColor Green
Write-Host ""

# Run fresh production build
Write-Host "Step 4: Running production build (no cache)..." -ForegroundColor Yellow
$env:NEXT_TELEMETRY_DISABLED = "1"
pnpm build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    Write-Host "Fix the build errors above before deploying." -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "Build successful!" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "All checks passed!" -ForegroundColor Green
Write-Host "Ready for deployment to Railway!" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
