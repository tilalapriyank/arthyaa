import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordReset, resetPassword } from '@/lib/auth';
import { validateInput, passwordResetRequestSchema, passwordResetSchema } from '@/lib/validation';

// Request password reset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Validate input
    const { email } = validateInput(passwordResetRequestSchema, body);

    const result = await requestPasswordReset(email, ipAddress, userAgent);

    if (result.success) {
      // TODO: Send email with reset link
      // const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${result.token}`;
      // await sendPasswordResetEmail(email, resetLink);

      return NextResponse.json({
        success: true,
        message: result.message
      });
    }

    return NextResponse.json(result, { status: 400 });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process password reset request'
      },
      { status: 500 }
    );
  }
}

// Reset password with token
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Validate input
    const { token, password } = validateInput(passwordResetSchema, body);

    const result = await resetPassword(token, password, ipAddress, userAgent);

    if (result.success) {
      return NextResponse.json(result);
    }

    return NextResponse.json(result, { status: 400 });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reset password'
      },
      { status: 500 }
    );
  }
}