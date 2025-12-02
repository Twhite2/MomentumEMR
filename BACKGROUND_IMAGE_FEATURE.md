# 🎨 **Background Image Feature for Hospital Branding**

## ✨ **New Feature:**

Hospitals can now upload a **custom background image** for their login page, creating an immersive branded experience like the example you showed (hospital ward with beds and curtains).

---

## 📋 **Changes Made:**

### **1. Database Schema** ✅
**File:** `packages/database/prisma/schema.prisma`

Added new field to Hospital model:
```prisma
backgroundImageUrl   String?  @map("background_image_url") // Login page background
```

### **2. Hospital Creation Form** ✅
**File:** `apps/web/src/app/(protected)/hospitals/new/page.tsx`

- Added `backgroundImageUrl` to form state
- Added `handleBackgroundUpload` function (similar to logo upload)
- Added UI for background image upload:
  - 160x96px preview
  - Upload button
  - Recommended size: 1920x1080px
  - Max file size: 10MB

### **3. Hospital Edit Form** ⏳ (In Progress)
**File:** `apps/web/src/app/(protected)/hospitals/[id]/page.tsx`

- Added `backgroundImageUrl` to Hospital interface
- Added to form state
- Need to add: upload handler and UI

### **4. Branding API** ⏳ (To Do)
**File:** `apps/web/src/app/api/branding/public/route.ts`

Need to add `backgroundImageUrl` to the response.

### **5. Login Page** ⏳ (To Do)
**File:** `apps/web/src/app/login/page.tsx`

Need to use background image instead of gradient when available.

---

## 🎯 **How It Will Work:**

### **Super Admin Creates Hospital:**
1. Go to `/hospitals/new`
2. Fill hospital info
3. In **"Hospital Branding"** section:
   - Upload Logo (200x200px)
   - **Upload Background Image (1920x1080px)** ← NEW!
   - Set Primary Color
   - Set Secondary Color
   - Set Tagline
4. Click "Create Hospital"

### **Result - Login Page:**
```
Visit: function.momentumhealthcare.io/login

Shows:
- Full-screen background image (hospital ward photo)
- Translucent overlay card in center
- Hospital logo
- Hospital name in brand color
- Tagline
- Login form
```

---

## 🚀 **Next Steps:**

### **Step 1: Run Database Migration**

```bash
# Generate migration
cd packages/database
pnpm prisma migrate dev --name add_background_image_url

# Apply to production
pnpm prisma migrate deploy
```

### **Step 2: Complete Hospital Edit Page**

Add to `apps/web/src/app/(protected)/hospitals/[id]/page.tsx`:

```tsx
// Add background upload handler (copy from creation form)
const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  // Same logic as in new hospital form
};

// Add UI in branding section (copy from creation form)
<div>
  <label>Login Page Background Image</label>
  // Upload button and preview
</div>
```

### **Step 3: Update Branding API**

Update `apps/web/src/app/api/branding/public/route.ts`:

```typescript
select: {
  id: true,
  name: true,
  subdomain: true,
  logoUrl: true,
  primaryColor: true,
  secondaryColor: true,
  tagline: true,
  active: true,
  backgroundImageUrl: true, // ← ADD THIS
},
```

And in the return:

```typescript
return NextResponse.json({
  hospital: {
    // ... existing fields
    backgroundImageUrl: hospital.backgroundImageUrl,
  },
});
```

### **Step 4: Update Login Page**

Update `apps/web/src/app/login/page.tsx`:

```tsx
// Update HospitalBranding interface
interface HospitalBranding {
  // ... existing fields
  backgroundImageUrl: string | null;
}

// Update the return JSX
return (
  <div 
    className="min-h-screen flex items-center justify-center relative" 
    style={{
      backgroundImage: branding?.backgroundImageUrl 
        ? `url(${branding.backgroundImageUrl})`
        : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundColor: !branding?.backgroundImageUrl 
        ? (branding 
            ? `linear-gradient(to bottom right, ${branding.primaryColor}10, ${branding.secondaryColor}20)`
            : '#f3f4f6')
        : undefined,
    }}
  >
    {/* Overlay for readability if background image exists */}
    {branding?.backgroundImageUrl && (
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
    )}
    
    {/* Login card with higher z-index */}
    <div className="relative z-10 w-full max-w-md">
      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl p-8">
        {/* Rest of login form */}
      </div>
    </div>
  </div>
);
```

---

## 🎨 **Visual Result:**

### **Without Background Image:**
```
Login Page:
- Gradient background (primary → secondary color)
- White card in center
- Hospital logo
- Login form
```

### **With Background Image:**
```
Login Page:
- Full-screen hospital photo background
- Dark overlay (30% black + blur)
- Translucent white card (95% opacity + backdrop blur)
- Hospital logo
- Login form
- MUCH MORE IMMERSIVE! 🎉
```

---

## 📊 **Example Hospital Photos to Use:**

- **Hospital ward with beds** (like your example)
- **Modern hospital lobby**
- **Medical staff in action**
- **Hospital exterior**
- **Medical equipment**
- **Clean, bright hallways**

**Tip:** Use high-quality, professional photos that represent the hospital well!

---

## ✅ **Benefits:**

1. **Professional Look:** Immersive, modern UI
2. **Brand Identity:** Each hospital looks unique
3. **Trust Building:** Real photos build credibility
4. **User Experience:** Visually engaging login
5. **Easy to Update:** Super admin can change anytime

---

## 🎯 **Summary:**

**What's Done:**
- ✅ Database schema updated
- ✅ Hospital creation form has upload
- ✅ Form validation and upload handlers

**What's Left:**
- ⏳ Run database migration
- ⏳ Finish hospital edit page
- ⏳ Update branding API
- ⏳ Update login page to use background

**Deploy these remaining changes and you'll have beautiful, custom-branded login pages for each hospital!** 🚀

