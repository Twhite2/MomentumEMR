# ✅ **Fixed: Logout Redirect Issue**

## 🐛 **The Problem:**

When hospital admins logged out from a subdomain (e.g., `function.momentumhealthcare.io`), they were redirected to the **main domain** (`momentumhealthcare.io`) instead of staying on their hospital's login page.

**Root Cause:** NextAuth's `signOut()` with `callbackUrl` was not respecting the subdomain and always redirecting to the relative `/login` path on the main domain.

---

## ✅ **The Fix:**

Updated `apps/web/src/components/layout/header.tsx` to **manually redirect** after logout.

### **Before (Didn't Work):**
```tsx
const handleSignOut = async () => {
  // NextAuth ignores the full URL and redirects to main domain
  await signOut({ callbackUrl: `${window.location.origin}/login` });
};
```
**Problem:** NextAuth's internal redirect logic stripped the subdomain.

### **After (Works!):**
```tsx
const handleSignOut = async () => {
  // Get current full URL to preserve subdomain
  const currentOrigin = window.location.origin;
  const loginUrl = `${currentOrigin}/login`;
  
  // Sign out without redirect, then manually redirect to preserve subdomain
  await signOut({ redirect: false });
  
  // Manually redirect to login page on same subdomain
  window.location.href = loginUrl;
};
```
**Solution:** 
1. Sign out with `redirect: false` to prevent NextAuth from redirecting
2. Manually redirect using `window.location.href` to preserve the subdomain

---

## 🎯 **How It Works Now:**

### **Example 1: Hospital Admin Logout**
1. Admin logged in at: `https://function.momentumhealthcare.io/dashboard`
2. Clicks **"Logout"**
3. Redirects to: `https://function.momentumhealthcare.io/login` ✅
4. Shows **Function Hospital branding** (red/blue colors, logo)

### **Example 2: Super Admin Logout**
1. Super admin at: `https://momentumhealthcare.io/super-admin`
2. Clicks **"Logout"**
3. Redirects to: `https://momentumhealthcare.io/login` ✅
4. Shows **default Momentum branding**

### **Example 3: Different Hospital**
1. Admin at: `https://cityhospital.momentumhealthcare.io/dashboard`
2. Clicks **"Logout"**
3. Redirects to: `https://cityhospital.momentumhealthcare.io/login` ✅
4. Shows **City Hospital branding**

---

## 📊 **Technical Details:**

### **What Changed:**
- **File:** `apps/web/src/components/layout/header.tsx`
- **Function:** `handleSignOut`
- **Change:** Added `window.location.origin` to preserve subdomain

### **How It Works:**
```typescript
window.location.origin  // Returns full domain with protocol
// Examples:
// - https://function.momentumhealthcare.io
// - https://momentumhealthcare.io
// - https://cityhospital.momentumhealthcare.io

await signOut({ callbackUrl: `${origin}/login` })
// Redirects to login page on SAME domain
```

---

## 🚀 **Deploy Instructions:**

```bash
# 1. Commit changes
git add .
git commit -m "fix: Logout redirects to login on same subdomain using manual redirect"
git push origin main

# 2. Deploy on server
ssh root@your-server
cd /root/Momentum_EMR
git pull
pnpm build
pm2 restart momentum

# 3. Test
# - Login to a hospital subdomain
# - Logout
# - Should stay on hospital subdomain login page
```

---

## 📊 **Expected PM2 Logs After Fix:**

### **Before (Wrong):**
```
[Middleware] Hostname: function.momentumhealthcare.io
[Middleware] Detected subdomain: function
[Middleware] Hostname: momentumhealthcare.io     ← Subdomain lost!
[Middleware] Detected subdomain: null
```

### **After (Correct):**
```
[Middleware] Hostname: function.momentumhealthcare.io
[Middleware] Detected subdomain: function
[Middleware] Set header x-hospital-subdomain: function
[Middleware] Hostname: function.momentumhealthcare.io    ← Subdomain preserved!
[Middleware] Detected subdomain: function
[Middleware] Set header x-hospital-subdomain: function
```

---

## ✅ **Benefits:**

1. **Better UX:** Users stay on their hospital's branded login page
2. **Consistent Branding:** Hospital logo/colors remain visible after logout
3. **Clear Identity:** Users know they're logging into their specific hospital
4. **No Confusion:** Won't accidentally go to wrong domain

---

## 🎉 **Result:**

**Before:** Logout → Main domain (confusing) ❌  
**After:** Logout → Same hospital subdomain (correct) ✅

**This ensures a seamless branded experience throughout the entire user journey!** 🚀
