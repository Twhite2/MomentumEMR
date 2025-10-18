# Backblaze B2 File Storage Integration

This project uses Backblaze B2 for file storage (images, documents, logos) via the S3-compatible API.

## Configuration

### 1. Environment Variables

Add these to your `.env` file:

```env
# Backblaze B2 S3-compatible API
B2_ENDPOINT="https://s3.us-west-004.backblazeb2.com"
B2_REGION="us-west-004"
B2_KEY_ID="005222359ed5cd80000000001"
B2_APPLICATION_KEY="K005qrAoALE7AiMsSlOl+Wm+0Tc9/Jo"
B2_BUCKET_NAME="emr-uploads"
```

### 2. Bucket Configuration

- **Bucket Name:** `emr-uploads`
- **Region:** `us-west-004` (US West)
- **Access:** Public (for logos and images) or Private (for sensitive documents)

## Features

### ✅ File Upload
- Supports multiple file formats: images (JPEG, PNG, SVG, WebP), documents (PDF, DOC, XLS, etc.)
- Max file size: 10MB per file
- Automatic file validation and type checking
- Unique filename generation using UUID

### ✅ Hospital Branding
- Logo upload (max 2MB, images only)
- Primary and secondary color customization
- Tagline customization
- Real-time preview
- Only admins and super_admins can update branding

### ✅ Folder Organization
Files are organized by type:
- `/logos/` - Hospital logos
- `/documents/` - Patient documents, medical records
- `/images/` - General images
- `/uploads/` - Other files

## API Endpoints

### Upload File(s)
```http
POST /api/upload/file
Content-Type: multipart/form-data

Body:
- files: File[] (required)
- folder: string (optional) - e.g., "logos", "documents", "images"
```

**Response:**
```json
{
  "success": true,
  "file": {
    "name": "example.jpg",
    "url": "https://s3.us-west-004.backblazeb2.com/emr-uploads/logos/uuid.jpg",
    "type": "image/jpeg",
    "size": 123456
  }
}
```

### Update Hospital Branding
```http
PUT /api/hospitals/[id]/branding
Content-Type: multipart/form-data

Body:
- logo: File (optional)
- primaryColor: string (hex color, e.g., "#0F4C81")
- secondaryColor: string (hex color, e.g., "#4A90E2")
- tagline: string (optional)
```

### Get Hospital Branding
```http
GET /api/hospitals/[id]/branding
```

**Response:**
```json
{
  "id": 1,
  "name": "City General Hospital",
  "logoUrl": "https://s3.us-west-004.backblazeb2.com/emr-uploads/logos/uuid.png",
  "primaryColor": "#0F4C81",
  "secondaryColor": "#4A90E2",
  "tagline": "Your Health, Our Priority"
}
```

## Usage Examples

### Frontend: Upload File

```typescript
import axios from 'axios';

const uploadFile = async (file: File, folder?: string) => {
  const formData = new FormData();
  formData.append('files', file);
  if (folder) {
    formData.append('folder', folder);
  }

  const response = await axios.post('/api/upload/file', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.file.url;
};

// Example usage
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    const fileUrl = await uploadFile(file, 'documents');
    console.log('File uploaded:', fileUrl);
  }
};
```

### Backend: Use Storage Service

```typescript
import { uploadFile, deleteFile } from '@/lib/storage';

// Upload a file
const buffer = Buffer.from(await file.arrayBuffer());
const fileUrl = await uploadFile({
  file: buffer,
  fileName: file.name,
  contentType: file.type,
  folder: 'documents',
});

// Delete a file
await deleteFile(fileUrl);
```

## File Type Restrictions

### Allowed Image Types:
- `image/jpeg`, `image/jpg`, `image/png`
- `image/svg+xml`, `image/webp`, `image/gif`

### Allowed Document Types:
- `application/pdf`
- `application/msword` (DOC)
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX)
- `application/vnd.ms-excel` (XLS)
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (XLSX)
- `text/plain`, `text/csv`

## Security

### File Validation
- File size limits (10MB for general files, 2MB for logos)
- File type whitelist
- Automatic virus scanning (TODO)
- Secure filename generation

### Access Control
- Logo upload: Admin and Super Admin only
- General file upload: All authenticated users
- File deletion: Restricted to authorized users

## Storage Costs

Backblaze B2 pricing (as of 2024):
- Storage: $0.005/GB/month
- Downloads: $0.01/GB (first 1GB/day free per bucket)
- API calls: Free (up to 2,500/day per bucket)

## Troubleshooting

### Common Issues

**1. "Failed to upload file"**
- Check environment variables are set correctly
- Verify bucket name matches configuration
- Ensure credentials have write permissions

**2. "File type not allowed"**
- Check the file extension is in the allowed list
- Verify MIME type is correct

**3. "File size exceeds limit"**
- Reduce file size before uploading
- For large files, consider implementing chunked uploads

## Next Steps

- [ ] Add file compression for images
- [ ] Implement chunked uploads for large files
- [ ] Add virus scanning integration
- [ ] Implement CDN caching
- [ ] Add file versioning
- [ ] Implement automatic backup

## Support

For issues with Backblaze B2, contact: b2feedback@backblaze.com
