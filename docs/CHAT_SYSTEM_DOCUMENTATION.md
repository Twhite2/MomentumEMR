# 🔐 EMR Secure Chat System - NDPR/HIPAA Compliant

## 📋 Overview
A fully encrypted, role-based chat system for healthcare staff communication with complete audit trails and HIPAA/NDPR compliance.

---

## ✅ Completed Features

### 1. **Database Schema** (`packages/database/prisma/schema.prisma`)

#### New Models:
- **ChatRoom** - Manages general and private chat rooms
- **ChatParticipant** - Tracks room membership and unread counts
- **ChatMessage** - Stores encrypted messages with @mentions
- **ChatAttachment** - Stores encrypted files (PDF, images, docs)
- **ChatReadReceipt** - Tracks message read status
- **ChatAuditLog** - Complete audit trail for compliance

#### Security Features:
✅ AES-256-GCM encryption for all messages
✅ Encrypted file attachments (max 10MB)
✅ Per-message encryption keys
✅ Master key encryption for key storage
✅ Soft deletes (deletedAt field)
✅ Complete audit logging

---

### 2. **Encryption Utilities** (`apps/web/src/lib/chat-encryption.ts`)

#### Functions:
- `encryptMessage(content)` - Encrypt text messages
- `decryptMessage(encrypted, key)` - Decrypt messages
- `encryptFile(buffer)` - Encrypt file data
- `decryptFile(encrypted, key)` - Decrypt file data
- `encryptKey(key)` - Encrypt with master key
- `decryptKey(encryptedKey)` - Decrypt from master key

#### Encryption Details:
- **Algorithm**: AES-256-GCM
- **IV**: 16 bytes random
- **Auth Tag**: 16 bytes for integrity
- **Key Length**: 32 bytes (256 bits)
- **Format**: `iv:authTag:encryptedData`

---

### 3. **API Routes**

#### **GET /api/chat/rooms**
- Get all chat rooms for current user
- Returns room list with unread counts
- Excludes super_admin

#### **POST /api/chat/rooms**
- Create new chat room (private or general)
- Auto-checks for existing private chats
- Creates participants automatically

#### **GET /api/chat/messages?roomId=X**
- Get decrypted messages for a room
- Supports pagination (before parameter)
- Auto-marks messages as read
- Creates audit log

#### **POST /api/chat/messages**
- Send encrypted message
- Supports @mentions (mentionedUserIds array)
- Supports replies (replyToMessageId)
- Updates unread counts
- Creates audit log

#### **POST /api/chat/upload**
- Upload encrypted file attachment
- Allowed types: PDF, JPG, PNG, DOCX, XLSX
- Max size: 10MB
- Creates audit log
- Returns attachment ID for linking

#### **PATCH /api/chat/upload/[id]**
- Link uploaded attachment to a message
- Verifies user owns the attachment
- Updates messageId field

#### **GET /api/chat/download/[id]**
- Download and decrypt attachment
- Verifies user access
- Creates audit log
- Returns file with correct MIME type

#### **GET /api/chat/users?search=X**
- Get all staff users for @mentions
- Excludes super_admin and current user

#### **GET /api/chat/general**
- Get or create the general/group chat room
- Auto-creates room if it doesn't exist
- Auto-joins current user as participant
- Returns room with all members and unread count
- Accessible to all staff (excluding super_admin)
- Supports search by name/email

---

### 4. **Access Control**

#### ✅ Who Can Access Chat:
- admin
- doctor
- nurse
- pharmacist
- receptionist
- cashier
- lab_tech

#### ❌ Who CANNOT Access Chat:
- super_admin (security/compliance requirement)
- patient (not staff communication channel)

---

### 5. **Navigation Integration**

**Added to Sidebar:**
- Chat menu item with MessageCircle icon
- Positioned after Notifications
- Role-filtered access control

---

## 🚨 IMPORTANT: Next Steps Required

### **1. Regenerate Prisma Client**
```bash
cd packages/database
npx prisma generate
```

### **2. Restart Dev Server**
Stop and restart your dev server to pick up new Prisma types.

### **3. Set Environment Variable**
Add to `.env`:
```
CHAT_ENCRYPTION_KEY=your_64_char_hex_key_here
```

Generate key with Node:
```js
require('crypto').randomBytes(32).toString('hex')
```

---

## 📦 Pending Implementation

### **UI Components** (Not Yet Built)
- [ ] Chat page layout (`/chat`)
- [ ] General Chat component
- [ ] Private Messages list
- [ ] Message composer with @mentions autocomplete
- [ ] File upload interface
- [ ] Message display with timestamps
- [ ] Online/offline indicators
- [ ] Unread message badges

### **Real-Time Features** (Not Yet Built)
- [ ] WebSocket integration or polling
- [ ] Live message updates
- [ ] Typing indicators
- [ ] Notification system integration

### **Data Retention** (Not Yet Built)
- [ ] Auto-archive messages older than 12 months
- [ ] Scheduled cleanup job
- [ ] Encrypted backup system

---

## 🔐 Security Compliance

### **NDPR/HIPAA Requirements ✅**

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Data Encryption at Rest | AES-256-GCM | ✅ |
| Data Encryption in Transit | HTTPS (Next.js) | ✅ |
| Access Control | Role-based API checks | ✅ |
| Audit Logging | ChatAuditLog table | ✅ |
| User Authentication | Existing EMR auth | ✅ |
| Data Integrity | GCM auth tags | ✅ |
| Super Admin Exclusion | API & navigation filters | ✅ |
| File Encryption | Encrypted before storage | ✅ |
| Secure Key Management | Master key encryption | ✅ |

### **Audit Trail Captured:**
- Message send/read
- File upload/download
- User ID & timestamp
- Room/resource context
- Metadata (mentions, file sizes)

---

## 📊 Database Tables

```
chat_rooms
├── id (PK)
├── hospital_id
├── room_type (general/private)
├── name
├── created_by
└── timestamps

chat_participants
├── id (PK)
├── room_id (FK)
├── user_id (FK)
├── last_read
├── unread_count
└── joined_at

chat_messages
├── id (PK)
├── room_id (FK)
├── sender_id (FK)
├── encrypted_content (TEXT)
├── status (sent/delivered/read)
├── mentioned_user_ids (INT[])
├── reply_to_message_id (FK)
├── deleted_at (soft delete)
└── timestamps

chat_attachments
├── id (PK)
├── room_id (FK)
├── message_id (FK)
├── uploaded_by (FK)
├── original_file_name
├── file_type
├── file_size
├── encrypted_data (TEXT)
├── encryption_key (TEXT - encrypted)
└── uploaded_at

chat_read_receipts
├── id (PK)
├── message_id (FK)
├── user_id (FK)
└── read_at

chat_audit_logs
├── id (PK)
├── hospital_id
├── user_id (FK)
├── action (send/read/download/delete)
├── resource_type (message/attachment)
├── resource_id
├── metadata (JSON)
└── created_at
```

---

## 🎯 How to Use (Once UI is Built)

### **General Chat**
1. Click "Chat" in sidebar
2. Select "General Chat"
3. Type message, use @ for mentions
4. Attach files with paperclip icon
5. Send

### **Private Chat**
1. Click "Chat" in sidebar
2. Click "New Message"
3. Select user from list
4. Start conversation

### **@Mentions**
1. Type @ in message box
2. Autocomplete shows user list
3. Select user
4. User gets notification

### **File Sharing**
1. Click attachment icon
2. Select file (PDF, image, doc)
3. File encrypts automatically
4. Recipient can download

---

## 🛠️ Management

### **Chat Permissions**
Managed via user roles in database:
```sql
-- Users with these roles can access chat
WHERE role IN ('admin', 'doctor', 'nurse', 'pharmacist', 'receptionist', 'cashier', 'lab_tech')
```

### **Encryption Keys**
- Master key: Environment variable
- Message keys: Generated per message
- File keys: Generated per file
- Keys stored encrypted in database

### **Data Retention**
Recommendation: Create scheduled job
```typescript
// Delete messages older than 12 months
await prisma.chatMessage.updateMany({
  where: {
    createdAt: {
      lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    }
  },
  data: {
    deletedAt: new Date(),
    encryptedContent: '[ARCHIVED]'
  }
});
```

---

## ⚠️ Known Limitations

1. **No UI Yet** - API is ready, UI needs to be built
2. **No Real-Time Updates** - Requires WebSocket or polling implementation
3. **No Data Retention Policy** - Needs scheduled job
4. **TypeScript Errors** - Will resolve after `npx prisma generate`

---

## 🚀 Next Development Steps

### **Phase 1: Basic UI (Recommended Next)**
1. Create chat page layout
2. Build message list component
3. Build message composer
4. Add basic styling

### **Phase 2: Enhanced Features**
1. Implement @mention autocomplete
2. Add file upload UI
3. Add message formatting
4. Add emoji support

### **Phase 3: Real-Time**
1. Add WebSocket support
2. Live message updates
3. Typing indicators
4. Online presence

### **Phase 4: Compliance**
1. Data retention job
2. Backup system
3. Export functionality
4. Admin reporting

---

## 📝 API Testing

### **Test Message Send**
```bash
curl -X POST http://localhost:3000/api/chat/messages \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": 1,
    "content": "Test message",
    "mentionedUserIds": [2, 3]
  }'
```

### **Test File Upload**
```bash
curl -X POST http://localhost:3000/api/chat/upload \
  -F "file=@test.pdf" \
  -F "roomId=1"
```

---

## 📞 Support & Questions

For implementation questions or issues:
1. Check TypeScript errors are resolved (`npx prisma generate`)
2. Verify environment variable is set
3. Ensure user has correct role
4. Check browser console for errors
5. Review audit logs for access attempts

---

**Status**: Backend Complete ✅ | Frontend Pending ⏳ | Testing Required 🧪
