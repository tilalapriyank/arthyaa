import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ success: false, message: 'No authentication token' }, { status: 401 });
    }

    const user = verifyToken(token);
    
    if (!user || user.role !== 'MEMBER') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const receipt = await prisma.receipt.findFirst({
      where: {
        id: id,
        memberId: user.id
      }
    });

    if (!receipt) {
      return NextResponse.json({ success: false, message: 'Receipt not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      receipt
    });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ success: false, message: 'No authentication token' }, { status: 401 });
    }

    const user = verifyToken(token);
    
    if (!user || user.role !== 'MEMBER') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const receipt = await prisma.receipt.findFirst({
      where: {
        id: id,
        memberId: user.id
      }
    });

    if (!receipt) {
      return NextResponse.json({ success: false, message: 'Receipt not found' }, { status: 404 });
    }

    await prisma.receipt.delete({
      where: {
        id: id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Receipt deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting receipt:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
