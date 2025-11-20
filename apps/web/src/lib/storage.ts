import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';

// Initialize Backblaze B2 S3-compatible client
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com',
  region: process.env.S3_REGION || 'us-east-005',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true, // Required for Backblaze B2
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || process.env.S3_BUCKET || 'emr-upload';

export interface UploadOptions {
  file: Buffer;
  fileName: string;
  contentType: string;
  folder?: string; // Optional folder path like 'logos', 'documents', 'images'
}

/**
 * Upload file to Backblaze B2
 * Returns the S3 key (path) instead of full URL for private buckets
 */
export async function uploadFile(options: UploadOptions): Promise<string> {
  const { file, fileName, contentType, folder } = options;
  
  // Generate unique filename
  const fileExtension = fileName.split('.').pop();
  const uniqueFileName = `${uuid()}.${fileExtension}`;
  const key = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000',
        // Backblaze B2 doesn't support ACL parameter
        // File permissions are controlled at bucket level
      })
    );

    // For private buckets, return the key instead of URL
    // The frontend will request signed URLs via API
    console.log('File uploaded successfully. Key:', key);
    return key;
  } catch (error) {
    console.error('Error uploading file to B2:', error);
    throw new Error('Failed to upload file');
  }
}

/**
 * Delete file from Backblaze B2
 * @param fileKeyOrUrl - S3 key (e.g., 'logos/abc.png') or full URL
 */
export async function deleteFile(fileKeyOrUrl: string): Promise<void> {
  try {
    let key = fileKeyOrUrl;
    
    // If it's a full URL, extract the key
    if (fileKeyOrUrl.startsWith('http')) {
      const url = new URL(fileKeyOrUrl);
      key = url.pathname.split(`/${BUCKET_NAME}/`)[1] || fileKeyOrUrl;
    }

    if (!key) {
      throw new Error('Invalid file key or URL');
    }

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
  } catch (error) {
    console.error('Error deleting file from B2:', error);
    throw new Error('Failed to delete file');
  }
}

/**
 * Generate a signed URL for temporary access to private files
 * @param key - S3 key (e.g., 'logos/abc.png')
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 */
export async function getSignedFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate signed URL');
  }
}

/**
 * Check if a string is an S3 key (not a full URL)
 */
export function isS3Key(value: string): boolean {
  return !value.startsWith('http') && !value.startsWith('//');
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  files: Array<{ file: Buffer; fileName: string; contentType: string }>,
  folder?: string
): Promise<string[]> {
  const uploadPromises = files.map((fileData) =>
    uploadFile({
      ...fileData,
      folder,
    })
  );

  return Promise.all(uploadPromises);
}
