import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('Secretary blocks API called');
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'No authentication token' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'MEMBER') {
      return NextResponse.json({ success: false, message: 'Unauthorized - Member access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const societyId = searchParams.get('societyId');

    if (!societyId) {
      return NextResponse.json({ success: false, message: 'Society ID is required' }, { status: 400 });
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

    // Verify the secretary belongs to the requested society
    if (secretary.societyId !== societyId) {
      return NextResponse.json({ success: false, message: 'Unauthorized - Access denied to this society' }, { status: 403 });
    }

    // Fetch blocks for the society
    const blocks = await prisma.block.findMany({
      where: {
        societyId: societyId
      },
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      blocks
    });

  } catch (error) {
    console.error('Error fetching blocks:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}