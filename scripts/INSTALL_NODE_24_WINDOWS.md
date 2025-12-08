# Install Node.js 24 on Windows - Complete Guide

## Step 1: Uninstall Current Node.js

### Method A: Using Windows Settings (Recommended)

```powershell
# Open Windows Settings and uninstall
Start-Process ms-settings:appsfeatures

# Search for "Node.js" and uninstall it
# OR use PowerShell to uninstall directly:

# Get Node.js package name
Get-Package -Name "Node.js" | Format-Table Name, Version

# Uninstall Node.js
Get-Package -Name "Node.js" | Uninstall-Package -Force
```

**Manual Steps:**
1. Press `Win + I` to open Settings
2. Go to **Apps** → **Installed apps**
3. Search for "Node.js"
4. Click the **three dots** → **Uninstall**
5. Follow the uninstaller prompts

### Method B: Using Control Panel

1. Press `Win + R`
2. Type `appwiz.cpl` and press Enter
3. Find "Node.js" in the list
4. Right-click → **Uninstall**
5. Follow the prompts

---

## Step 2: Clean Up Remaining Files

After uninstalling, clean up leftover files:

```powershell
# Remove npm cache
Remove-Item -Path "$env:APPDATA\npm" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:APPDATA\npm-cache" -Recurse -Force -ErrorAction SilentlyContinue

# Remove Node.js folders
Remove-Item -Path "C:\Program Files\nodejs" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "C:\Program Files (x86)\nodejs" -Recurse -Force -ErrorAction SilentlyContinue

# Clear environment PATH (optional - will be set by new installer)
# The new Node installer will update PATH automatically
```

---

## Step 3: Install Node.js 24

### If You Downloaded the Installer

1. **Locate your downloaded file:**
   - Usually in `Downloads` folder
   - Filename: `node-v24.x.x-x64.msi`

2. **Run the installer:**
   ```powershell
   # Navigate to Downloads
   cd ~\Downloads
   
   # Find and run the installer
   Get-ChildItem -Filter "node-v24*.msi" | Select-Object -First 1 | ForEach-Object { Start-Process $_.FullName }
   ```

3. **Follow installation wizard:**
   - ✅ Accept license agreement
   - ✅ Choose installation path (default: `C:\Program Files\nodejs`)
   - ✅ **CHECK** "Automatically install necessary tools" (installs Python, Visual Studio Build Tools)
   - ✅ Click **Install**

### If You Haven't Downloaded Yet

**Download Node.js 24 LTS:**

```powershell
# Open browser to download page
Start-Process "https://nodejs.org/download/release/latest-v24.x/"

# Download the Windows 64-bit installer (.msi)
# Filename: node-v24.x.x-x64.msi
```

**Or use PowerShell to download directly:**

```powershell
# Create downloads directory if needed
$downloadsPath = "$env:USERPROFILE\Downloads"

# Download latest Node.js 24 installer
$nodeUrl = "https://nodejs.org/dist/v24.11.1/node-v24.11.1-x64.msi"
$installerPath = "$downloadsPath\node-v24.11.1-x64.msi"

Write-Host "Downloading Node.js 24.11.1..." -ForegroundColor Green
Invoke-WebRequest -Uri $nodeUrl -OutFile $installerPath

Write-Host "Download complete! Starting installer..." -ForegroundColor Green
Start-Process $installerPath -Wait
```

---

## Step 4: Verify Installation

**Close and reopen PowerShell**, then run:

```powershell
# Check Node.js version
node --version
# Should show: v24.11.1 (or similar)

# Check npm version
npm --version
# Should show: 11.x.x

# Check installation path
where.exe node
# Should show: C:\Program Files\nodejs\node.exe
```

---

## Step 5: Configure npm and pnpm

### Update npm to Latest

```powershell
# Update npm globally
npm install -g npm@latest

# Verify
npm --version
```

### Install pnpm

```powershell
# Install pnpm globally
npm install -g pnpm@9.15.0

# Verify
pnpm --version
# Should show: 9.15.0
```

### Configure npm/pnpm (Optional but Recommended)

```powershell
# Set npm registry (if in restricted network)
npm config set registry https://registry.npmjs.org/

# Increase npm timeout for slow connections
npm config set fetch-timeout 60000

# Configure pnpm store location (optional)
pnpm config set store-dir "C:\pnpm-store"
```

---

## Step 6: Test with Momentum EMR

### Clean Previous Node Modules

```powershell
# Navigate to your project
cd C:\Users\PC\Documents\Momentum\EMR

# Remove old node_modules and lock files
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "apps\web\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "packages\database\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "packages\ui\node_modules" -Recurse -Force -ErrorAction SilentlyContinue

# Remove lock files
Remove-Item -Path "pnpm-lock.yaml" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue

# Remove build artifacts
Remove-Item -Path "apps\web\.next" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".turbo" -Recurse -Force -ErrorAction SilentlyContinue
```

### Install Dependencies

```powershell
# Install all dependencies with pnpm
pnpm install

# This will:
# - Install all packages
# - Generate Prisma client (via postinstall)
# - Link workspace dependencies
```

### Generate Prisma Client

```powershell
# Generate Prisma client
pnpm db:generate
```

### Build the Project

```powershell
# Build entire project
pnpm build

# If build fails, try:
pnpm clean
pnpm install
pnpm build
```

### Run Development Server

```powershell
# Start dev server
pnpm dev

# Open browser to http://localhost:3000
# Test all features:
# ✅ Login/logout
# ✅ Patient management
# ✅ Invoices
# ✅ Lab orders
# ✅ Medical records
# ✅ Chat functionality
# ✅ File uploads
```

---

## Troubleshooting

### Issue: "node is not recognized"

**Solution:** PATH not updated

```powershell
# Close and reopen PowerShell/Terminal
# OR manually add to PATH:

$env:Path += ";C:\Program Files\nodejs"

# Verify
node --version
```

### Issue: "pnpm install" fails with Python errors

**Solution:** Install Windows Build Tools

```powershell
# Run as Administrator
npm install -g windows-build-tools

# OR install Visual Studio Build Tools manually:
Start-Process "https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022"
```

### Issue: Prisma generation fails

**Solution:**

```powershell
# Navigate to database package
cd packages\database

# Clear Prisma cache
Remove-Item -Path "node_modules\.prisma" -Recurse -Force -ErrorAction SilentlyContinue

# Regenerate
pnpm prisma generate

# Return to root
cd ..\..
```

### Issue: Build fails with TypeScript errors

**Solution:**

```powershell
# Update TypeScript
pnpm update typescript

# Clear TypeScript cache
Remove-Item -Path "**\*.tsbuildinfo" -Recurse -Force -ErrorAction SilentlyContinue

# Rebuild
pnpm build
```

### Issue: Port 3000 already in use

**Solution:**

```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# OR use a different port
$env:PORT = 3001
pnpm dev
```

---

## Complete Fresh Install Script

Copy and run this entire script in **PowerShell (as Administrator)**:

```powershell
# ============================================
# Complete Node.js 24 Installation Script
# ============================================

Write-Host "Starting Node.js 24 installation process..." -ForegroundColor Cyan

# Step 1: Uninstall old Node.js
Write-Host "`n[Step 1/6] Uninstalling old Node.js..." -ForegroundColor Yellow
Get-Package -Name "Node.js" -ErrorAction SilentlyContinue | Uninstall-Package -Force

# Step 2: Clean up old files
Write-Host "`n[Step 2/6] Cleaning up old files..." -ForegroundColor Yellow
Remove-Item -Path "$env:APPDATA\npm" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:APPDATA\npm-cache" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "C:\Program Files\nodejs" -Recurse -Force -ErrorAction SilentlyContinue

# Step 3: Download Node.js 24
Write-Host "`n[Step 3/6] Downloading Node.js 24.11.1..." -ForegroundColor Yellow
$downloadsPath = "$env:USERPROFILE\Downloads"
$nodeUrl = "https://nodejs.org/dist/v24.11.1/node-v24.11.1-x64.msi"
$installerPath = "$downloadsPath\node-v24.11.1-x64.msi"

Invoke-WebRequest -Uri $nodeUrl -OutFile $installerPath
Write-Host "Download complete!" -ForegroundColor Green

# Step 4: Install Node.js
Write-Host "`n[Step 4/6] Installing Node.js 24..." -ForegroundColor Yellow
Write-Host "Please complete the installation wizard..." -ForegroundColor Cyan
Start-Process $installerPath -Wait

# Step 5: Verify installation
Write-Host "`n[Step 5/6] Verifying installation..." -ForegroundColor Yellow
Write-Host "Please close this PowerShell window and open a NEW one, then run:" -ForegroundColor Cyan
Write-Host "node --version" -ForegroundColor White
Write-Host "npm --version" -ForegroundColor White

# Step 6: Next steps
Write-Host "`n[Step 6/6] Next steps:" -ForegroundColor Yellow
Write-Host "1. Close this window" -ForegroundColor White
Write-Host "2. Open NEW PowerShell" -ForegroundColor White
Write-Host "3. Run: npm install -g pnpm@9.15.0" -ForegroundColor White
Write-Host "4. Run: cd C:\Users\PC\Documents\Momentum\EMR" -ForegroundColor White
Write-Host "5. Run: pnpm install" -ForegroundColor White
Write-Host "6. Run: pnpm dev" -ForegroundColor White

Write-Host "`nInstallation script complete! ✓" -ForegroundColor Green
```

---

## Post-Installation Checklist

After installing Node.js 24:

- [ ] Close all PowerShell/Terminal windows
- [ ] Open **NEW** PowerShell window
- [ ] Verify: `node --version` shows v24.x.x
- [ ] Verify: `npm --version` shows 11.x.x
- [ ] Install pnpm: `npm install -g pnpm@9.15.0`
- [ ] Navigate to project: `cd C:\Users\PC\Documents\Momentum\EMR`
- [ ] Clean: Delete `node_modules`, `pnpm-lock.yaml`
- [ ] Install: `pnpm install`
- [ ] Generate: `pnpm db:generate`
- [ ] Build: `pnpm build`
- [ ] Test: `pnpm dev`
- [ ] Verify all features work in browser

---

## Quick Commands Reference

```powershell
# Check versions
node --version
npm --version
pnpm --version

# Navigate to project
cd C:\Users\PC\Documents\Momentum\EMR

# Clean install
Remove-Item node_modules -Recurse -Force
pnpm install

# Run dev server
pnpm dev

# Build for production
pnpm build

# Check for issues
pnpm audit
```

---

## Success Indicators

✅ `node --version` returns `v24.11.1` or higher  
✅ `npm --version` returns `11.x.x`  
✅ `pnpm install` completes without errors  
✅ `pnpm build` succeeds  
✅ `pnpm dev` starts development server  
✅ Website loads at http://localhost:3000  
✅ All features work (login, patients, invoices, etc.)  

---

**You're ready to deploy to Digital Ocean with Node.js 24!** 🚀
