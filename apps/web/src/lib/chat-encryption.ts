import crypto from 'crypto';

// NDPR/HIPAA Compliant Encryption for Chat Messages
// Uses AES-256-GCM encryption

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Fixed master encryption key - MUST be consistent across restarts
// In production, set CHAT_ENCRYPTION_KEY in environment variables
// For development, we use a fixed 64-character hex key (32 bytes)
const MASTER_KEY = process.env.CHAT_ENCRYPTION_KEY || 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';

/**
 * Generate a random encryption key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Encrypt data using AES-256-GCM
 * @param plaintext - The data to encrypt
 * @param key - Encryption key (if not provided, generates new one)
 * @returns Object containing encrypted data, IV, and auth tag
 */
export function encrypt(plaintext: string, key?: string): {
  encryptedData: string;
  iv: string;
  authTag: string;
  key: string;
} {
  const encryptionKey = key || generateEncryptionKey();
  const keyBuffer = Buffer.from(encryptionKey, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    key: encryptionKey,
  };
}

/**
 * Decrypt data using AES-256-GCM
 * @param encryptedData - The encrypted data
 * @param key - Decryption key
 * @param iv - Initialization vector
 * @param authTag - Authentication tag
 * @returns Decrypted plaintext
 */
export function decrypt(
  encryptedData: string,
  key: string,
  iv: string,
  authTag: string
): string {
  const keyBuffer = Buffer.from(key, 'hex');
  const ivBuffer = Buffer.from(iv, 'hex');
  const authTagBuffer = Buffer.from(authTag, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, ivBuffer);
  decipher.setAuthTag(authTagBuffer);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Encrypt a message for storage in database
 * Returns combined string with format: iv:authTag:encryptedData
 */
export function encryptMessage(message: string): { encrypted: string; key: string } {
  const { encryptedData, iv, authTag, key } = encrypt(message);
  const encrypted = `${iv}:${authTag}:${encryptedData}`;
  return { encrypted, key };
}

/**
 * Decrypt a message from database
 * Expects format: iv:authTag:encryptedData
 */
export function decryptMessage(encryptedMessage: string, key: string): string {
  const [iv, authTag, encryptedData] = encryptedMessage.split(':');
  if (!iv || !authTag || !encryptedData) {
    throw new Error('Invalid encrypted message format');
  }
  return decrypt(encryptedData, key, iv, authTag);
}

/**
 * Encrypt file data for storage
 */
export function encryptFile(
  fileBuffer: Buffer
): { encrypted: string; key: string } {
  const base64Data = fileBuffer.toString('base64');
  return encryptMessage(base64Data);
}

/**
 * Decrypt file data from storage
 */
export function decryptFile(encryptedData: string, key: string): Buffer {
  const decryptedBase64 = decryptMessage(encryptedData, key);
  return Buffer.from(decryptedBase64, 'base64');
}

/**
 * Encrypt a key using master key (for storing per-message keys)
 */
export function encryptKey(key: string): string {
  const masterKeyBuffer = Buffer.from(MASTER_KEY, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, masterKeyBuffer, iv);
  
  let encrypted = cipher.update(key, 'hex', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a key using master key
 */
export function decryptKey(encryptedKey: string): string {
  const [iv, authTag, encryptedData] = encryptedKey.split(':');
  if (!iv || !authTag || !encryptedData) {
    throw new Error('Invalid encrypted key format');
  }
  
  const masterKeyBuffer = Buffer.from(MASTER_KEY, 'hex');
  const ivBuffer = Buffer.from(iv, 'hex');
  const authTagBuffer = Buffer.from(authTag, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, masterKeyBuffer, ivBuffer);
  decipher.setAuthTag(authTagBuffer);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'hex');
  decrypted += decipher.final('hex');
  
  return decrypted;
}

/**
 * Hash a value (for indexing without exposing plaintext)
 */
export function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}
