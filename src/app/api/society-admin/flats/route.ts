import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blockId = searchParams.get('blockId');

    if (!blockId) {
      return NextResponse.json({ success: false, message: 'Block ID is required' }, { status: 400 });
    }

    // Verify authentication using cookies
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'No authentication token' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'SOCIETY_ADMIN' && decoded.role !== 'ADMIN')) {
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
