# ✅ **Fixed: Logout Redirect Issue**

## 🐛 **The Problem:**

When hospital admins logged out from a subdomain (e.g., `function.momentumhealthcare.io`), they were redirected to the **main domain** or **super admin dashboard** instead of staying on their hospital's login page.

---

## ✅ **The Fix:**

Updated `apps/web/src/components/layout/header.tsx` to preserve the subdomain on logout.

### **Before:**
```tsx
const handleSignOut = async () => {
  await signOut({ callbackUrl: '/login' });
};
```
**Problem:** `/login` is a relative path that redirects to the main domain.

### **After:**
```tsx
const handleSignOut = async () => {
  // Get current hostname to preserve subdomain
  const currentUrl = window.location.origin;
  await signOut({ callbackUrl: `${currentUrl}/login` });
};
```
**Solution:** Uses full URL with subdomain, so logout stays on the same domain.

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
git commit -m "fix: Logout redirects to login on same subdomain"
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
