import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No authentication token' },
        { status: 401 }
      );
    }

    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // For SOCIETY_ADMIN users, fetch their society information
    if (user.role === 'SOCIETY_ADMIN') {
      const userWithSociety = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          society: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (userWithSociety?.society) {
        return NextResponse.json({ 
          success: true, 
          user: {
            ...user,
            societyId: userWithSociety.society.id,
            societyName: userWithSociety.society.name
          }
        });
      } else {
        return NextResponse.json(
          { success: false, message: 'Society not found for user' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
