import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/member/secretary/members - Get all members for secretary
export async function GET(request: NextRequest) {
  try {
    // Verify authentication using cookies
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'No authentication token' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'MEMBER') {
      return NextResponse.json({ success: false, message: 'Unauthorized - Member access required' }, { status: 403 });
    }

    // Get the secretary's details including isSecretary field
    const secretary = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { 
        societyId: true,
        isSecretary: true
      }
    });

    if (!secretary?.isSecretary) {
      return NextResponse.json({ success: false, message: 'Unauthorized - Secretary access required' }, { status: 403 });
    }

    if (!secretary?.societyId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Secretary not associated with any society' 
      }, { status: 400 });
    }

    // Get all members for the society
    const members = await prisma.user.findMany({
      where: { 
        societyId: secretary.societyId,
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
    console.error('Error fetching members for secretary:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/member/secretary/members - Add new member (secretary only)
export async function POST(request: NextRequest) {
  try {
    // Verify authentication using cookies
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'No authentication token' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'MEMBER') {
      return NextResponse.json({ success: false, message: 'Unauthorized - Member access required' }, { status: 403 });
    }

    // Get the secretary's details including isSecretary field
    const secretary = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { 
        societyId: true,
        isSecretary: true
      }
    });

    if (!secretary?.isSecretary) {
      return NextResponse.json({ success: false, message: 'Unauthorized - Secretary access required' }, { status: 403 });
    }

    if (!secretary?.societyId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Secretary not associated with any society' 
      }, { status: 400 });
    }

    // Handle FormData for file uploads
    const formData = await request.formData();
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const flatNumber = formData.get('flatNumber') as string;
    const blockNumber = formData.get('blockNumber') as string;
    const memberType = formData.get('memberType') as string;
    const isSecretary = formData.get('isSecretary') === 'true';
    const rentAgreement = formData.get('rentAgreement') as File | null;
    const idProof = formData.get('idProof') as File | null;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !flatNumber || !blockNumber) {
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

    // Check if phone already exists
    const existingPhone = await prisma.user.findUnique({
      where: { phone }
    });

    if (existingPhone) {
      return NextResponse.json({ 
        success: false, 
        message: 'Phone number already exists' 
      }, { status: 400 });
    }

    // Create the new member
    const newMember = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        role: 'MEMBER',
        status: 'ACTIVE',
        memberType: memberType as 'OWNER' | 'TENANT',
        flatNumber,
        blockNumber,
        isSecretary,
        societyId: secretary.societyId,
        isOtpVerified: false, // Will need to verify OTP
        // For tenants, set up document tracking
        ...(memberType === 'TENANT' && {
          agreementDocumentStatus: 'PENDING',
          policyVerificationDocumentStatus: 'PENDING',
          policyVerificationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        })
      }
    });

    // TODO: Handle file uploads for rent agreement and ID proof if provided
    // This would require implementing file upload logic similar to society-admin

    return NextResponse.json({
      success: true,
      message: 'Member added successfully',
      member: {
        id: newMember.id,
        firstName: newMember.firstName,
        lastName: newMember.lastName,
        email: newMember.email,
        phone: newMember.phone
      }
    });

  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
