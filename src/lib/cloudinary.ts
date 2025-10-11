import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  success: boolean;
  public_id?: string;
  secure_url?: string;
  error?: string;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  transformation?: Record<string, unknown>;
  public_id?: string;
  format?: string;
}

/**
 * Upload file to Cloudinary
 * @param file - File to upload (File object or Buffer)
 * @param options - Upload options
 * @returns Promise<CloudinaryUploadResult>
 */
export async function uploadToCloudinary(
  file: File | Buffer,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  try {
    let buffer: Buffer;
    let mimeType: string;

    if (file instanceof Buffer) {
      // If it's already a Buffer, use it directly
      buffer = file;
      mimeType = 'application/octet-stream'; // Default MIME type
    } else if (file instanceof File) {
      // If it's a File object, convert to buffer
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      mimeType = file.type;
    } else {
      throw new Error('Invalid file type. Expected File or Buffer.');
    }

    // Convert buffer to base64 string
    const base64String = buffer.toString('base64');
    const dataURI = `data:${mimeType};base64,${base64String}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: options.folder || 'arthyaa',
      resource_type: options.resource_type || 'auto',
      transformation: options.transformation,
      public_id: options.public_id,
      format: options.format,
    });

    return {
      success: true,
      public_id: result.public_id,
      secure_url: result.secure_url,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Delete file from Cloudinary
 * @param publicId - Public ID of the file to delete
 * @param resourceType - Type of resource (image, video, raw)
 * @returns Promise<boolean>
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<boolean> {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return true;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
}

/**
 * Get optimized image URL with transformations
 * @param publicId - Public ID of the image
 * @param transformations - Cloudinary transformations
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  publicId: string,
  transformations: Record<string, unknown> = {}
): string {
  return cloudinary.url(publicId, {
    ...transformations,
    secure: true,
  });
}

/**
 * Validate file type for different categories
 * @param file - File to validate
 * @param category - Category of file (image, document, pdf)
 * @returns Validation result
 */
export function validateFileType(
  file: File,
  category: 'image' | 'document' | 'pdf' | 'all'
): { isValid: boolean; error?: string } {
  const allowedTypes = {
    image: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ],
    document: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ],
    pdf: ['application/pdf'],
    all: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ],
  };

  const types = allowedTypes[category];
  
  if (!types.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types for ${category}: ${types.join(', ')}`,
    };
  }

  return { isValid: true };
}

/**
 * Get file size in MB
 * @param file - File to check
 * @returns File size in MB
 */
export function getFileSizeInMB(file: File): number {
  return file.size / (1024 * 1024);
}

/**
 * Validate file size
 * @param file - File to validate
 * @param maxSizeInMB - Maximum size in MB
 * @returns Validation result
 */
export function validateFileSize(
  file: File,
  maxSizeInMB: number = 10
): { isValid: boolean; error?: string } {
  const fileSizeInMB = getFileSizeInMB(file);
  
  if (fileSizeInMB > maxSizeInMB) {
    return {
      isValid: false,
      error: `File size too large. Maximum size: ${maxSizeInMB}MB`,
    };
  }

  return { isValid: true };
}

/**
 * Validate file type and size
 * @param file - File to validate
 * @param allowedTypes - Array of allowed MIME types
 * @param maxSizeInMB - Maximum file size in MB
 * @returns Validation result
 */
export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSizeInMB: number = 10
): { isValid: boolean; error?: string } {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file size
  const sizeValidation = validateFileSize(file, maxSizeInMB);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  return { isValid: true };
}

export default cloudinary;
