import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';
import { FileStorage, FileCategory } from '@/lib/file-storage';

// POST /api/upload - Upload file
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse', 'lab_tech', 'pharmacist']);
    const userId = parseInt(session.user.id);
    const hospitalId = parseInt(session.user.hospitalId);

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as FileCategory;
    const relatedId = formData.get('relatedId') as string;
    const relatedType = formData.get('relatedType') as string; // patient, lab_order, prescription, etc.
    const description = formData.get('description') as string;

    if (!file) {
      return apiResponse({ error: 'No file provided' }, 400);
    }

    if (!category) {
      return apiResponse({ error: 'Category is required' }, 400);
    }

    // Validate file type
    if (!FileStorage.isValidFileType(file.type, category)) {
      return apiResponse(
        {
          error: `Invalid file type. Allowed types for ${category}: ${file.type}`,
        },
        400
      );
    }

    // Validate file size
    if (!FileStorage.isValidFileSize(file.size, category)) {
      return apiResponse({ error: 'File size exceeds the maximum allowed limit' }, 400);
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file
    const uploadResult = await FileStorage.uploadFile(
      buffer,
      file.name,
      file.type,
      category,
      file.size
    );

    // Save file metadata to database
    const fileRecord = await prisma.file.create({
      data: {
        hospitalId,
        uploadedBy: userId,
        fileName: uploadResult.fileName,
        fileId: uploadResult.fileId,
        fileUrl: uploadResult.fileUrl,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
        category,
        relatedId: relatedId ? parseInt(relatedId) : null,
        relatedType: relatedType || null,
        description: description || null,
      },
    });

    return apiResponse(fileRecord, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/upload - List files
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse', 'lab_tech', 'pharmacist', 'cashier']);
    const hospitalId = parseInt(session.user.hospitalId);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const relatedId = searchParams.get('relatedId');
    const relatedType = searchParams.get('relatedType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = { hospitalId };
    if (category) where.category = category;
    if (relatedId) where.relatedId = parseInt(relatedId);
    if (relatedType) where.relatedType = relatedType;

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      }),
      prisma.file.count({ where }),
    ]);

    return apiResponse({
      files,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
