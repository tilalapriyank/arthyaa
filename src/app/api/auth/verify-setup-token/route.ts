import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || token.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Setup token is required' },
        { status: 400 }
      );
    }

    // Find user with the setup token
    const user = await prisma.user.findFirst({
      where: {
        setupToken: token.trim(),
        setupTokenExpiry: {
          gt: new Date()
        },
        role: 'SOCIETY_ADMIN',
        password: null // Ensure user hasn't set password yet
      },
      include: {
        society: {
          select: {
            name: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid, expired, or already used setup token' },
        { status: 400 }
      );
    }

    // Check if user already has a password set
    if (user.password) {
      return NextResponse.json(
        { success: false, message: 'Password has already been set for this account' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      societyName: user.society?.name,
      message: 'Setup token is valid'
    });
  } catch (error) {
    console.error('Error verifying setup token:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
