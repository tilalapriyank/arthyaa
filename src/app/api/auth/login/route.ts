import { NextRequest, NextResponse } from 'next/server';
import { loginWithEmailPassword, generateOTP, verifyOTP } from '@/lib/auth';
import { validateInput, memberLoginSchema, memberOtpVerifySchema, adminLoginSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (type === 'email') {
      // Email/Password login for Admin, Society Admin
      const { email, password, role } = validateInput(adminLoginSchema, body);

      const result = await loginWithEmailPassword(email, password, role, ipAddress, userAgent);
      
      if (result.success) {
        const response = NextResponse.json(result);
        response.cookies.set('auth-token', result.token!, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 // 7 days
        });
        return response;
      }

      return NextResponse.json(result, { status: 401 });
    }

    if (type === 'otp-request') {
      // Generate OTP for member login
      const { phone } = validateInput(memberLoginSchema, body);

      const result = await generateOTP(phone, ipAddress, userAgent);
      return NextResponse.json(result);
    }

    if (type === 'otp-verify') {
      // Verify OTP for member login with Firebase UID
      const { phone, firebaseUid } = validateInput(memberOtpVerifySchema, body);

      const result = await verifyOTP(phone, firebaseUid, ipAddress, userAgent);
      
      if (result.success) {
        const response = NextResponse.json(result);
        response.cookies.set('auth-token', result.token!, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 // 7 days
        });
        return response;
      }

      return NextResponse.json(result, { status: 401 });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid login type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
