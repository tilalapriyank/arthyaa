import { NextRequest, NextResponse } from 'next/server';
import { logout } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value;
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (authToken) {
      // Properly logout and invalidate session
      await logout(authToken, ipAddress, userAgent);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear the auth cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear the auth cookie even if logout fails
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    });

    return response;
  }
}
