import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

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
        lastLoginAt: true
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

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      flatId,
      blockId,
      memberType,
      isSecretary
    } = body;

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