import { NextRequest, NextResponse } from 'next/server';
import { loginWithEmailOnly } from '@/lib/auth';
import { validateInput, simpleAdminLoginSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Validate input - only email and password, no role required
    const { email, password } = validateInput(simpleAdminLoginSchema, body);

    // Use the new function that automatically detects role
    const result = await loginWithEmailOnly(email, password, ipAddress, userAgent);

    if (result.success && result.user) {
      // Determine redirect URL based on user role
      let redirectUrl = '/admin/dashboard'; // default

      switch (result.user.role) {
        case 'ADMIN':
          redirectUrl = '/admin/dashboard';
          break;
        case 'SOCIETY_ADMIN':
          redirectUrl = '/society-admin/dashboard';
          break;
        default:
          redirectUrl = '/admin/dashboard';
      }

      const response = NextResponse.json({
        ...result,
        redirectUrl // Add redirect URL for frontend
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
    console.error('Admin login API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}