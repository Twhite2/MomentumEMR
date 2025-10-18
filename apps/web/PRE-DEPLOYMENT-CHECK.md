# Pre-Deployment Check Guide

This guide explains how to properly check your code before pushing to production to catch all TypeScript errors that Railway/production builds would catch.

## 🎯 Quick Commands

### Before Every Push to Production

```bash
# From apps/web directory
pnpm verify
```

This runs the complete check script that:
1. ✅ Clears all caches
2. ✅ Runs strict TypeScript checking
3. ✅ Runs ESLint
4. ✅ Builds production bundle

---

## 📋 Available Scripts

### `pnpm verify`
**Full pre-deployment check (5-7 minutes)**
- Runs the PowerShell script `check-build.ps1`
- Clears all caches
- Strict TypeScript check
- ESLint
- Production build
- **Use this before every deployment!**

### `pnpm type-check:strict`
**Quick TypeScript check with no cache (1-2 minutes)**
- Forces TypeScript to re-check all files
- No incremental compilation
- Catches implicit 'any' errors
- **Use this before committing**

### `pnpm clean`
**Clear build caches**
- Removes `.next` folder
- Removes `tsconfig.tsbuildinfo`
- Removes `node_modules/.cache`

### `pnpm build:clean`
**Clean build**
- Clears caches first
- Then builds production bundle

---

## 🚨 Why Cache Causes Problems

### The Issue
TypeScript and Next.js use caching to speed up builds. When you enable stricter settings in `tsconfig.json`, cached results don't reflect the new strictness.

### Local vs Production
- **Local:** Uses cached results from previous builds
- **Railway/Production:** Always builds fresh from scratch

This means errors can pass locally but fail in production!

---

## ✅ Recommended Workflow

### Before Committing Code
```bash
cd apps/web
pnpm type-check:strict
```

### Before Pushing to Production
```bash
cd apps/web
pnpm verify
```

### If Build Fails Locally
```bash
# Clear everything and try again
cd apps/web
pnpm clean
pnpm build
```

### If Build Fails on Railway
```bash
# Simulate Railway's exact environment
cd apps/web
Remove-Item -Recurse -Force node_modules
pnpm install
pnpm verify
```

---

## 🔧 Troubleshooting

### TypeScript Errors Not Showing Locally

**Problem:** `tsc --noEmit` passes locally but fails on Railway

**Solution:**
```bash
# Force TypeScript to re-check everything
pnpm type-check:strict
```

### Build Succeeds Locally but Fails on Railway

**Problem:** Turbo cache is being used

**Solution (from root directory):**
```bash
pnpm turbo clean
cd apps/web
pnpm verify
```

### "Parameter implicitly has 'any' type" Errors

**Problem:** Callback parameters without explicit types

**Example:**
```typescript
// ❌ Wrong
items.map((item) => item.name)

// ✅ Correct
items.map((item: { name: string }) => item.name)
```

**Solution:** Add explicit types to ALL callback parameters in:
- `.map()`
- `.filter()`
- `.reduce()`
- `.forEach()`
- `.find()`
- `.sort()`

---

## 📊 TypeScript Strictness Settings

Our `tsconfig.json` uses **Railway-level strictness**:

```json
{
  "noImplicitAny": true,              // No implicit any
  "strictNullChecks": true,           // Null checking
  "noImplicitReturns": true,          // All paths return
  "noFallthroughCasesInSwitch": true, // No fallthrough
  "noImplicitOverride": true,         // Explicit override
  "allowUnreachableCode": false       // No dead code
}
```

---

## 🎯 CI/CD Integration

### GitHub Actions (Recommended)
Add this to `.github/workflows/test.yml`:

```yaml
- name: Type Check
  run: |
    cd apps/web
    pnpm type-check:strict

- name: Build
  run: |
    cd apps/web
    pnpm build
```

### Pre-commit Hook
The `precommit` script automatically runs strict type checking before commits.

---

## 📝 Summary

**Always run before pushing to production:**
```bash
pnpm verify
```

**This catches the EXACT same errors that Railway catches!** 🎯
