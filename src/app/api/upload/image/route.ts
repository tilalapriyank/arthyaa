import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary, validateFileType, validateFileSize } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'arthyaa/images';
    const width = formData.get('width') as string;
    const height = formData.get('height') as string;
    const quality = formData.get('quality') as string || 'auto';
    const format = formData.get('format') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type (images only)
    const typeValidation = validateFileType(file, 'image');
    if (!typeValidation.isValid) {
      return NextResponse.json(
        { success: false, error: typeValidation.error },
        { status: 400 }
      );
    }

    // Validate file size (5MB max for images)
    const sizeValidation = validateFileSize(file, 5);
    if (!sizeValidation.isValid) {
      return NextResponse.json(
        { success: false, error: sizeValidation.error },
        { status: 400 }
      );
    }

    // Build transformation options
    const transformation: any = {
      quality,
    };

    if (width || height) {
      transformation.width = width ? parseInt(width) : undefined;
      transformation.height = height ? parseInt(height) : undefined;
      transformation.crop = 'fill';
      transformation.gravity = 'auto';
    }

    if (format) {
      transformation.format = format;
    }

    // Upload to Cloudinary with transformations
    const result = await uploadToCloudinary(file, {
      folder,
      resource_type: 'image',
      transformation,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      public_id: result.public_id,
      secure_url: result.secure_url,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      transformation,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

