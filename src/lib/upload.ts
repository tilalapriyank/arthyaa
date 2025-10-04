import fs from 'fs';
import path from 'path';

export interface UploadResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

/**
 * Handles file uploads in both local development and serverless environments
 * @param file - The file to upload
 * @param subDirectory - Subdirectory within uploads (e.g., 'societies', 'members')
 * @returns UploadResult with success status and file path
 */
export async function handleFileUpload(
  file: File,
  subDirectory: string
): Promise<UploadResult> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    
    // Check if we're in a serverless environment
    const isServerless = process.env.VERCEL || process.env.NODE_ENV === 'production';
    
    if (isServerless) {
      // In serverless environments, use /tmp directory
      const tmpDir = '/tmp';
      const tmpFilePath = path.join(tmpDir, fileName);
      
      // Write to tmp directory
      fs.writeFileSync(tmpFilePath, buffer);
      
      // Return the public path (in production, this should be a cloud storage URL)
      const publicPath = `/uploads/${subDirectory}/${fileName}`;
      
      console.warn(`File saved to tmp directory: ${tmpFilePath}. In production, use cloud storage.`);
      
      return {
        success: true,
        filePath: publicPath
      };
    } else {
      // Local development - use public directory
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', subDirectory);
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, buffer);
      
      const publicPath = `/uploads/${subDirectory}/${fileName}`;
      
      return {
        success: true,
        filePath: publicPath
      };
    }
  } catch (error) {
    console.error('Error handling file upload:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Validates file type and size
 * @param file - The file to validate
 * @param allowedTypes - Array of allowed MIME types
 * @param maxSizeInMB - Maximum file size in MB
 * @returns Validation result
 */
export function validateFile(
  file: File,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  maxSizeInMB: number = 5
): { isValid: boolean; error?: string } {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    };
  }
  
  // Check file size
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return {
      isValid: false,
      error: `File size too large. Maximum size: ${maxSizeInMB}MB`
    };
  }
  
  return { isValid: true };
}
