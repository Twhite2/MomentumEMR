# PowerShell script to replace hardcoded tory-blue with dynamic primary color

$files = Get-ChildItem -Path "apps\web\src" -Filter "*.tsx" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $updated = $content -replace 'text-tory-blue', 'text-primary'
    $updated = $updated -replace 'bg-tory-blue', 'bg-primary'
    $updated = $updated -replace 'border-tory-blue', 'border-primary'
    $updated = $updated -replace 'hover:text-tory-blue', 'hover:text-primary'
    $updated = $updated -replace 'hover:bg-tory-blue', 'hover:bg-primary'
    
    if ($content -ne $updated) {
        Set-Content -Path $file.FullName -Value $updated
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "Color replacement complete!"
