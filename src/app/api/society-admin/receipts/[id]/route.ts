import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PATCH(
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
    
    if (!user || (user.role !== 'SOCIETY_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { status, rejectionReason } = await request.json();

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
    }

    const updateData: Record<string, string | Date | undefined> = {
      status,
      updatedAt: new Date()
    };

    if (status === 'APPROVED') {
      updateData.approvedBy = user.id;
      updateData.approvedAt = new Date();
    } else if (status === 'REJECTED') {
      updateData.rejectedBy = user.id;
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = rejectionReason;
    }

    const receipt = await prisma.receipt.update({
      where: {
        id: id
      },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: `Receipt ${status.toLowerCase()} successfully`,
      receipt
    });
  } catch (error) {
    console.error('Error updating receipt status:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
