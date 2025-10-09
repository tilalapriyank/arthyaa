import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary, validateFileType, validateFileSize } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'arthyaa/documents';
    const category = formData.get('category') as 'document' | 'pdf' || 'document';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const typeValidation = validateFileType(file, category);
    if (!typeValidation.isValid) {
      return NextResponse.json(
        { success: false, error: typeValidation.error },
        { status: 400 }
      );
    }

    // Validate file size (20MB max for documents)
    const sizeValidation = validateFileSize(file, 20);
    if (!sizeValidation.isValid) {
      return NextResponse.json(
        { success: false, error: sizeValidation.error },
        { status: 400 }
      );
    }

    // Upload to Cloudinary as raw file
    const result = await uploadToCloudinary(file, {
      folder,
      resource_type: 'raw',
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
      category,
    });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

