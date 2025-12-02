# 🔧 **Hospital Branding Troubleshooting Guide**

## 🐛 **Issue: Branding Not Showing on Login Page**

### **Step 1: Check Database**

Connect to your database and run:

```sql
-- Check if hospital exists with branding
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
WHERE subdomain = 'function';  -- Replace with your subdomain
```

**Expected Result:**
- Row should exist
- `active` should be `true` or `false` (doesn't matter now)
- `logoUrl` should have a value like `/uploads/...`
- `primaryColor` should be `#e00000`
- `secondaryColor` should be `#2368c7`

---

### **Step 2: Test Branding API Directly**

#### **From your server:**
```bash
# Test the API
curl https://function.momentumhealthcare.io/api/branding/public

# Or with subdomain parameter
curl https://momentumhealthcare.io/api/branding/public?subdomain=function
```

**Expected Response:**
```json
{
  "hospital": {
    "id": 1,
    "name": "Function Hospital",
    "subdomain": "function",
    "logoUrl": "/uploads/123456-logo.png",
    "primaryColor": "#e00000",
    "secondaryColor": "#2368c7",
    "tagline": "Your tagline"
  }
}
```

**If you get an error:**
- 404: Hospital not found - check subdomain in database
- 400: No subdomain provided - middleware issue

---

### **Step 3: Check Browser Console**

1. Open `https://function.momentumhealthcare.io/login`
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Look for logs starting with `[Login]` and `[Branding API]`

**What to look for:**
```
[Login] Fetching hospital branding...
[Branding API] Fetched branding for: Function Hospital (function)
[Branding API] Logo URL: /uploads/123456-logo.png
[Branding API] Colors: #e00000, #2368c7
[Login] Branding response: { hospital: {...} }
[Login] Applying brand colors: { primary: '#e00000', secondary: '#2368c7', logo: '/uploads/...' }
```

**If you see errors:**
- Network error: API not accessible
- 404 error: Hospital not found
- CORS error: Domain configuration issue

---

## 🖼️ **Issue: Logo Not Displaying**

### **Problem: Logo URL is Set But Image Doesn't Show**

#### **Check 1: Verify Upload Succeeded**

The logo URL should look like:
```
/uploads/1733140800000-hospital-logo.png
```

#### **Check 2: Verify File Exists on Server**

```bash
# SSH to your server
ssh root@your-server

# Check if file exists
ls -la /root/Momentum_EMR/apps/web/public/uploads/

# Check if Next.js can access it
ls -la /root/Momentum_EMR/apps/web/.next/static/media/
```

#### **Check 3: Test Logo URL Directly**

Visit the logo URL directly in your browser:
```
https://function.momentumhealthcare.io/uploads/1733140800000-hospital-logo.png
```

**If it shows 404:**
- File doesn't exist in public folder
- Next.js not serving static files correctly
- Deployment didn't include uploads folder

---

### **Solution 1: Update Logo URL to Full Path**

If the relative URL isn't working, use a full public URL:

```sql
-- Update to use a CDN or full URL
UPDATE hospitals
SET "logoUrl" = 'https://yourdomain.com/logos/hospital-logo.png'
WHERE subdomain = 'function';
```

---

### **Solution 2: Manually Upload Logo to Public Folder**

```bash
# SSH to server
ssh root@your-server
cd /root/Momentum_EMR/apps/web/public

# Create uploads folder if it doesn't exist
mkdir -p uploads

# Upload your logo (from local machine)
scp /path/to/logo.png root@your-server:/root/Momentum_EMR/apps/web/public/uploads/

# Set permissions
chmod 644 uploads/*.png

# Update database
psql momentum_emr << EOF
UPDATE hospitals
SET "logoUrl" = '/uploads/logo.png'
WHERE subdomain = 'function';
EOF
```

---

### **Solution 3: Use External Image Host**

Upload your logo to:
- **Google Drive** (make public)
- **Imgur**
- **Cloudinary**
- **Your own CDN**

Then update the database:

```sql
UPDATE hospitals
SET "logoUrl" = 'https://i.imgur.com/YourLogo.png'
WHERE subdomain = 'function';
```

---

## 🎨 **Issue: Colors Not Applying**

### **Check 1: Verify Colors in Database**

```sql
SELECT 
  subdomain,
  "primaryColor",
  "secondaryColor"
FROM hospitals
WHERE subdomain = 'function';
```

**Must be valid hex codes:**
- ✅ `#e00000` (correct)
- ❌ `e00000` (missing #)
- ❌ `red` (not hex)

---

### **Check 2: Verify CSS Variables**

In browser console:
```javascript
// Check if variables are set
getComputedStyle(document.documentElement).getPropertyValue('--color-primary')
getComputedStyle(document.documentElement).getPropertyValue('--color-secondary')
```

Should return your hex colors.

---

### **Check 3: Hard Refresh**

Press `Ctrl + Shift + R` (or `Cmd + Shift + R` on Mac) to clear cache.

---

## ✅ **Quick Fix Commands**

### **1. Update Hospital Branding (All at Once)**

```sql
UPDATE hospitals
SET 
  "logoUrl" = '/uploads/your-logo.png',
  "primaryColor" = '#e00000',
  "secondaryColor" = '#2368c7',
  tagline = 'Your Health, Our Priority',
  active = true
WHERE subdomain = 'function';
```

### **2. Restart Next.js Server**

```bash
# SSH to server
ssh root@your-server

# Restart PM2 process
pm2 restart momentum

# Or if using different process name
pm2 list  # Check process name
pm2 restart <process-name>

# Check logs
pm2 logs momentum --lines 50
```

### **3. Rebuild and Deploy**

```bash
# From local machine
git add .
git commit -m "fix: Update hospital branding"
git push

# On server
cd /root/Momentum_EMR
git pull
pnpm install
pnpm build
pm2 restart momentum
```

---

## 🔍 **Debugging Checklist**

- [ ] Hospital exists in database with correct subdomain
- [ ] `active` field is `true`
- [ ] `primaryColor` and `secondaryColor` are valid hex codes (with `#`)
- [ ] `logoUrl` is set (either relative or full URL)
- [ ] Logo file exists on server at the specified path
- [ ] Branding API returns 200 with hospital data
- [ ] Browser console shows `[Login] Applying brand colors`
- [ ] CSS variables are set in browser
- [ ] Hard refresh performed (Ctrl+Shift+R)
- [ ] PM2 process restarted
- [ ] No CORS errors in browser console

---

## 📊 **Expected vs Actual**

### **Expected Behavior:**

1. Visit `https://function.momentumhealthcare.io/login`
2. Page loads with loading spinner
3. API call to `/api/branding/public`
4. Branding fetched: logo, colors, tagline
5. Page displays:
   - ✅ Hospital logo
   - ✅ Hospital name in red (#e00000)
   - ✅ Blue button (#2368c7)
   - ✅ Custom tagline
   - ✅ Red/blue gradient background

### **If It's Not Working:**

Run through steps above and check:
1. Database query result
2. API response
3. Browser console logs
4. Network tab for errors
5. File existence on server

---

## 🚑 **Emergency Fix**

If nothing works, try this:

```sql
-- 1. Delete and recreate hospital with branding
DELETE FROM hospitals WHERE subdomain = 'function';

-- 2. Re-create via Super Admin UI
-- OR manually:
INSERT INTO hospitals (
  name,
  subdomain,
  address,
  "phoneNumber",
  "contactEmail",
  "subscriptionPlan",
  active,
  "logoUrl",
  "primaryColor",
  "secondaryColor",
  tagline,
  "createdAt",
  "updatedAt"
) VALUES (
  'Function Hospital',
  'function',
  '123 Medical Drive',
  '+234 800 000 0000',
  'admin@function.hospital',
  'Basic',
  true,
  'https://i.imgur.com/your-logo.png',  -- Use external URL
  '#e00000',
  '#2368c7',
  'Excellence in Healthcare',
  NOW(),
  NOW()
);
```

---

## 📞 **Still Not Working?**

Check:
1. **PM2 logs**: `pm2 logs momentum --lines 100`
2. **Next.js logs**: Check for errors during page load
3. **Network tab**: Check API call response
4. **Console logs**: Check for JavaScript errors

**The system is built correctly - it's just a data/configuration issue!**
