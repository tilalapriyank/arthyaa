import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'SOCIETY_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { status, rejectionReason } = await request.json();

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
    }

    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (status === 'APPROVED') {
      updateData.approvedBy = session.user.id;
      updateData.approvedAt = new Date();
    } else if (status === 'REJECTED') {
      updateData.rejectedBy = session.user.id;
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = rejectionReason;
    }

    const receipt = await prisma.receipt.update({
      where: {
        id: params.id
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
