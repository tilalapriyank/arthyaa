import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/member/secretary/members/[id] - Get specific member details
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
    if (!decoded || decoded.role !== 'MEMBER') {
      return NextResponse.json({ success: false, message: 'Unauthorized - Member access required' }, { status: 403 });
    }

    const { id } = await params;

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

    // Get the specific member
    const member = await prisma.user.findFirst({
      where: { 
        id: id,
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
        isOtpVerified: true,
        isEmailVerified: true,
        // Document status fields for tenants
        agreementDocument: true,
        agreementDocumentStatus: true,
        policyVerificationDocument: true,
        policyVerificationDocumentStatus: true,
        policyVerificationDeadline: true,
        // Society information
        society: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      }
    });

    if (!member) {
      return NextResponse.json(
        { success: false, message: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      member
    });

  } catch (error) {
    console.error('Error fetching member details:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/member/secretary/members/[id] - Update member details
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
    if (!decoded || decoded.role !== 'MEMBER') {
      return NextResponse.json({ success: false, message: 'Unauthorized - Member access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

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

    // Check if member exists and belongs to the same society
    const existingMember = await prisma.user.findFirst({
      where: { 
        id: id,
        societyId: secretary.societyId,
        role: 'MEMBER'
      }
    });

    if (!existingMember) {
      return NextResponse.json(
        { success: false, message: 'Member not found' },
        { status: 404 }
      );
    }

    // Update member details
    const updatedMember = await prisma.user.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        flatNumber: body.flatNumber,
        blockNumber: body.blockNumber,
        memberType: body.memberType,
        isSecretary: body.isSecretary,
        status: body.status
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
        isSecretary: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Member updated successfully',
      member: updatedMember
    });

  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/member/secretary/members/[id] - Delete member
export async function DELETE(
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
    if (!decoded || decoded.role !== 'MEMBER') {
      return NextResponse.json({ success: false, message: 'Unauthorized - Member access required' }, { status: 403 });
    }

    const { id } = await params;

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

    // Check if member exists and belongs to the same society
    const existingMember = await prisma.user.findFirst({
      where: { 
        id: id,
        societyId: secretary.societyId,
        role: 'MEMBER'
      }
    });

    if (!existingMember) {
      return NextResponse.json(
        { success: false, message: 'Member not found' },
        { status: 404 }
      );
    }

    // Prevent secretary from deleting themselves
    if (id === decoded.id) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete the member
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Member deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
