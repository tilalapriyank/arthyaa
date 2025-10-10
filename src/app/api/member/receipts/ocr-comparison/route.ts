import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
import { ocrService } from '@/lib/ocr';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'No authentication token' }, { status: 401 });
    }

    const user = verifyToken(token);

    if (!user || user.role !== 'MEMBER') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { useOcrData, ocrData, manualData } = await request.json();

    // Determine which data to use
    const finalData = useOcrData ? {
      blockNumber: ocrData.blockNumber || manualData.blockNumber,
      flatNumber: ocrData.flatNumber || manualData.flatNumber,
      amount: ocrData.amount || parseFloat(manualData.amount),
      paymentDate: ocrData.paymentDate || manualData.paymentDate,
      purpose: ocrData.purpose || manualData.purpose,
      paymentMethod: manualData.paymentMethod,
      transactionId: manualData.transactionId,
      upiId: manualData.upiId
    } : {
      blockNumber: manualData.blockNumber,
      flatNumber: manualData.flatNumber,
      amount: parseFloat(manualData.amount),
      paymentDate: manualData.paymentDate,
      purpose: manualData.purpose,
      paymentMethod: manualData.paymentMethod,
      transactionId: manualData.transactionId,
      upiId: manualData.upiId
    };

    // Calculate OCR match score if both data sources are available
    let ocrMatchScore = null;
    if (ocrData && !useOcrData) {
      ocrMatchScore = await ocrService.compareWithManualEntry(ocrData, manualData);
    }

    // Create the receipt
    const receipt = await prisma.receipt.create({
      data: {
        memberId: user.id,
        societyId: user.societyId!,
        blockNumber: finalData.blockNumber,
        flatNumber: finalData.flatNumber,
        amount: finalData.amount,
        paymentDate: new Date(finalData.paymentDate),
        purpose: finalData.purpose,
        paymentMethod: finalData.paymentMethod as "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE" | "OTHER",
        transactionId: finalData.transactionId || null,
        upiId: finalData.upiId || null,
        documentUrl: '', // This should be passed from the frontend
        documentName: '', // This should be passed from the frontend
        ocrData: ocrData ? JSON.stringify(ocrData) : null,
        ocrConfidence: ocrData?.confidence || null,
        ocrMatchScore,
        isManualEntry: !useOcrData
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Receipt created successfully',
      receipt
    });
  } catch (error) {
    console.error('Error processing OCR comparison:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
