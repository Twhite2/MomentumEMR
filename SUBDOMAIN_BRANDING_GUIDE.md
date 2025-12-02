# 🎨 **Hospital Subdomain Branding System**

## ✅ **Feature Overview:**

Your EMR system now supports **dynamic branding** based on hospital subdomains! Each hospital can have:

- ✅ **Custom Logo** - Displayed on login page
- ✅ **Primary Color** - Used for headings, buttons, links
- ✅ **Secondary Color** - Used for gradients, backgrounds
- ✅ **Tagline** - Custom hospital motto/slogan
- ✅ **Hospital Name** - Automatically displayed

---

## 🌐 **How It Works:**

### **Example Subdomains:**

```
citygeneralhospital.momentumhealthcare.io  → City General Hospital branding
stmaryhospital.momentumhealthcare.io       → St. Mary Hospital branding
localhost:3000                              → Default Momentum branding
```

---

## 🎯 **What Happens When a User Visits:**

1. **User goes to:** `citygeneralhospital.momentumhealthcare.io`
2. **Middleware extracts subdomain:** `citygeneralhospital`
3. **Login page calls:** `/api/branding/public`
4. **API fetches hospital data** from database by subdomain
5. **Page displays:**
   - ✅ Hospital's logo
   - ✅ Hospital's name
   - ✅ Hospital's tagline
   - ✅ Primary color for headings
   - ✅ Secondary color for gradients
   - ✅ Dynamic background gradient

---

## 📋 **Hospital Branding Fields:**

When creating a hospital, these fields control the login page branding:

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| **logoUrl** | String (URL) | `/logo.png` | Hospital logo image |
| **primaryColor** | Hex Color | `#1253b2` | Main brand color (headings, buttons) |
| **secondaryColor** | Hex Color | `#729ad2` | Accent color (gradients) |
| **tagline** | String | `null` | Hospital motto/slogan |
| **name** | String | Required | Hospital name |
| **subdomain** | String | Required | Unique subdomain identifier |

---

## 🎨 **Setting Hospital Branding:**

### **Option 1: When Creating Hospital (Super Admin)**

```javascript
{
  "name": "City General Hospital",
  "subdomain": "citygeneralhospital",
  "contactEmail": "admin@citygeneral.com",
  "password": "SecurePass123!",
  "logoUrl": "https://yourdomain.com/logos/citygeneral.png",
  "primaryColor": "#2563eb",      // Blue
  "secondaryColor": "#60a5fa",    // Light Blue
  "tagline": "Caring for Our Community Since 1985"
}
```

### **Option 2: Update Existing Hospital**

**API Endpoint:** `PATCH /api/hospitals/[id]/branding`

```javascript
{
  "logoUrl": "https://cdn.hospital.com/logo.png",
  "primaryColor": "#16a34a",      // Green
  "secondaryColor": "#86efac",    // Light Green
  "tagline": "Excellence in Healthcare"
}
```

---

## 🔧 **Technical Implementation:**

### **1. Middleware (`apps/web/src/middleware.ts`)**
- Extracts subdomain from hostname
- Sets `x-hospital-subdomain` header
- Passes to API routes and pages

### **2. Branding API (`apps/web/src/app/api/branding/public/route.ts`)**
- Public endpoint (no auth required)
- Fetches hospital by subdomain
- Returns branding data
- Has fallback to extract subdomain from hostname directly

### **3. Login Page (`apps/web/src/app/login/page.tsx`)**
- Fetches branding on mount
- Applies CSS variables dynamically
- Shows custom logo and colors
- Displays hospital name and tagline

---

## 🎨 **CSS Variables Applied:**

The login page dynamically sets these CSS variables:

```css
:root {
  --color-primary: #2563eb;    /* From hospital.primaryColor */
  --color-secondary: #60a5fa;  /* From hospital.secondaryColor */
}
```

These are used for:
- Button colors
- Link colors
- Focus ring colors
- Background gradients

---

## 🧪 **Testing:**

### **Test 1: Local Development**
```bash
# Access via localhost (uses default branding)
http://localhost:3000/login
```

### **Test 2: With Subdomain (Production)**
```bash
# Access via hospital subdomain
https://citygeneralhospital.momentumhealthcare.io/login
```

### **Test 3: Manual Subdomain Override**
```bash
# Test specific hospital without DNS
http://localhost:3000/api/branding/public?subdomain=citygeneralhospital
```

---

## 📊 **Database Query:**

Check existing hospital branding:

```sql
SELECT 
  id,
  name,
  subdomain,
  "logoUrl",
  "primaryColor",
  "secondaryColor",
  tagline,
  active
FROM hospitals
ORDER BY name;
```

Update hospital branding:

```sql
UPDATE hospitals
SET 
  "logoUrl" = 'https://cdn.hospital.com/logo.png',
  "primaryColor" = '#16a34a',
  "secondaryColor" = '#86efac',
  tagline = 'Excellence in Healthcare'
WHERE subdomain = 'citygeneralhospital';
```

---

## 🎯 **Example: Creating a Fully Branded Hospital**

### **Step 1: Upload Logo**
Upload hospital logo to your CDN or static assets folder.

### **Step 2: Choose Brand Colors**
```
Primary: #2563eb (Blue)
Secondary: #60a5fa (Light Blue)
```

### **Step 3: Create Hospital via Super Admin**
```json
POST /api/hospitals
{
  "name": "City General Hospital",
  "subdomain": "citygeneralhospital",
  "address": "123 Medical Center Drive",
  "phoneNumber": "+1234567890",
  "contactEmail": "admin@citygeneral.com",
  "password": "SecurePass123!",
  "logoUrl": "https://cdn.yourdomain.com/citygeneral-logo.png",
  "primaryColor": "#2563eb",
  "secondaryColor": "#60a5fa",
  "tagline": "Caring for Our Community Since 1985"
}
```

### **Step 4: Visit Login Page**
```
https://citygeneralhospital.momentumhealthcare.io/login
```

You should see:
- ✅ Custom logo
- ✅ Blue color scheme
- ✅ Hospital name
- ✅ Custom tagline

---

## 🚨 **Troubleshooting:**

### **Issue 1: Default branding shown instead of hospital branding**

**Check:**
1. Is subdomain correctly configured in DNS?
2. Is hospital `active = true` in database?
3. Check browser console for API errors
4. Verify subdomain matches exactly (case-insensitive)

**Debug:**
```bash
# Check if API returns branding
curl https://citygeneralhospital.momentumhealthcare.io/api/branding/public
```

### **Issue 2: Logo not displaying**

**Check:**
1. Is `logoUrl` a valid, accessible URL?
2. Does the image have proper CORS headers?
3. Is image URL using HTTPS?

**Fix:**
```sql
-- Update to correct logo URL
UPDATE hospitals 
SET "logoUrl" = 'https://correct-cdn.com/logo.png'
WHERE subdomain = 'citygeneralhospital';
```

### **Issue 3: Colors not applying**

**Check:**
1. Are colors valid hex codes? (e.g., `#2563eb`)
2. Check browser DevTools → Elements → Styles
3. Verify CSS variables are set

**Fix:**
```sql
-- Ensure colors are valid hex codes with #
UPDATE hospitals 
SET 
  "primaryColor" = '#2563eb',
  "secondaryColor" = '#60a5fa'
WHERE subdomain = 'citygeneralhospital';
```

---

## 📝 **Files Modified:**

1. ✅ `apps/web/src/middleware.ts` - Added branding API to matcher
2. ✅ `apps/web/src/app/api/branding/public/route.ts` - Enhanced subdomain detection
3. ✅ `apps/web/src/app/login/page.tsx` - Already implemented (no changes needed)

---

## 🎉 **Summary:**

**Your subdomain branding system is now fully functional!**

When a hospital is created with:
- ✅ Logo URL
- ✅ Primary Color
- ✅ Secondary Color  
- ✅ Tagline

Their login page at `[subdomain].momentumhealthcare.io/login` will automatically display their custom branding! 🚀

---

## 🔗 **Next Steps:**

1. Upload hospital logos to a CDN or static folder
2. Choose brand colors for each hospital
3. Set branding when creating hospitals
4. Test by visiting `[subdomain].yourdomain.com/login`

**Branding is live and ready to use!** ✨
