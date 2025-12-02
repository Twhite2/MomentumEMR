# 🚀 **Fix Upload Images Not Showing in Production**

## 🐛 **The Problem:**

**Local (Dev):** Images work ✅  
**Server (Production):** Images broken ❌

**Root Cause:** After `pnpm build`, files in `public/uploads/` aren't accessible because Next.js production build doesn't serve dynamically uploaded files from the `public/` folder.

---

## ✅ **The Solution:**

### **What Changed:**

1. **Upload API** - Now saves files to persistent location outside build folder
2. **New API Route** - `/api/uploads/[...path]` serves files from persistent storage
3. **URL Generation** - Returns `/api/uploads/...` in production

---

## 📋 **Deployment Steps:**

### **Step 1: Commit & Push (Local)**

```bash
git add .
git commit -m "fix: Persistent upload storage for production"
git push origin main
```

---

### **Step 2: On Server - Setup Persistent Upload Directory**

```bash
# SSH to server
ssh root@your-server

# Create persistent upload directory
mkdir -p /var/www/momentum_uploads
chmod 777 /var/www/momentum_uploads

# Move existing uploads to persistent location
cd /root/Momentum_EMR/apps/web
if [ -d "public/uploads" ]; then
    cp -r public/uploads/* /var/www/momentum_uploads/ 2>/dev/null || true
    echo "✅ Copied existing uploads"
fi
```

---

### **Step 3: Deploy Code**

```bash
cd /root/Momentum_EMR
git pull origin main

cd packages/database
pnpm prisma generate

cd ../../apps/web
pnpm build

cd ../..
pm2 restart momentum-emr
```

---

### **Step 4: Update Existing Database URLs (Optional)**

If you have existing uploads with `/uploads/...` paths, they'll still work because the API route handles both. But if you want to update them:

```sql
-- Update existing URLs to use API route
UPDATE hospitals 
SET 
    logo_url = REPLACE(logo_url, '/uploads/', '/api/uploads/'),
    background_image_url = REPLACE(background_image_url, '/uploads/', '/api/uploads/')
WHERE 
    logo_url LIKE '/uploads/%' 
    OR background_image_url LIKE '/uploads/%';
```

**OR better - Create symlink for backward compatibility:**

```bash
# Create symlink so /uploads/ URLs still work
cd /root/Momentum_EMR/apps/web/public
ln -sf /var/www/momentum_uploads uploads

# This way both /uploads/ and /api/uploads/ work!
```

---

## 🧪 **Verify It Works:**

### **Test 1: Upload New Image**

1. Go to hospital edit page
2. Upload new background image
3. Check URL returned: Should be `/api/uploads/...` ✅

### **Test 2: Access Image Directly**

```bash
# Check if file exists
ls -la /var/www/momentum_uploads/

# Test API route
curl https://momentumhealthcare.io/api/uploads/YOUR_IMAGE.jpg

# Should return image data, not 404
```

### **Test 3: Login Page**

Visit: `https://function.momentumhealthcare.io/login`

Should show:
- ✅ Background image
- ✅ Hospital logo
- ✅ Branded colors

---

## 📊 **How It Works Now:**

### **Before (Broken):**
```
Upload → public/uploads/image.jpg
pnpm build → .next/ (image not copied)
Browser requests /uploads/image.jpg → 404 ❌
```

### **After (Fixed):**
```
Upload → /var/www/momentum_uploads/image.jpg
pnpm build → .next/ (doesn't matter!)
Browser requests /api/uploads/image.jpg → API serves from /var/www/ ✅
```

---

## 🎯 **Files Changed:**

1. ✅ `apps/web/src/app/api/upload/route.ts` - Save to persistent dir
2. ✅ `apps/web/src/app/api/uploads/[...path]/route.ts` - NEW! Serve files
3. ✅ URL returns `/api/uploads/...` in production

---

## 🔧 **Quick Deploy Script:**

```bash
#!/bin/bash
ssh root@your-server << 'ENDSSH'
# Create persistent directory
mkdir -p /var/www/momentum_uploads
chmod 777 /var/www/momentum_uploads

# Copy existing files
cd /root/Momentum_EMR/apps/web
cp -r public/uploads/* /var/www/momentum_uploads/ 2>/dev/null || true

# Deploy
cd /root/Momentum_EMR
git pull origin main
cd packages/database && pnpm prisma generate
cd ../../apps/web && pnpm build
cd ../..
pm2 restart momentum-emr

# Check
pm2 logs momentum-emr --lines 20 --nostream
ENDSSH
```

---

## 🎉 **Result:**

After deployment:
- ✅ **New uploads persist** across builds
- ✅ **Existing uploads still work** (via symlink or API)
- ✅ **Images show in both local and production**
- ✅ **Background images work perfectly**

**Now deploy and test!** 🚀
