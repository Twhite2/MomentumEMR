# Back Button Migration Progress

## ✅ **Completed Pages (7/25)**

### **High Priority User-Facing:**
1. ✅ `apps/web/src/app/(protected)/vitals/new/page.tsx`
2. ✅ `apps/web/src/app/(protected)/medical-records/new/page.tsx`
3. ✅ `apps/web/src/app/(protected)/medical-records/[id]/page.tsx`
4. ✅ `apps/web/src/app/(protected)/patients/[id]/page.tsx`
5. ✅ `apps/web/src/app/(protected)/patients/new/page.tsx`
6. ✅ `apps/web/src/app/(protected)/patients/[id]/edit/page.tsx`
7. ✅ `apps/web/src/app/(protected)/prescriptions/new/page.tsx`
8. ✅ `apps/web/src/app/(protected)/prescriptions/[id]/page.tsx`
9. ✅ `apps/web/src/app/(protected)/lab-orders/new/page.tsx`

---

## 🔄 **Remaining Pages (16)**

### **High Priority (6):**
- [ ] `apps/web/src/app/(protected)/lab-orders/[id]/page.tsx`
- [ ] `apps/web/src/app/(protected)/invoices/new/page.tsx`
- [ ] `apps/web/src/app/(protected)/invoices/[id]/page.tsx`
- [ ] `apps/web/src/app/(protected)/vitals/[id]/page.tsx`
- [ ] `apps/web/src/app/(protected)/appointments/new/page.tsx`
- [ ] `apps/web/src/app/(protected)/appointments/[id]/page.tsx`

### **Medium Priority - Admin (6):**
- [ ] `apps/web/src/app/(protected)/users/new/page.tsx`
- [ ] `apps/web/src/app/(protected)/users/[id]/page.tsx`
- [ ] `apps/web/src/app/(protected)/inventory/new/page.tsx`
- [ ] `apps/web/src/app/(protected)/inventory/[id]/page.tsx`
- [ ] `apps/web/src/app/(protected)/inventory/[id]/edit/page.tsx`
- [ ] `apps/web/src/app/(protected)/hmo/[id]/page.tsx`

### **Low Priority - Specialized (4):**
- [ ] `apps/web/src/app/(protected)/hmo/[id]/tariffs/page.tsx`
- [ ] `apps/web/src/app/(protected)/surveys/[id]/page.tsx`
- [ ] `apps/web/src/app/(protected)/hospitals/new/page.tsx`
- [ ] `apps/web/src/app/(protected)/medical-records/[id]/edit/page.tsx`

---

## 📋 **Quick Copy-Paste Template**

### **Step 1: Update Imports**

**Find:**
```typescript
import { ArrowLeft, ... } from 'lucide-react';
import Link from 'next/link';
```

**Replace with:**
```typescript
import { ... } from 'lucide-react'; // Remove ArrowLeft
import Link from 'next/link'; // Keep if used elsewhere in file
import { BackButton } from '@/components/shared/BackButton';
```

---

### **Step 2: Replace Back Button**

**Find:**
```typescript
<Link href="/some-page">
  <Button variant="ghost" size="sm">
    <ArrowLeft className="w-4 h-4 mr-2" />
    Back
  </Button>
</Link>
```

**Replace with:**
```typescript
<BackButton />
```

**Or with custom label:**
```typescript
<BackButton label="Back to Patient" />
```

---

### **Step 3: Replace Cancel Button (if exists)**

**Find:**
```typescript
<Link href="/some-page">
  <Button variant="outline" type="button">
    Cancel
  </Button>
</Link>
```

**Replace with:**
```typescript
<Button 
  variant="outline" 
  type="button"
  onClick={() => router.back()}
>
  Cancel
</Button>
```

---

## 🛠️ **Example: Complete Page Update**

### **Before:**
```typescript
'use client';

import { Button } from '@momentum/ui';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SomePage() {
  const router = useRouter();
  
  return (
    <div>
      <div className="flex items-center gap-4">
        <Link href="/some-list">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1>Page Title</h1>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Form content */}
        
        <div className="flex gap-4">
          <Link href="/some-list">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button variant="primary" type="submit">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}
```

### **After:**
```typescript
'use client';

import { Button } from '@momentum/ui';
import { Save } from 'lucide-react';
import { BackButton } from '@/components/shared/BackButton';
import { useRouter } from 'next/navigation';

export default function SomePage() {
  const router = useRouter();
  
  return (
    <div>
      <div className="flex items-center gap-4">
        <BackButton />
        <h1>Page Title</h1>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Form content */}
        
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            type="button"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}
```

---

## ⚠️ **Important Notes**

### **Keep Link Import If:**
- File uses `<Link>` elsewhere (e.g., navigation to specific routes)
- Example: `<Link href={`/patients/${id}`}>View Patient</Link>`

### **Remove ArrowLeft Icon If:**
- Only used for the back button
- Not used elsewhere in the component

### **Common Icons to Keep:**
- `Save` - used in submit buttons
- Other icons used in the UI
- Check each file individually

---

## 🧪 **Testing Checklist**

For each updated page:
- [ ] No TypeScript errors
- [ ] Back button navigates to previous page
- [ ] Cancel button works (if exists)
- [ ] No console errors
- [ ] Test from multiple entry points
- [ ] Verify navigation history preserved

---

## 📊 **Progress**

**Completed:** 9/25 pages (36%)  
**Remaining:** 16/25 pages (64%)  

**Status:** ✅ Core pages complete, continue with remaining

---

## 🎯 **Next Steps**

1. Update remaining 6 high-priority pages
2. Update 6 admin pages  
3. Update 4 low-priority specialized pages
4. Test all navigation flows
5. Deploy and monitor

---

**Last Updated:** December 2, 2025  
**Updated By:** Cascade AI Assistant
