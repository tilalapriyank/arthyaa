import { NextRequest, NextResponse } from 'next/server';
import { requestEmailVerification, verifyEmail } from '@/lib/auth';

// Request email verification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    const result = await requestEmailVerification(userId, ipAddress, userAgent);

    if (result.success) {
      // TODO: Send verification email
      // const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${result.token}`;
      // await sendEmailVerification(user.email, verificationLink);

      return NextResponse.json({
        success: true,
        message: result.message
      });
    }

    return NextResponse.json(result, { status: 400 });
  } catch (error) {
    console.error('Email verification request error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send verification email'
      },
      { status: 500 }
    );
  }
}

// Verify email with token
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Verification token is required' },
        { status: 400 }
      );
    }

    const result = await verifyEmail(token, ipAddress, userAgent);

    if (result.success) {
      return NextResponse.json(result);
    }

    return NextResponse.json(result, { status: 400 });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to verify email'
      },
      { status: 500 }
    );
  }
}