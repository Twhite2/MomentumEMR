# 🔍 **Quick Branding Diagnostic**

## **Step 1: Check Database (Run this on your server)**

```bash
ssh root@your-server
psql momentum_emr
```

Then run:

```sql
SELECT 
  id,
  name,
  subdomain,
  active,
  "logoUrl",
  "primaryColor",
  "secondaryColor",
  tagline
FROM hospitals
WHERE subdomain = 'function';
```

**Copy the output and send it to me!**

---

## **Step 2: Test API Directly**

Open browser and visit:
```
https://function.momentumhealthcare.io/api/branding/public
```

**What do you see?**
- If you see JSON with hospital data → API works ✅
- If you see error/404 → API issue ❌

---

## **Step 3: Check Browser Console**

1. Visit: `https://function.momentumhealthcare.io/login`
2. Press F12 → Console tab
3. **Copy ALL the logs** that start with:
   - `[Middleware]`
   - `[Branding API]`
   - `[Login]`

---

## **Step 4: Check PM2 Logs**

```bash
ssh root@your-server
pm2 logs momentum --lines 100 | grep -E "Middleware|Branding"
```

**Copy the output!**

---

## **Most Common Issues:**

### **Issue 1: Subdomain = 'function' but Database has different name**
Check: Does database have EXACTLY `subdomain = 'function'` (lowercase)?

### **Issue 2: Colors don't have # prefix**
Check: Colors should be `#e00000` not `e00000`

```sql
-- Fix colors if needed
UPDATE hospitals
SET 
  "primaryColor" = '#e00000',
  "secondaryColor" = '#2368c7'
WHERE subdomain = 'function';
```

### **Issue 3: Logo path is wrong**
Check: Logo URL exists? Try external URL instead:

```sql
-- Use imgur or similar for testing
UPDATE hospitals
SET "logoUrl" = 'https://i.imgur.com/your-image.png'
WHERE subdomain = 'function';
```

---

## **Quick Test:**

Visit these URLs and tell me what happens:

1. `https://function.momentumhealthcare.io/api/branding/public` → What JSON do you see?
2. `https://function.momentumhealthcare.io/login` → What's in the browser console?
3. `https://function.momentumhealthcare.io/login` → View page source, search for "style" - do you see any inline styles with colors?

**Send me the results and I'll tell you exactly what's wrong!** 🔍
