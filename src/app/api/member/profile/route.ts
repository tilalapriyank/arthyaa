import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'No authentication token' }, { status: 401 });
    }

    // Verify token and get user info
    const userInfo = verifyToken(token);
    if (!userInfo || userInfo.role !== 'MEMBER') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user profile (using User model from schema)
    const user = await prisma.user.findUnique({
      where: { id: userInfo.id },
      include: {
        society: {
          select: {
            name: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      member: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        isSecretary: user.isSecretary,
        societyId: user.societyId,
        flatNumber: user.flatNumber,
        blockNumber: user.blockNumber,
        societyName: user.society?.name,
        // Additional fields from User model
        isActive: user.status === 'ACTIVE',
        joinedAt: user.createdAt?.toISOString(),
        memberType: user.memberType,
        status: user.status,
        // Document status fields for tenants
        agreementDocumentStatus: user.agreementDocumentStatus,
        policyVerificationDocumentStatus: user.policyVerificationDocumentStatus,
        policyVerificationDeadline: user.policyVerificationDeadline?.toISOString(),
        agreementDocument: user.agreementDocument,
        policyVerificationDocument: user.policyVerificationDocument,
        // Note: Documents and other fields would need to be added to the User model
        // or handled through separate API calls
        documents: [] // Placeholder - would need Document model
      }
    });

  } catch (error) {
    console.error('Error fetching member profile:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const {
      firstName,
      lastName,
      phone
    } = body;

    // Update user profile (only fields that exist in the User model)
    const updatedUser = await prisma.user.update({
      where: { id: userInfo.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        updatedAt: new Date()
      },
      include: {
        society: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      member: {
        id: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        isSecretary: updatedUser.isSecretary,
        societyId: updatedUser.societyId,
        flatNumber: updatedUser.flatNumber,
        blockNumber: updatedUser.blockNumber,
        societyName: updatedUser.society?.name,
        documents: [] // Placeholder
      }
    });

  } catch (error) {
    console.error('Error updating member profile:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
