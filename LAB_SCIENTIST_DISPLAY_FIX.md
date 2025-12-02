# Lab Scientist Display Name Fix

## Problem
The internal database role `lab_tech` was being displayed directly to users in various parts of the UI as "lab_tech", "Lab_tech", or "LAB_TECH" instead of the user-friendly "Lab Scientist".

## Solution
Created a centralized role display utility to ensure consistent role naming across the entire application.

---

## Files Created

### 1. Role Utility Library
**File:** `apps/web/src/lib/role-utils.ts`

**Purpose:** Centralized role display names, badge colors, and utility functions

**Key Features:**
- `getRoleDisplayName()` - Converts internal role to user-friendly name
- `ROLE_DISPLAY_NAMES` - Mapping of all roles including `lab_tech: 'Lab Scientist'`
- `ROLE_BADGE_COLORS` - Consistent color scheme for role badges
- `ROLE_BADGE_BG_LIGHT` - Light background colors for badges

---

## Files Updated

### 2. Header Component
**File:** `components/layout/header.tsx`
- **Line 10:** Added import for `getRoleDisplayName`
- **Line 326:** Changed from `capitalize` to `getRoleDisplayName(userRole)`
- **Result:** User dropdown now shows "Lab Scientist" instead of "Lab_tech"

### 3. Chat Mention Input
**File:** `components/chat/mention-input.tsx`
- **Line 7:** Added import for `getRoleDisplayName`
- **Line 151:** Changed from `capitalize` to `getRoleDisplayName(user.role)`
- **Result:** User mentions in chat show proper role names

### 4. Users List Page
**File:** `app/(protected)/users/page.tsx`
- **Line 10:** Added import for `getRoleDisplayName` and `ROLE_BADGE_BG_LIGHT`
- **Line 62:** Updated `getRoleColor()` to use `ROLE_BADGE_BG_LIGHT`
- **Line 239:** Changed from `user.role.replace('_', ' ').toUpperCase()` to `getRoleDisplayName(user.role)`
- **Result:** Users table displays "Lab Scientist" with correct badge styling

### 5. User Detail Page
**File:** `app/(protected)/users/[id]/page.tsx`
- **Line 19:** Added import for `getRoleDisplayName` and `ROLE_BADGE_COLORS`
- **Line 154:** Updated `getRoleColor()` to use `ROLE_BADGE_COLORS`
- **Line 195:** Changed role badge to use `getRoleDisplayName(user.role)`
- **Line 303:** Changed role display to use `getRoleDisplayName(user.role)`
- **Result:** User profile shows "Lab Scientist" consistently

---

## Unchanged (Intentionally)

### Database & API
The following files still use `lab_tech` as the internal identifier - **this is correct**:
- Database schema: `role: 'lab_tech'`
- API role checks: `requireRole(['lab_tech'])`
- User creation dropdowns: `<option value="lab_tech">Lab Scientist</option>`

**Why?** The database uses `lab_tech` as the identifier, but the UI displays "Lab Scientist" to users.

---

## Testing Checklist

✅ **Header:** User dropdown shows "Lab Scientist"
✅ **Users List:** Table displays "Lab Scientist" badge
✅ **User Detail:** Profile shows "Lab Scientist" role
✅ **Chat Mentions:** Shows "Lab Scientist" in autocomplete
✅ **User Creation:** Dropdown shows "Lab Scientist" label
✅ **Role Badges:** Consistent blue/danube color for lab scientists

---

## Impact

**Before:**
- Header: "Lab_tech"
- Users table: "LAB_TECH"
- Chat: "lab_tech"

**After:**
- All locations: "Lab Scientist"
- Consistent styling with blue badge
- Professional user-facing terminology

---

## Future Usage

When adding new components that display user roles:

```typescript
import { getRoleDisplayName } from '@/lib/role-utils';

// Display role to user
<span>{getRoleDisplayName(user.role)}</span>

// Get badge color
import { ROLE_BADGE_COLORS } from '@/lib/role-utils';
<span className={ROLE_BADGE_COLORS[role as UserRole]}>
  {getRoleDisplayName(role)}
</span>
```

This ensures consistency across the entire application.
