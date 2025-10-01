import { NextRequest } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// GET /api/files/[category]/[fileId] - Serve local file
export async function GET(
  request: NextRequest,
  { params }: { params: { category: string; fileId: string } }
) {
  try {
    const { category, fileId } = params;

    // Security: Prevent directory traversal
    if (category.includes('..') || fileId.includes('..')) {
      return new Response('Invalid file path', { status: 400 });
    }

    const filePath = path.join(LOCAL_UPLOAD_DIR, category, fileId);

    if (!existsSync(filePath)) {
      return new Response('File not found', { status: 404 });
    }

    const fileBuffer = await readFile(filePath);

    // Determine content type based on file extension
    const ext = path.extname(fileId).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.dcm': 'application/dicom',
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new Response('Error serving file', { status: 500 });
  }
}
