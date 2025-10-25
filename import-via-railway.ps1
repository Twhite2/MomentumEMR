Write-Host "Importing database to Railway..." -ForegroundColor Green
railway run psql $env:DATABASE_URL -f momentum_emr_backup.sql
