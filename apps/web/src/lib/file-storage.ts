import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Storage configuration
const USE_S3 = process.env.USE_S3 === 'true';
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// S3/R2 configuration
const s3Client = USE_S3
  ? new S3Client({
      region: process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT, // For Cloudflare R2: https://[account-id].r2.cloudflarestorage.com
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
    })
  : null;

const S3_BUCKET = process.env.S3_BUCKET || 'emr-files';

export type FileCategory =
  | 'patient_photos'
  | 'lab_results'
  | 'prescriptions'
  | 'medical_records'
  | 'invoices'
  | 'dicom_images'
  | 'documents';

interface UploadResult {
  fileId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  category: FileCategory;
}

export class FileStorage {
  /**
   * Ensure local upload directory exists
   */
  private static async ensureUploadDir(category: FileCategory) {
    const dir = path.join(LOCAL_UPLOAD_DIR, category);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    return dir;
  }

  /**
   * Generate a unique file ID
   */
  private static generateFileId(originalName: string): string {
    const ext = path.extname(originalName);
    return `${uuidv4()}${ext}`;
  }

  /**
   * Upload file to S3/R2
   */
  private static async uploadToS3(
    file: Buffer,
    fileId: string,
    category: FileCategory,
    mimeType: string
  ): Promise<string> {
    if (!s3Client) {
      throw new Error('S3 client not initialized');
    }

    const key = `${category}/${fileId}`;

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: file,
      ContentType: mimeType,
    });

    await s3Client.send(command);

    // Return the file URL (adjust based on your S3/R2 configuration)
    return `${process.env.S3_PUBLIC_URL}/${key}`;
  }

  /**
   * Upload file to local storage
   */
  private static async uploadToLocal(
    file: Buffer,
    fileId: string,
    category: FileCategory
  ): Promise<string> {
    const dir = await this.ensureUploadDir(category);
    const filePath = path.join(dir, fileId);
    await writeFile(filePath, file);

    // Return the file URL (API endpoint to serve the file)
    return `/api/files/${category}/${fileId}`;
  }

  /**
   * Upload a file
   */
  static async uploadFile(
    file: Buffer,
    originalName: string,
    mimeType: string,
    category: FileCategory,
    fileSize: number
  ): Promise<UploadResult> {
    const fileId = this.generateFileId(originalName);

    let fileUrl: string;

    if (USE_S3) {
      fileUrl = await this.uploadToS3(file, fileId, category, mimeType);
    } else {
      fileUrl = await this.uploadToLocal(file, fileId, category);
    }

    return {
      fileId,
      fileName: originalName,
      fileUrl,
      fileSize,
      mimeType,
      category,
    };
  }

  /**
   * Get a signed URL for private S3 files (expires in 1 hour)
   */
  static async getSignedUrl(fileId: string, category: FileCategory): Promise<string> {
    if (!USE_S3 || !s3Client) {
      // For local storage, return the public URL
      return `/api/files/${category}/${fileId}`;
    }

    const key = `${category}/${fileId}`;

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  }

  /**
   * Delete a file
   */
  static async deleteFile(fileId: string, category: FileCategory): Promise<void> {
    if (USE_S3 && s3Client) {
      const key = `${category}/${fileId}`;
      const command = new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      });
      await s3Client.send(command);
    } else {
      // For local storage, you might want to implement file deletion
      // const filePath = path.join(LOCAL_UPLOAD_DIR, category, fileId);
      // await unlink(filePath);
    }
  }

  /**
   * Validate file type
   */
  static isValidFileType(mimeType: string, category: FileCategory): boolean {
    const allowedTypes: Record<FileCategory, string[]> = {
      patient_photos: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
      lab_results: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      prescriptions: ['application/pdf', 'image/jpeg', 'image/png'],
      medical_records: ['application/pdf', 'image/jpeg', 'image/png'],
      invoices: ['application/pdf'],
      dicom_images: ['application/dicom', 'image/jpeg', 'image/png'],
      documents: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
      ],
    };

    return allowedTypes[category]?.includes(mimeType) || false;
  }

  /**
   * Validate file size (max 10MB)
   */
  static isValidFileSize(fileSize: number, category: FileCategory): boolean {
    const maxSizes: Record<FileCategory, number> = {
      patient_photos: 5 * 1024 * 1024, // 5MB
      lab_results: 10 * 1024 * 1024, // 10MB
      prescriptions: 5 * 1024 * 1024, // 5MB
      medical_records: 10 * 1024 * 1024, // 10MB
      invoices: 5 * 1024 * 1024, // 5MB
      dicom_images: 50 * 1024 * 1024, // 50MB for DICOM
      documents: 10 * 1024 * 1024, // 10MB
    };

    return fileSize <= (maxSizes[category] || 10 * 1024 * 1024);
  }
}
