import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
import { ocrService } from '@/lib/ocr';
import { uploadToCloudinary } from '@/lib/cloudinary';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ success: false, message: 'No authentication token' }, { status: 401 });
    }

    const user = verifyToken(token);
    
    if (!user || user.role !== 'MEMBER') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const receipts = await prisma.receipt.findMany({
      where: {
        memberId: user.id
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
  } finally {
    await prisma.$disconnect();
  }
}

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

    const formData = await request.formData();
    
    const blockNumber = formData.get('blockNumber') as string;
    const flatNumber = formData.get('flatNumber') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const paymentDate = formData.get('paymentDate') as string;
    const purpose = formData.get('purpose') as string;
    const paymentMethod = formData.get('paymentMethod') as string;
    const transactionId = formData.get('transactionId') as string;
    const upiId = formData.get('upiId') as string;
    const document = formData.get('document') as File;

    if (!document) {
      return NextResponse.json({ success: false, message: 'Document is required' }, { status: 400 });
    }

    // Upload document to Cloudinary
    const documentBuffer = await document.arrayBuffer();
    const documentUpload = await uploadToCloudinary(Buffer.from(documentBuffer), { folder: 'receipts' });
    
    if (!documentUpload.success) {
      return NextResponse.json({ success: false, message: 'Failed to upload document' }, { status: 500 });
    }

    // Process document with OCR
    let ocrData = null;
    try {
      ocrData = await ocrService.processReceipt(Buffer.from(documentBuffer));
    } catch (ocrError) {
      console.error('OCR processing failed:', ocrError);
      // Continue without OCR data
    }

    // Calculate OCR match score if OCR data is available
    let ocrMatchScore = null;
    let shouldApprove = true;
    
    if (ocrData && ocrData.confidence > 0.3) {
      ocrMatchScore = await ocrService.compareWithManualEntry(ocrData, {
        blockNumber,
        flatNumber,
        amount,
        paymentDate,
        purpose
      });
      
      shouldApprove = ocrService.shouldApproveReceipt(ocrMatchScore);
    }

    // Create receipt with automatic approval/rejection
    let receipt;
    try {
      receipt = await prisma.receipt.create({
        data: {
          memberId: user.id,
          societyId: user.societyId!,
          blockNumber,
          flatNumber,
          amount,
          paymentDate: new Date(paymentDate),
          purpose,
          paymentMethod: paymentMethod as 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE',
          transactionId: transactionId || null,
          upiId: upiId || null,
          documentUrl: documentUpload.secure_url!,
          documentName: document.name,
          ocrData: ocrData ? JSON.stringify(ocrData) : undefined,
          ocrConfidence: ocrData?.confidence || null,
          ocrMatchScore,
          isManualEntry: !ocrData,
          status: shouldApprove ? 'APPROVED' : 'REJECTED',
          autoApproved: true
        }
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to save receipt to database' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: shouldApprove ? 'Receipt approved successfully' : 'Receipt rejected due to low OCR match score',
      receipt,
      approved: shouldApprove,
      ocrMatchScore
    });
  } catch (error) {
    console.error('Error creating receipt:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
