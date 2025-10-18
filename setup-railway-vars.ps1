# Railway Environment Variables Setup Script
# This script sets up all environment variables for your Momentum EMR deployment

Write-Host "Setting up Railway Environment Variables..." -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Check if railway CLI is logged in
Write-Host "Checking Railway CLI authentication..." -ForegroundColor Yellow
railway whoami
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Not logged in to Railway. Please run 'railway login' first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Linking to Railway project..." -ForegroundColor Yellow
railway link

Write-Host ""
Write-Host "Setting environment variables..." -ForegroundColor Yellow
Write-Host ""

# NOTE: DATABASE_URL will be automatically provided by Railway PostgreSQL service
# You need to add a PostgreSQL database to your Railway project first

# Set all variables in one command for efficiency
Write-Host "Setting all environment variables..." -ForegroundColor Green
railway variables `
  --set "AUTH_SECRET=EMhkl8TwsZzphBLAd+2nniHB0VavzMkXG6d5b3Mj+EI=" `
  --set "NEXTAUTH_SECRET=EMhkl8TwsZzphBLAd+2nniHB0VavzMkXG6d5b3Mj+EI=" `
  --set "AUTH_TRUST_HOST=true" `
  --set "NODE_ENV=production" `
  --set "B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com" `
  --set "B2_REGION=us-west-004" `
  --set "B2_KEY_ID=005222359ed5cd80000000001" `
  --set "B2_APPLICATION_KEY=K005qrAoALE7AiMsSlOl+Wm+0Tc9/Jo" `
  --set "B2_BUCKET_NAME=emr-uploads" `
  --set "NOTIFICATIONAPI_CLIENT_ID=l927yffnep8bnj39sn9itaizah" `
  --set "NOTIFICATIONAPI_CLIENT_SECRET=39iiraqkmf5bmiq1izn67w095aar8dospzgb28cmnzhyswda08ylkwsr03" `
  --set "NEXT_PUBLIC_NOTIFICATIONAPI_CLIENT_ID=l927yffnep8bnj39sn9itaizah"

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Environment variables set successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Add PostgreSQL database to your Railway project" -ForegroundColor White
Write-Host "   - Go to Railway Dashboard" -ForegroundColor White
Write-Host "   - Click 'New' -> 'Database' -> 'PostgreSQL'" -ForegroundColor White
Write-Host "   - DATABASE_URL will be automatically set" -ForegroundColor White
Write-Host ""
Write-Host "2. After deployment, set AUTH_URL to your Railway domain:" -ForegroundColor White
Write-Host "   railway variables --set AUTH_URL=https://your-app.railway.app" -ForegroundColor White
Write-Host "   railway variables --set NEXTAUTH_URL=https://your-app.railway.app" -ForegroundColor White
Write-Host ""
Write-Host "3. Redeploy your application:" -ForegroundColor White
Write-Host "   railway up" -ForegroundColor White
Write-Host ""
Write-Host "Or simply push to GitHub and Railway will auto-deploy!" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
