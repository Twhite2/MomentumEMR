import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// POST /api/upload - Upload file
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['super_admin', 'admin', 'doctor', 'nurse', 'lab_tech', 'pharmacist']);
    
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return apiResponse({ error: 'No file provided' }, 400);
    }

    // Create uploads directory if it doesn't exist
    // Use absolute path outside build directory for production persistence
    const uploadsDir = process.env.NODE_ENV === 'production' 
      ? '/var/www/momentum_uploads'  // Production: persistent location
      : join(process.cwd(), 'public', 'uploads');  // Development: public folder
    
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return public URL
    // In production, serve via API route; in development, serve from public folder
    const url = process.env.NODE_ENV === 'production'
      ? `/api/uploads/${filename}`
      : `/uploads/${filename}`;
    
    return apiResponse({ 
      success: true,
      url,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/upload - List files
// TODO: Implement file model in database schema
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse', 'lab_tech', 'pharmacist', 'cashier']);
    
    // TODO: File model not yet implemented in schema
    return apiResponse({ error: 'File listing not yet implemented' }, 501);
  } catch (error) {
    return handleApiError(error);
  }
}
