import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blockId = searchParams.get('blockId');

    if (!blockId) {
      return NextResponse.json({ success: false, message: 'Block ID is required' }, { status: 400 });
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

    // Fetch flats for the block
    const flats = await prisma.flat.findMany({
      where: {
        blockId: blockId
      },
      include: {
        block: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { floorNumber: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      flats: flats
    });

  } catch (error) {
    console.error('Error fetching flats:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch flats' }, { status: 500 });
  }
}
