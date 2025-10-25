$env:DATABASE_URL="postgresql://postgres:YeBhLWVVMGLnRklInXBQWSVpggsLmcyd@switchback.proxy.rlwy.net:56643/railway"
cd packages\database
npx prisma migrate deploy
