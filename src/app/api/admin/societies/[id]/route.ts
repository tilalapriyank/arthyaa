import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

// DELETE /api/admin/societies/[id] - Delete society
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication using cookies
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'No authentication token' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    // Check if society exists
    const society = await prisma.society.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    if (!society) {
      return NextResponse.json(
        { success: false, message: 'Society not found' },
        { status: 404 }
      );
    }

    // Delete all users (members) belonging to this society first
    await prisma.user.deleteMany({
      where: { societyId: id }
    });

    // Also delete any user with the same email as the society (if society has email)
    if (society.email) {
      await prisma.user.deleteMany({
        where: { email: society.email }
      });
    }

    // Delete the society
    await prisma.society.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Society deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting society:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/societies/[id] - Update society
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication using cookies
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'No authentication token' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, address, city, state, pincode } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Society name is required' },
        { status: 400 }
      );
    }

    // Check if society exists
    const existingSociety = await prisma.society.findUnique({
      where: { id }
    });

    if (!existingSociety) {
      return NextResponse.json(
        { success: false, message: 'Society not found' },
        { status: 404 }
      );
    }

    // Update the society
    const society = await prisma.society.update({
      where: { id },
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        pincode: pincode?.trim() || null
      },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      society,
      message: 'Society updated successfully'
    });
  } catch (error) {
    console.error('Error updating society:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

