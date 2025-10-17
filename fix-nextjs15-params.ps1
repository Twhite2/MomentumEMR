# PowerShell script to fix Next.js 15 params Promise breaking change
# This script updates all route handlers to use the new params format

$apiDir = "apps\web\src\app\api"

# Find all route.ts files with [id] or other dynamic segments
$routeFiles = Get-ChildItem -Path $apiDir -Filter "route.ts" -Recurse | 
    Where-Object { $_.Directory.Name -match '\[.*\]' }

$count = 0

foreach ($file in $routeFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    $modified = $false
    
    # Pattern 1: { params }: { params: { id: string } }
    if ($content -match '\{\s*params\s*\}:\s*\{\s*params:\s*\{\s*id:\s*string\s*\}\s*\}') {
        $content = $content -replace '\{\s*params\s*\}:\s*\{\s*params:\s*\{\s*id:\s*string\s*\}\s*\}', 
            'context: { params: Promise<{ id: string }> }'
        $modified = $true
    }
    
    # Pattern 2: { params }: { params: { category: string; fileId: string } }
    if ($content -match '\{\s*params\s*\}:\s*\{\s*params:\s*\{\s*category:\s*string;\s*fileId:\s*string\s*\}\s*\}') {
        $content = $content -replace '\{\s*params\s*\}:\s*\{\s*params:\s*\{\s*category:\s*string;\s*fileId:\s*string\s*\}\s*\}',
            'context: { params: Promise<{ category: string; fileId: string }> }'
        $modified = $true
    }
    
    # Add await params after context if modified
    if ($modified) {
        # Add const params = await context.params; after try {
        $content = $content -replace '(\)\s*\{\s*try\s*\{)', "`$1`n    const params = await context.params;"
        
        Set-Content -Path $file.FullName -Value $content
        $count++
        Write-Host "Fixed: $($file.FullName)"
    }
}

Write-Host "`nTotal files fixed: $count"
