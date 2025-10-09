import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
import { uploadToCloudinary, validateFile } from '@/lib/cloudinary';

const prisma = new PrismaClient();

// GET /api/society-admin/members - Get members for society admin
export async function GET(request: NextRequest) {
  try {
    // Verify authentication using cookies
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'No authentication token' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'SOCIETY_ADMIN' && decoded.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // Get society ID from query parameters
    const { searchParams } = new URL(request.url);
    const societyId = searchParams.get('societyId');

    if (!societyId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Society ID is required' 
      }, { status: 400 });
    }

    // Get members for the society
    const members = await prisma.user.findMany({
      where: { 
        societyId: societyId,
        role: 'MEMBER'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        memberType: true,
        flatNumber: true,
        blockNumber: true,
        isSecretary: true,
        createdAt: true,
        lastLoginAt: true,
        // Document status fields for tenants
        agreementDocument: true,
        agreementDocumentStatus: true,
        policyVerificationDocument: true,
        policyVerificationDocumentStatus: true,
        policyVerificationDeadline: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      members
    });

  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/society-admin/members - Add new member
export async function POST(request: NextRequest) {
  try {
    // Verify authentication using cookies
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'No authentication token' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'SOCIETY_ADMIN' && decoded.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // Handle FormData for file uploads
    const formData = await request.formData();
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const flatId = formData.get('flatId') as string;
    const blockId = formData.get('blockId') as string;
    const memberType = formData.get('memberType') as string;
    const isSecretary = formData.get('isSecretary') === 'true';
    const rentAgreement = formData.get('rentAgreement') as File | null;
    const idProof = formData.get('idProof') as File | null;

    // Get society ID from query parameters
    const { searchParams } = new URL(request.url);
    const societyId = searchParams.get('societyId');

    if (!societyId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Society ID is required' 
      }, { status: 400 });
    }

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !flatId || !blockId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields' 
      }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ 
        success: false, 
        message: 'Email already exists' 
      }, { status: 400 });
    }

    // Get flat and block details for display purposes
    const flat = await prisma.flat.findUnique({
      where: { id: flatId },
      include: { block: true }
    });

    if (!flat) {
        return NextResponse.json({ 
          success: false, 
        message: 'Invalid flat selected' 
        }, { status: 400 });
    }

    // Handle file uploads for tenants
    let rentAgreementUrl = null;
    let idProofUrl = null;

    if (memberType === 'TENANT') {
      // Validate and upload rent agreement
      if (rentAgreement) {
        const rentValidation = validateFile(rentAgreement, [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png'
        ], 10);
        
        if (!rentValidation.isValid) {
          return NextResponse.json({ 
            success: false, 
            message: `Rent Agreement: ${rentValidation.error}` 
          }, { status: 400 });
        }

        const rentUpload = await uploadToCloudinary(rentAgreement, {
          folder: `arthyaa/societies/${societyId}/members/documents`,
          resource_type: 'auto'
        });
        
        if (!rentUpload.success) {
          return NextResponse.json({ 
            success: false, 
            message: `Failed to upload rent agreement: ${rentUpload.error}` 
          }, { status: 500 });
        }
        rentAgreementUrl = rentUpload.secure_url;
      }

      // Validate and upload ID proof
      if (idProof) {
        const idValidation = validateFile(idProof, [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png'
        ], 10);
        
        if (!idValidation.isValid) {
          return NextResponse.json({ 
            success: false, 
            message: `ID Proof: ${idValidation.error}` 
          }, { status: 400 });
        }

        const idUpload = await uploadToCloudinary(idProof, {
          folder: `arthyaa/societies/${societyId}/members/documents`,
          resource_type: 'auto'
        });
        
        if (!idUpload.success) {
          return NextResponse.json({ 
            success: false, 
            message: `Failed to upload ID proof: ${idUpload.error}` 
          }, { status: 500 });
        }
        idProofUrl = idUpload.secure_url;
      }

      // Check if rent agreement is provided for tenants (required)
      if (!rentAgreement) {
        return NextResponse.json({ 
          success: false, 
          message: 'Rent agreement is required for tenant members' 
        }, { status: 400 });
      }
    }

    // Create the member
    const member = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        role: 'MEMBER',
        status: 'ACTIVE', // Members are automatically active
        isSecretary: isSecretary || false,
        memberType: memberType || 'OWNER',
        flatNumber: flat.name, // Store flat name for display
        blockNumber: flat.block.name, // Store block name for display
        societyId,
        isOtpVerified: false,
        isEmailVerified: false,
        password: null, // Members will use OTP login
        // Store document URLs for tenants
        agreementDocument: rentAgreementUrl,
        agreementDocumentStatus: memberType === 'TENANT' && rentAgreementUrl ? 'PENDING' : null,
        policyVerificationDocument: idProofUrl,
        policyVerificationDocumentStatus: memberType === 'TENANT' && idProofUrl ? 'PENDING' : null,
        // Set deadline for policy verification (1 month from now)
        policyVerificationDeadline: memberType === 'TENANT' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Member added successfully',
      member: {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        flatNumber: member.flatNumber,
        blockNumber: member.blockNumber,
        memberType: member.memberType,
        isSecretary: member.isSecretary,
        status: member.status,
        createdAt: member.createdAt
      }
    });

  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to add member' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/society-admin/members - Delete member
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication using cookies
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'No authentication token' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'SOCIETY_ADMIN' && decoded.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Member ID is required' 
      }, { status: 400 });
    }

    // Delete the member
    await prisma.user.delete({
      where: { id: memberId }
    });

    return NextResponse.json({
      success: true,
      message: 'Member deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to delete member' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}