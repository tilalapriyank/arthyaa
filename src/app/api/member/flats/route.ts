import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'No authentication token' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'MEMBER') {
      return NextResponse.json({ success: false, message: 'Unauthorized - Member access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const blockId = searchParams.get('blockId');

    if (!blockId) {
      return NextResponse.json({ success: false, message: 'Block ID is required' }, { status: 400 });
    }

    // Verify the block belongs to the member's society
    const block = await prisma.block.findFirst({
      where: {
        id: blockId,
        society: {
          users: {
            some: {
              id: decoded.id
            }
          }
        }
      }
    });

    if (!block) {
      return NextResponse.json({ success: false, message: 'Block not found or access denied' }, { status: 404 });
    }

    // Fetch flats for the block
    const flats = await prisma.flat.findMany({
      where: {
        blockId: blockId
      },
      select: {
        id: true,
        name: true,
        floorNumber: true
      },
      orderBy: [
        { floorNumber: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      flats
    });

  } catch (error) {
    console.error('Error fetching flats:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
