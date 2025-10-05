import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const societyId = searchParams.get('societyId');

    console.log('Blocks API - Society ID:', societyId);

    if (!societyId) {
      return NextResponse.json({ success: false, message: 'Society ID is required' }, { status: 400 });
    }

    // Get user from session using cookies
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/me`, {
      headers: {
        'Cookie': cookieHeader
      }
    });

    const userData = await userResponse.json();
    if (!userData.success || (userData.user.role !== 'SOCIETY_ADMIN' && userData.user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Fetch blocks for the society
    const blocks = await prisma.block.findMany({
      where: {
        societyId: societyId
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
