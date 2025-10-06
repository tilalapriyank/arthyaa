import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let societyId = searchParams.get('societyId');

    console.log('Blocks API - Society ID:', societyId);

    // Verify authentication using cookies
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'No authentication token' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'SOCIETY_ADMIN' && decoded.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // If no societyId provided, get it from user's profile (for SOCIETY_ADMIN)
    if (!societyId) {
      if (decoded.role === 'SOCIETY_ADMIN') {
        // Get society ID from user's profile
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          include: { society: true }
        });

        if (!user?.society) {
          return NextResponse.json({ success: false, message: 'User not associated with any society' }, { status: 400 });
        }

        societyId = user.society.id;
        console.log('Got society ID from user profile:', societyId);
      } else {
        // ADMIN users must provide societyId
        return NextResponse.json({ success: false, message: 'Society ID is required for admin users' }, { status: 400 });
      }
    }

    // Fetch blocks for the society with flats count
    const blocks = await prisma.block.findMany({
      where: {
        societyId: societyId
      },
      include: {
        _count: {
          select: {
            flats: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log('Blocks found for society:', societyId, 'Count:', blocks.length);

    return NextResponse.json({
      success: true,
      blocks: blocks
    });

  } catch (error) {
    console.error('Error fetching blocks:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch blocks' }, { status: 500 });
  }
}
