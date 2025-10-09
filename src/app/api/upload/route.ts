import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary, validateFileType, validateFileSize } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'arthyaa';
    const category = formData.get('category') as 'image' | 'document' | 'pdf' | 'all' || 'all';

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

    // Validate file size (10MB max)
    const sizeValidation = validateFileSize(file, 10);
    if (!sizeValidation.isValid) {
      return NextResponse.json(
        { success: false, error: sizeValidation.error },
        { status: 400 }
      );
    }

    // Determine resource type based on file type
    let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
    if (file.type.startsWith('image/')) {
      resourceType = 'image';
    } else if (file.type.startsWith('video/')) {
      resourceType = 'video';
    } else {
      resourceType = 'raw';
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(file, {
      folder,
      resource_type: resourceType,
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
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('public_id');
    const resourceType = searchParams.get('resource_type') as 'image' | 'video' | 'raw' || 'image';

    if (!publicId) {
      return NextResponse.json(
        { success: false, error: 'No public_id provided' },
        { status: 400 }
      );
    }

    const { deleteFromCloudinary } = await import('@/lib/cloudinary');
    const success = await deleteFromCloudinary(publicId, resourceType);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete file' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

