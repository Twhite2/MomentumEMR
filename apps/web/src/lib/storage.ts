import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';

// Initialize Backblaze B2 S3-compatible client
const s3Client = new S3Client({
  endpoint: process.env.B2_ENDPOINT || 'https://s3.us-west-004.backblazeb2.com',
  region: process.env.B2_REGION || 'us-west-004',
  credentials: {
    accessKeyId: process.env.B2_KEY_ID || '',
    secretAccessKey: process.env.B2_APPLICATION_KEY || '',
  },
});

const BUCKET_NAME = process.env.B2_BUCKET_NAME || 'emr-uploads';

export interface UploadOptions {
  file: Buffer;
  fileName: string;
  contentType: string;
  folder?: string; // Optional folder path like 'logos', 'documents', 'images'
}

/**
 * Upload file to Backblaze B2
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
        // Make file publicly readable
        ACL: 'public-read',
      })
    );

    // Return public URL
    const publicUrl = `${process.env.B2_ENDPOINT}/${BUCKET_NAME}/${key}`;
    return publicUrl;
  } catch (error) {
    console.error('Error uploading file to B2:', error);
    throw new Error('Failed to upload file');
  }
}

/**
 * Delete file from Backblaze B2
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    // Extract key from URL
    const url = new URL(fileUrl);
    const key = url.pathname.split(`/${BUCKET_NAME}/`)[1];

    if (!key) {
      throw new Error('Invalid file URL');
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
