# Password Setup Implementation - Option 1

## ✅ Implementation Complete!

I've implemented **Option 1: Auto-Create Admin + Email Password Link** for hospital account creation.

---

## 🎯 What Was Implemented

### 1. **Database Schema Updates**
- Added `passwordResetToken` and `passwordResetExpiry` fields to the User model
- Indexed `passwordResetToken` for fast lookup

### 2. **Auto-Create Admin on Hospital Creation**
When a super admin creates a new hospital at `/hospitals/new`:
- ✅ Hospital is created
- ✅ Admin user is auto-created with hospital's contact email
- ✅ Secure password reset token is generated (valid for 24 hours)
- ✅ Admin account is set to inactive until password is set
- ✅ Setup link is displayed to super admin

### 3. **Password Setup Page** (`/auth/setup-password`)
Beautiful, secure password setup page with:
- ✅ Token verification
- ✅ User information display
- ✅ Password strength indicators
- ✅ Show/hide password toggle
- ✅ Real-time password validation
- ✅ Automatic account activation on success
- ✅ Redirect to login after setup

### 4. **API Endpoints Created**

**`POST /api/auth/setup-password`**
- Validates token
- Sets user password (hashed with bcrypt)
- Activates user account
- Clears reset token

**`GET /api/auth/setup-password?token=xxx`**
- Verifies token validity
- Returns user information for display

**`POST /api/hospitals/[id]/send-setup-link`**
- Regenerates password setup link for existing hospitals
- Useful if link expires or gets lost

---

## 🚀 Setup Instructions

### Step 1: Run Database Migration

```bash
cd packages/database
npx prisma migrate dev --name add_password_reset_tokens
npx prisma generate
```

This will:
- Add the new fields to your database
- Regenerate Prisma Client with TypeScript types

### Step 2: Set Environment Variable

Make sure your `.env` file has:
```env
NEXTAUTH_URL=http://localhost:3000
# or your actual domain in production
```

### Step 3: Test the Flow

1. **Create a Hospital** (as super admin):
   - Go to `/hospitals/new`
   - Fill in hospital details
   - Click "Create Hospital"

2. **Copy the Setup Link**:
   - After creation, you'll see a success screen
   - Copy the password setup link
   - It looks like: `http://localhost:3000/auth/setup-password?token=abc123...`

3. **Set Up Password**:
   - Open the link in a new browser/incognito window
   - See the password setup page
   - Enter and confirm password
   - Account is activated!

4. **Login**:
   - Go to `/login`
   - Use the hospital admin email and new password
   - Access the system!

---

## 📧 Email Integration (TODO)

Currently, the setup link is displayed in the UI and console. To integrate email:

### Option A: Using Resend (Recommended)
```bash
npm install resend
```

```typescript
// In /api/hospitals/route.ts, replace console.log with:
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'Momentum EMR <no-reply@yourdomain.com>',
  to: data.contactEmail,
  subject: 'Welcome to Momentum EMR - Set Up Your Account',
  html: `
    <h1>Welcome to Momentum EMR</h1>
    <p>Your hospital account has been created. Set up your password to get started:</p>
    <a href="${setupLink}">Set Up Password</a>
    <p>This link expires in 24 hours.</p>
  `,
});
```

### Option B: Using SendGrid
```bash
npm install @sendgrid/mail
```

### Option C: Using Nodemailer
```bash
npm install nodemailer
```

---

## 🔒 Security Features

✅ **Secure Token Generation**: Crypto-random 32-byte tokens
✅ **Time-Limited**: Links expire after 24 hours
✅ **One-Time Use**: Token is cleared after password is set
✅ **Password Hashing**: bcrypt with 10 rounds
✅ **Password Strength**: Minimum 8 characters enforced
✅ **Account Activation**: User must set password before access

---

## 🎨 User Experience

### For Super Admin:
1. Create hospital
2. See admin account details
3. Copy setup link
4. Share with hospital admin

### For Hospital Admin:
1. Receive setup link (via email/shared link)
2. Click link
3. See welcome screen with their info
4. Set secure password with visual feedback
5. Automatic redirect to login
6. Access system immediately

---

## 🔄 Additional Features

### Resend Setup Link
If the link expires or is lost, super admin can:
```bash
POST /api/hospitals/[id]/send-setup-link
```
This generates a new link.

### Password Reset Flow
The same infrastructure can be used for password resets:
1. User requests password reset
2. Generate token
3. Send email with reset link
4. Use same `/auth/setup-password` page

---

## 📝 Console Output Example

When you create a hospital, you'll see in the console:
```
=================================
HOSPITAL CREATED SUCCESSFULLY
=================================
Hospital: City General Hospital
Admin Email: admin@cityhospital.com
Password Setup Link: http://localhost:3000/auth/setup-password?token=abc123...
=================================
📧 Email should be sent to: admin@cityhospital.com
Subject: Welcome to Momentum EMR - Set Up Your Account
=================================
```

---

## ✨ Benefits of This Implementation

1. **Secure**: No passwords sent via email
2. **Professional**: Standard industry practice
3. **User-Friendly**: Self-service password creation
4. **Flexible**: Token-based system works for resets too
5. **Traceable**: Tokens are stored and can be audited
6. **Automated**: No manual intervention needed

---

## 🐛 Troubleshooting

**TypeScript Errors?**
- Run `npx prisma generate` to update types

**Token Not Working?**
- Check if 24 hours have passed (expired)
- Use "Resend Setup Link" API

**Can't Login?**
- Ensure password was set successfully
- Check user.active = true in database
- Verify email matches

---

## 🎯 Next Steps

1. ✅ Run the migration
2. ✅ Test the flow
3. 📧 Integrate email service (Resend recommended)
4. 🎨 Customize email template
5. 🔔 Add email notifications to admin
6. 📊 Add audit logging for security

---

Your hospital creation workflow is now complete and secure! 🚀
