import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'No authentication token' }, { status: 401 });
    }

    const userInfo = verifyToken(token);
    if (!userInfo || userInfo.role !== 'MEMBER') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG files are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        message: 'File size too large. Maximum size is 10MB.' 
      }, { status: 400 });
    }

    // Upload file to Cloudinary
    const buffer = await file.arrayBuffer();
    const uploadResult = await uploadToCloudinary(Buffer.from(buffer), {
      folder: 'member-documents',
      resource_type: 'auto',
      public_id: `${userInfo.id}-${Date.now()}-${file.name.replace(/\.[^/.]+$/, '')}`
    });

    if (!uploadResult.success) {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to upload file' 
      }, { status: 500 });
    }

    // Update the user's document fields based on document type
    let updateData: any = {};
    
    if (documentType === 'AGREEMENT') {
      updateData.agreementDocument = uploadResult.secure_url;
      updateData.agreementDocumentStatus = 'PENDING';
    } else if (documentType === 'POLICY_VERIFICATION') {
      updateData.policyVerificationDocument = uploadResult.secure_url;
      updateData.policyVerificationDocumentStatus = 'PENDING';
    }

    // Update user document fields
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: userInfo.id },
        data: updateData
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully',
      document: {
        id: 'temp-id',
        name: file.name,
        type: documentType || 'GENERAL',
        url: uploadResult.secure_url,
        status: 'PENDING',
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'No authentication token' }, { status: 401 });
    }

    const userInfo = verifyToken(token);
    if (!userInfo || userInfo.role !== 'MEMBER') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // For now, return empty array since we don't have a Document model
    // You would need to add a Document model to your Prisma schema
    return NextResponse.json({
      success: true,
      documents: []
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
