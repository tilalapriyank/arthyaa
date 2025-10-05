import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const societyId = searchParams.get('societyId');

    console.log('Test API - Society ID:', societyId);

    if (!societyId) {
      return NextResponse.json({ success: false, message: 'Society ID is required' }, { status: 400 });
    }

    // Check if society exists
    const society = await prisma.society.findUnique({
      where: { id: societyId }
    });

    if (!society) {
      return NextResponse.json({ success: false, message: 'Society not found' }, { status: 404 });
    }

    // Fetch all blocks for the society
    const blocks = await prisma.block.findMany({
      where: {
        societyId: societyId
      },
      orderBy: {
        name: 'asc'
      },
      include: {
        flats: true
      }
    });

    // Fetch all societies to see what's available
    const allSocieties = await prisma.society.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            blockList: true
          }
        }
      }
    });

    console.log('All societies with block counts:', allSocieties);
    console.log('Blocks found for society:', societyId, 'Count:', blocks.length);

    return NextResponse.json({
      success: true,
      society: society,
      blocks: blocks,
      allSocieties: allSocieties
    });

  } catch (error) {
    console.error('Error in test API:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch data' }, { status: 500 });
  }
}
