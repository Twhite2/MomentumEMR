@echo off
echo ============================================
echo Momentum EMR - Installation Script
echo ============================================
echo.

echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js 20+ first.
    pause
    exit /b 1
)
echo Node.js found!
echo.

echo [2/5] Checking pnpm installation...
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo pnpm not found. Installing pnpm globally...
    npm install -g pnpm
) else (
    echo pnpm found!
)
echo.

echo [3/5] Installing dependencies...
pnpm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo [4/5] Generating Prisma client...
pnpm db:generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)
echo.

echo [5/5] Setup complete!
echo.
echo ============================================
echo Next Steps:
echo ============================================
echo 1. Create .env file in apps/web/ (see apps/web/.env.example)
echo 2. Set your DATABASE_URL (use Railway or local PostgreSQL)
echo 3. Run: pnpm db:push (to create database tables)
echo 4. Run: cd packages/database ^&^& pnpm seed (to add sample data)
echo 5. Run: pnpm dev (to start development server)
echo.
echo See SETUP.md for detailed instructions.
echo ============================================
echo.
pause
