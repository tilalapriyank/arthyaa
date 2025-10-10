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

    const user = verifyToken(token);
    
    if (!user || (user.role !== 'SOCIETY_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const societyId = searchParams.get('societyId');

    if (!societyId) {
      return NextResponse.json({ success: false, message: 'Society ID is required' }, { status: 400 });
    }

    const receipts = await prisma.receipt.findMany({
      where: {
        societyId: societyId
      },
      include: {
        member: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      receipts
    });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
