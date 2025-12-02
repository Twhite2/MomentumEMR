# 🚀 **Deploy Background Image Feature**

## ✨ **What This Adds:**

Hospitals can now upload custom background images for their login pages, creating an immersive branded experience like the Panox Hospital example you showed!

---

## 📋 **Deployment Steps:**

### **Step 1: Commit Changes**

```bash
cd c:\Users\PC\Documents\Momentum\EMR

git add .
git commit -m "feat: Add custom background image support for hospital login pages"
git push origin main
```

---

### **Step 2: SSH to Server**

```bash
ssh root@your-server
cd /root/Momentum_EMR
```

---

### **Step 3: Pull Latest Code**

```bash
git pull origin main
```

---

### **Step 4: Add Database Column**

```bash
# Option A: Run SQL directly
psql momentum_emr << EOF
ALTER TABLE hospitals ADD COLUMN background_image_url TEXT;
EOF

# OR Option B: Use Prisma migrate
cd packages/database
pnpm prisma migrate dev --name add_background_image_url
```

---

### **Step 5: Regenerate Prisma Client**

```bash
cd /root/Momentum_EMR/packages/database
pnpm prisma generate
```

---

### **Step 6: Install Dependencies & Build**

```bash
cd /root/Momentum_EMR
pnpm install
pnpm build
```

---

### **Step 7: Restart Application**

```bash
pm2 restart momentum
pm2 logs momentum --lines 50
```

---

## ✅ **Verify Deployment:**

### **Test 1: Check Database**

```bash
psql momentum_emr -c "\d hospitals" | grep background
```

Should show:
```
background_image_url | text |  |
```

### **Test 2: Create Hospital with Background**

1. Go to: `https://momentumhealthcare.io/hospitals/new`
2. Fill in hospital details
3. In **Hospital Branding** section:
   - Upload Logo
   - **Upload Background Image** ← NEW FIELD!
   - Set colors
4. Click "Create Hospital"

### **Test 3: Visit Login Page**

1. Visit: `https://[subdomain].momentumhealthcare.io/login`
2. Should see:
   - Full-screen background image ✅
   - Dark overlay for readability ✅
   - Translucent login card ✅
   - Hospital logo and branding ✅

---

## 🎨 **How to Use:**

### **For Existing Hospitals:**

```sql
-- Update existing hospital with background image
UPDATE hospitals 
SET background_image_url = '/uploads/your-background-image.jpg'
WHERE subdomain = 'function';
```

### **For New Hospitals:**

Just use the Super Admin UI:
1. `/hospitals/new`
2. Upload background image in branding section
3. Done!

---

## 📊 **Visual Examples:**

### **Without Background Image:**
```
Login Page:
┌─────────────────────────┐
│ Gradient Background     │
│   ┌─────────────────┐  │
│   │  White Card      │  │
│   │  Logo            │  │
│   │  Login Form      │  │
│   └─────────────────┘  │
└─────────────────────────┘
```

### **With Background Image:**
```
Login Page:
┌─────────────────────────┐
│ Hospital Ward Photo     │
│ (Beds, curtains, etc.)  │
│   Dark Overlay          │
│   ┌─────────────────┐  │
│   │ Translucent Card │  │
│   │  Logo            │  │
│   │  Login Form      │  │
│   └─────────────────┘  │
└─────────────────────────┘
```

---

## 🎯 **Recommended Background Images:**

**Best Practices:**
- **Size:** 1920x1080px or larger
- **Format:** JPG or PNG
- **File Size:** Under 10MB
- **Style:** Professional, bright, clean
- **Content:** Hospital interiors, medical facilities, staff

**Good Examples:**
- Hospital ward with beds
- Modern hospital lobby
- Medical staff at work
- Clean hallways
- Medical equipment
- Hospital exterior

**Avoid:**
- Dark or cluttered images
- Too busy/distracting
- Low resolution
- Unprofessional photos

---

## 🔧 **Troubleshooting:**

### **Issue: TypeScript Error in Branding API**

```
Object literal may only specify known properties, and 'backgroundImageUrl' 
does not exist in type 'HospitalSelect'
```

**Fix:** Run `pnpm prisma generate` to regenerate Prisma types.

### **Issue: Background Not Showing**

**Check:**
1. Is `background_image_url` column in database?
   ```bash
   psql momentum_emr -c "SELECT background_image_url FROM hospitals WHERE subdomain = 'function';"
   ```

2. Is image URL correct?
   ```bash
   curl https://function.momentumhealthcare.io/uploads/your-image.jpg
   ```

3. Check browser console for errors

### **Issue: Image Too Large**

**Solution:** Compress image before uploading
- Use tools like: TinyPNG, ImageOptim, or Squoosh
- Target: Under 2MB for fast loading

---

## 📝 **Files Changed:**

1. ✅ `packages/database/prisma/schema.prisma` - Added `backgroundImageUrl` field
2. ✅ `apps/web/src/app/(protected)/hospitals/new/page.tsx` - Background upload in creation form
3. ✅ `apps/web/src/app/(protected)/hospitals/[id]/page.tsx` - Background field in edit form
4. ✅ `apps/web/src/app/api/branding/public/route.ts` - Returns background URL
5. ✅ `apps/web/src/app/login/page.tsx` - Uses background image with overlay

---

## 🎉 **Result:**

After deployment, hospitals can create **immersive, branded login experiences** that build trust and professionalism!

**Example:**
```
Visit: function.momentumhealthcare.io/login

Result:
- Full-screen hospital ward photo
- Professional, immersive experience
- Hospital branding maintained
- Easy for Super Admin to manage
```

---

## 🚀 **Deploy Now:**

```bash
# Quick Deploy Commands:
ssh root@your-server
cd /root/Momentum_EMR
git pull
psql momentum_emr -c "ALTER TABLE hospitals ADD COLUMN background_image_url TEXT;"
cd packages/database && pnpm prisma generate
cd ../.. && pnpm build
pm2 restart momentum

# Verify:
pm2 logs momentum --lines 20
```

**Then test by creating a hospital and uploading a background image!** 🎨✨
