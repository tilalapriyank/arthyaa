import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

// PUT /api/society-admin/blocks/[id] - Update block
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication using cookies
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'No authentication token' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'SOCIETY_ADMIN' && decoded.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { id: blockId } = await params;
    const body = await request.json();
    const { name } = body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json({ 
        success: false, 
        message: 'Block name is required' 
      }, { status: 400 });
    }

    // Check if block exists
    const existingBlock = await prisma.block.findUnique({
      where: { id: blockId },
      include: { society: true }
    });

    if (!existingBlock) {
      return NextResponse.json({ success: false, message: 'Block not found' }, { status: 404 });
    }

    // For SOCIETY_ADMIN, check if they have access to this block's society
    if (decoded.role === 'SOCIETY_ADMIN') {
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { society: true }
      });

      if (!user?.society || user.society.id !== existingBlock.societyId) {
        return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
      }
    }

    // Update block
    const updatedBlock = await prisma.block.update({
      where: { id: blockId },
      data: {
        name: name.trim()
      },
      include: {
        flats: {
          select: {
            id: true,
            name: true,
            floorNumber: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Block updated successfully',
      block: updatedBlock
    });

  } catch (error) {
    console.error('Error updating block:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/society-admin/blocks/[id] - Delete block
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication using cookies
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'No authentication token' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'SOCIETY_ADMIN' && decoded.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { id: blockId } = await params;

    // Check if block exists
    const existingBlock = await prisma.block.findUnique({
      where: { id: blockId },
      include: { society: true }
    });

    if (!existingBlock) {
      return NextResponse.json({ success: false, message: 'Block not found' }, { status: 404 });
    }

    // For SOCIETY_ADMIN, check if they have access to this block's society
    if (decoded.role === 'SOCIETY_ADMIN') {
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { society: true }
      });

      if (!user?.society || user.society.id !== existingBlock.societyId) {
        return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
      }
    }

    // Check if block has flats
    const flatsCount = await prisma.flat.count({
      where: { blockId: blockId }
    });

    if (flatsCount > 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Cannot delete block with existing flats. Please delete all flats first.' 
      }, { status: 400 });
    }

    // Delete block
    await prisma.block.delete({
      where: { id: blockId }
    });

    return NextResponse.json({
      success: true,
      message: 'Block deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting block:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
