import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
import { receiptGenerator } from '@/lib/receipt-generator';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ success: false, message: 'No authentication token' }, { status: 401 });
    }

    const user = verifyToken(token);
    
    if (!user || user.role !== 'MEMBER') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get receipt details
    const receipt = await prisma.receipt.findFirst({
      where: {
        id: id,
        memberId: user.id,
        status: 'APPROVED'
      },
      include: {
        member: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        society: {
          select: {
            name: true,
            address: true,
            city: true,
            state: true,
            pincode: true
          }
        }
      }
    });

    if (!receipt) {
      return NextResponse.json({ success: false, message: 'Receipt not found or not approved' }, { status: 404 });
    }

    // Generate receipt PDF
    const receiptUrl = await receiptGenerator.generateReceiptPDF({
      id: receipt.id,
      blockNumber: receipt.blockNumber,
      flatNumber: receipt.flatNumber,
      amount: receipt.amount,
      paymentDate: receipt.paymentDate.toISOString(),
      purpose: receipt.purpose,
      paymentMethod: receipt.paymentMethod,
      transactionId: receipt.transactionId || undefined,
      upiId: receipt.upiId || undefined,
      member: receipt.member,
      society: receipt.society,
      createdAt: receipt.createdAt.toISOString()
    });

    // Update receipt with generated PDF URL
    await prisma.receipt.update({
      where: { id: receipt.id },
      data: { generatedReceiptUrl: receiptUrl }
    });

    // Return the receipt URL for download
    return NextResponse.json({
      success: true,
      receiptUrl
    });
  } catch (error) {
    console.error('Error generating receipt download:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
