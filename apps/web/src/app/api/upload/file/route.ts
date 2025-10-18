import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadFile, uploadMultipleFiles } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/upload/file - Upload single or multiple files
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const folder = (formData.get('folder') as string) || undefined;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Validate file sizes (max 10MB per file)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds maximum size of 10MB` },
          { status: 400 }
        );
      }
    }

    // Validate file types
    const ALLOWED_TYPES = [
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File type ${file.type} is not allowed` },
          { status: 400 }
        );
      }
    }

    // Upload files
    if (files.length === 1) {
      const file = files[0];
      const buffer = Buffer.from(await file.arrayBuffer());

      const fileUrl = await uploadFile({
        file: buffer,
        fileName: file.name,
        contentType: file.type,
        folder,
      });

      return NextResponse.json({
        success: true,
        file: {
          name: file.name,
          url: fileUrl,
          type: file.type,
          size: file.size,
        },
      });
    } else {
      // Multiple files
      const fileDataArray = await Promise.all(
        files.map(async (file) => ({
          file: Buffer.from(await file.arrayBuffer()),
          fileName: file.name,
          contentType: file.type,
        }))
      );

      const fileUrls = await uploadMultipleFiles(fileDataArray, folder);

      const uploadedFiles = files.map((file, index) => ({
        name: file.name,
        url: fileUrls[index],
        type: file.type,
        size: file.size,
      }));

      return NextResponse.json({
        success: true,
        files: uploadedFiles,
      });
    }
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file(s)' },
      { status: 500 }
    );
  }
}
