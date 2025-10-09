import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

// PUT /api/society-admin/members/[id]/documents - Update document status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { documentType, status, comments } = body;

    // Validate document type and status
    const validDocumentTypes = ['agreement', 'policyVerification'];
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];

    if (!validDocumentTypes.includes(documentType)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid document type' 
      }, { status: 400 });
    }

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid status' 
      }, { status: 400 });
    }

    // Check if member exists
    const member = await prisma.user.findUnique({
      where: { id },
      include: { society: true }
    });

    if (!member) {
      return NextResponse.json({ 
        success: false, 
        message: 'Member not found' 
      }, { status: 404 });
    }

    // Check if user has permission to update this member's documents
    if (decoded.role === 'SOCIETY_ADMIN' && member.societyId !== decoded.societyId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized to update this member' 
      }, { status: 403 });
    }

    // Update document status based on document type
    const updateData: any = {};
    
    if (documentType === 'agreement') {
      updateData.agreementDocumentStatus = status;
    } else if (documentType === 'policyVerification') {
      updateData.policyVerificationDocumentStatus = status;
    }

    const updatedMember = await prisma.user.update({
      where: { id },
      data: updateData
    });

    // Log the status change
    await prisma.auditLog.create({
      data: {
        userId: decoded.id,
        action: 'DOCUMENT_STATUS_UPDATE',
        details: {
          memberId: id,
          documentType,
          status,
          comments: comments || null
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Document status updated successfully',
      member: {
        id: updatedMember.id,
        firstName: updatedMember.firstName,
        lastName: updatedMember.lastName,
        agreementDocumentStatus: updatedMember.agreementDocumentStatus,
        policyVerificationDocumentStatus: updatedMember.policyVerificationDocumentStatus
      }
    });

  } catch (error) {
    console.error('Error updating document status:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update document status' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// GET /api/society-admin/members/[id]/documents - Get document status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const member = await prisma.user.findUnique({
      where: { id },
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
        agreementDocument: true,
        agreementDocumentStatus: true,
        policyVerificationDocument: true,
        policyVerificationDocumentStatus: true,
        policyVerificationDeadline: true,
        societyId: true
      }
    });

    if (!member) {
      return NextResponse.json({ 
        success: false, 
        message: 'Member not found' 
      }, { status: 404 });
    }

    // Check if user has permission to view this member's documents
    if (decoded.role === 'SOCIETY_ADMIN' && member.societyId !== decoded.societyId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized to view this member' 
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      member
    });

  } catch (error) {
    console.error('Error fetching document status:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch document status' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

