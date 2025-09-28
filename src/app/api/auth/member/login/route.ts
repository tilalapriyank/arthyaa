import { NextRequest, NextResponse } from 'next/server';
import { generateOTP, verifyOTP } from '@/lib/auth';
import { validateInput, memberLoginSchema, memberOtpVerifySchema } from '@/lib/validation';

// Request OTP for member login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Validate input for OTP request
    const { phone } = validateInput(memberLoginSchema, { ...body, type: 'otp-request' });

    const result = await generateOTP(phone, ipAddress, userAgent);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Member login API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Verify OTP for member login
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Validate input for OTP verification
    const { phone, firebaseUid } = validateInput(memberOtpVerifySchema, { ...body, type: 'otp-verify' });

    const result = await verifyOTP(phone, firebaseUid, ipAddress, userAgent);

    if (result.success) {
      const response = NextResponse.json({
        ...result,
        redirectUrl: '/member/dashboard' // Add redirect URL for frontend
      });

      response.cookies.set('auth-token', result.token!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 // 7 days
      });

      return response;
    }

    return NextResponse.json(result, { status: 401 });

  } catch (error) {
    console.error('Member OTP verification API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}