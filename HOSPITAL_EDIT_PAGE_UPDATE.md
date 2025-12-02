# ✅ **Hospital Edit Page - Background Image Upload Added**

## 🎯 **What Was Added:**

The hospital detail/edit page (`/hospitals/[id]`) now has the **background image upload** option, just like the creation form!

---

## 📍 **Location:**

**File:** `apps/web/src/app/(protected)/hospitals/[id]/page.tsx`

When you view a hospital and click "Edit Details", you'll now see:

1. **Hospital Logo** - Upload button (already existed, now working)
2. **Login Page Background Image** ← **NEW!**
   - Preview (160x96px)
   - Upload button
   - Shows current background if exists
   - Disabled when not editing
3. **Tagline**
4. **Primary Color**
5. **Secondary Color**

---

## 🎨 **How It Works:**

### **View Mode:**
- Shows current background image preview
- Upload button is **disabled**

### **Edit Mode:**
1. Click **"Edit Details"**
2. Click **"Upload Background"** button
3. Select image (JPG/PNG, up to 10MB)
4. See preview immediately
5. Click **"Save Changes"**
6. Background saved to hospital!

---

## ✨ **Features:**

- **Live Preview:** See the background image before saving
- **Validation:** 
  - Only image files allowed
  - Max 10MB file size
  - Clear error messages
- **Upload State:** Shows "Uploading..." during upload
- **Success Toast:** Confirms successful upload
- **Disabled State:** Can't upload when not in edit mode

---

## 🚀 **Next Steps:**

```bash
# Commit this change
git add .
git commit -m "feat: Add background image upload to hospital edit page"
git push

# Deploy to server
ssh root@your-server
cd /root/Momentum_EMR
git pull
pnpm build
pm2 restart momentum
```

---

## 📸 **Visual Result:**

When you visit `/hospitals/1` (or any hospital), the **Hospital Branding** section now shows:

```
┌─────────────────────────────────────┐
│ Hospital Branding                   │
├─────────────────────────────────────┤
│                                     │
│ Hospital Logo                       │
│ [Logo Preview] [Upload Logo]        │
│                                     │
│ Login Page Background Image  ← NEW! │
│ [Wide Preview] [Upload Background]  │
│                                     │
│ Tagline        | Primary Color      │
│ Secondary Color                     │
└─────────────────────────────────────┘
```

---

## ✅ **Testing:**

1. Go to: `http://localhost:3000/hospitals/1`
2. Click **"Edit Details"**
3. Scroll to **"Hospital Branding"**
4. Click **"Upload Background"**
5. Select a hospital photo
6. See preview update
7. Click **"Save Changes"**
8. Visit hospital's login page to see background!

---

**Now you can edit and upload background images for existing hospitals!** 🎉
