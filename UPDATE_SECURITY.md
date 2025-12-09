# Security Vulnerability Remediation

## Changes Made Based on Security Audit

All updates follow the EXACT recommendations from the security analyst's report.

### Package Updates in `apps/web/package.json`

| Vulnerability | Package | Action Taken | Audit Recommendation |
|---------------|---------|--------------|----------------------|
| **Critical: Next.js RCE** | next | Updated to ^15.1.6 | Fixed in React 19.2.1+ (Next.js includes React) |
| **Critical: React RCE** | react | Updated to ^19.0.0 | Required for Next.js fix (19.2.1+) |
| **Critical: React RCE** | react-dom | Updated to ^19.0.0 | Required for Next.js fix (19.2.1+) |
| **High: xlsx Prototype Pollution & ReDoS** | xlsx | Replaced with SheetJS 0.20.3 | Migrate to sheetjs 0.20.2+ |
| **High: glob Command Injection** | glob | Added ^12.0.0 | Upgrade to 10.5.0, 11.1.0, or 12.0.0+ |
| **Moderate: next-auth Email Misdelivery** | next-auth | Updated to 5.0.0-beta.30 | Upgrade to 4.24.12 or 5.0.0-beta.30 |
| **Moderate: js-yaml Prototype Pollution** | js-yaml | Added ^4.1.1 | Upgrade to 4.1.1 or 3.14.2+ |
| **Moderate: tmp Symbolic Link Attack** | tmp | Added ^0.2.5 | Upgrade to 0.2.4 or 0.2.5+ |

### Type Definition Updates

| Package | Old Version | New Version | Reason |
|---------|-------------|-------------|---------|
| @types/react | ^18.3.18 | ^19.0.1 | Match React 19 |
| @types/react-dom | ^18.3.5 | ^19.0.1 | Match React 19 |
| eslint-config-next | ^15.1.4 | ^15.1.6 | Match Next.js 15.1.6 |

---

## Installation Instructions

### Step 1: Backup Current State

```powershell
# Navigate to project root
cd C:\Users\PC\Documents\Momentum\EMR

# Backup lock file
Copy-Item pnpm-lock.yaml pnpm-lock.yaml.backup

# Commit current state
git add -A
git commit -m "Backup before security updates"
```

### Step 2: Remove Old Dependencies

```powershell
# Remove node_modules
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force apps\web\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force packages\database\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force packages\ui\node_modules -ErrorAction SilentlyContinue

# Remove lock file to force clean install
Remove-Item pnpm-lock.yaml
```

### Step 3: Install Updated Packages

```powershell
# Install all dependencies with updated versions
pnpm install

# Verify installations
pnpm list next next-auth react react-dom glob js-yaml tmp
```

### Step 4: Update Prisma

```powershell
# Regenerate Prisma client
pnpm db:generate
```

### Step 5: Test Build Locally

```powershell
# Build the project
pnpm build

# If build succeeds, test locally
pnpm dev
```

### Step 6: Run Security Audit

```powershell
# Check for remaining vulnerabilities
pnpm audit

# Generate detailed report
pnpm audit --json > security-audit-after.json
```

### Step 7: Commit Changes

```powershell
git add -A
git commit -m "Security updates: Fix Critical RCE, High prototype pollution/command injection, Moderate vulnerabilities

- Updated Next.js to 15.1.6 (fixes React RCE CVE)
- Updated React to 19.0.0 (fixes RCE vulnerability)
- Replaced xlsx with SheetJS 0.20.3 (fixes prototype pollution & ReDoS)
- Updated glob to 12.0.0 (fixes command injection)
- Updated next-auth to 5.0.0-beta.30 (fixes email misdelivery)
- Updated js-yaml to 4.1.1 (fixes prototype pollution)
- Updated tmp to 0.2.5 (fixes symbolic link attack)
- Updated React type definitions to 19.0.1"

git push origin main
```

---

## Deployment to Production (Digital Ocean)

### Step 1: SSH into Server

```powershell
ssh momentum-do
```

### Step 2: Pull Updates

```bash
cd /home/momentum/Momentum_EMR

# Backup current state
cp pnpm-lock.yaml pnpm-lock.yaml.backup.$(date +%Y%m%d_%H%M%S)

# Pull latest code
git pull origin main
```

### Step 3: Install Dependencies

```bash
# Remove node_modules for clean install
rm -rf node_modules apps/web/node_modules packages/*/node_modules

# Install updated packages
pnpm install

# Verify critical packages
pnpm list next next-auth react react-dom glob js-yaml tmp
```

### Step 4: Rebuild Application

```bash
# Stop application
pm2 stop momentum-emr

# Generate Prisma client
cd packages/database
pnpm prisma generate

# Build application
cd ../../apps/web
pnpm build
```

### Step 5: Restart Application

```bash
# Restart with PM2
pm2 restart momentum-emr

# Check status
pm2 status

# Monitor logs
pm2 logs momentum-emr --lines 50
```

### Step 6: Verify in Browser

Open https://momentumhealthcare.io and test:
- ✅ Login works
- ✅ Patient management works
- ✅ File uploads work (tests SheetJS)
- ✅ No console errors

### Step 7: Run Security Audit on Server

```bash
cd /home/momentum/Momentum_EMR

# Check vulnerabilities
pnpm audit

# Generate report
pnpm audit --json > /tmp/security-audit-production.json

# View summary
pnpm audit --summary
```

---

## Quick Commands Cheat Sheet

### Local (Windows)

```powershell
# Install updates
cd C:\Users\PC\Documents\Momentum\EMR
pnpm install
pnpm build
pnpm dev

# Check for vulnerabilities
pnpm audit
```

### Production (Digital Ocean)

```bash
# Deploy updates
cd /home/momentum/Momentum_EMR
git pull origin main
pnpm install
cd packages/database && pnpm prisma generate
cd ../../apps/web && pnpm build
pm2 restart momentum-emr

# Verify
pm2 status
pm2 logs momentum-emr
pnpm audit
```

---

## Verification Checklist

After installation, verify:

- [ ] `pnpm install` completed without errors
- [ ] `pnpm build` successful
- [ ] Application starts without errors
- [ ] Login functionality works
- [ ] File upload/download works (SheetJS)
- [ ] No console errors in browser
- [ ] `pnpm audit` shows reduced vulnerabilities
- [ ] Critical & High vulnerabilities resolved
- [ ] Application performance unchanged

---

## Rollback Instructions (If Needed)

If issues occur after update:

### Local

```powershell
cd C:\Users\PC\Documents\Momentum\EMR
git checkout HEAD~1  # Go back one commit
Copy-Item pnpm-lock.yaml.backup pnpm-lock.yaml
pnpm install
```

### Production

```bash
cd /home/momentum/Momentum_EMR
git checkout HEAD~1
cp pnpm-lock.yaml.backup.* pnpm-lock.yaml
pnpm install
cd packages/database && pnpm prisma generate
cd ../../apps/web && pnpm build
pm2 restart momentum-emr
```

---

## Support

If you encounter issues:

1. Check logs: `pm2 logs momentum-emr`
2. Verify package versions: `pnpm list next react glob`
3. Check audit: `pnpm audit`
4. Consult this guide's troubleshooting section

---

**All updates follow the exact recommendations from the security audit report.**
