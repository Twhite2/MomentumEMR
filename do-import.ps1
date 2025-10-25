Set-Location packages\database
Write-Host "Creating schema..."
npx prisma db push --accept-data-loss --skip-generate
Write-Host "Importing data..."
npx tsx scripts/import-data.ts
Set-Location ..\..
Write-Host "Done!"
