import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/admin/societies - Get all societies
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, message: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const societies = await prisma.society.findMany({
      include: {
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      societies
    });
  } catch (error) {
    console.error('Error fetching societies:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/societies - Create new society
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, message: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      name, 
      address, 
      city, 
      state, 
      pincode, 
      email, 
      mobile, 
      whatsapp, 
      blocks, 
      flats, 
      adminEmail 
    } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Society name is required' },
        { status: 400 }
      );
    }

    if (!adminEmail || adminEmail.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Society admin email is required' },
        { status: 400 }
      );
    }

    const society = await prisma.society.create({
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        pincode: pincode?.trim() || null,
        email: email?.trim() || null,
        mobile: mobile?.trim() || null,
        whatsapp: whatsapp?.trim() || null,
        blocks: blocks ? parseInt(blocks) : null,
        flats: flats ? parseInt(flats) : null
      },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    // TODO: Send admin invite email
    // This would typically involve:
    // 1. Generating a secure token for the admin
    // 2. Sending an email with a link to set password
    // 3. Creating a pending admin user record
    
    console.log(`Admin invite email should be sent to: ${adminEmail} for society: ${name}`);

    return NextResponse.json({
      success: true,
      society,
      message: 'Society created successfully'
    });
  } catch (error) {
    console.error('Error creating society:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
