import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// GET /api/admin/societies - Get all societies
export async function GET(request: NextRequest) {
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
    // Verify admin authentication using cookies
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'No authentication token' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // Parse form data for file upload
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const address = formData.get('address') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const pincode = formData.get('pincode') as string;
    const mobile = formData.get('mobile') as string;
    const blocks = formData.get('blocks') as string;
    const totalFlats = formData.get('totalFlats') as string;
    const adminEmail = formData.get('adminEmail') as string;
    const logoFile = formData.get('logo') as File;

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

    if (!address || address.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Address is required' },
        { status: 400 }
      );
    }

    if (!city || city.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'City is required' },
        { status: 400 }
      );
    }

    if (!state || state.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'State is required' },
        { status: 400 }
      );
    }

    if (!pincode || pincode.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Pincode is required' },
        { status: 400 }
      );
    }

    if (!mobile || mobile.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Mobile number is required' },
        { status: 400 }
      );
    }

    if (!logoFile || logoFile.size === 0) {
      return NextResponse.json(
        { success: false, message: 'Society logo is required' },
        { status: 400 }
      );
    }

    // Check if admin email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail.trim() }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Handle logo file upload
    let logoPath = null;
    if (logoFile && logoFile.size > 0) {
      const bytes = await logoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'societies');
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Generate unique filename
      const fileExtension = logoFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
      logoPath = `/uploads/societies/${fileName}`;
      
      // Save file
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, buffer);
    }

    // Generate a setup token for the society admin
    const setupToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    // Create society
    const society = await prisma.society.create({
      data: {
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        mobile: mobile.trim(),
        blocks: blocks ? parseInt(blocks) : null,
        flats: totalFlats ? parseInt(totalFlats) : null,
        logo: logoPath
      }
    });

    // Create society admin user with setup token
    await prisma.user.create({
      data: {
        email: adminEmail.trim(),
        phone: mobile?.trim() || null,
        password: null, // No password set initially
        role: 'SOCIETY_ADMIN',
        status: 'ACTIVE',
        firstName: 'Society',
        lastName: 'Admin',
        isEmailVerified: false,
        societyId: society.id,
        setupToken: setupToken,
        setupTokenExpiry: tokenExpiry
      }
    });

    // Send welcome email with password setup link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const setupLink = `${frontendUrl}/setup-password?token=${setupToken}`;
    
    const emailSent = await sendWelcomeEmail(
      adminEmail.trim(),
      'Society Admin',
      undefined,
      setupLink
    );

    if (!emailSent) {
      console.error('Failed to send welcome email to:', adminEmail);
      // Don't fail the request, just log the error
    }

    // Get society with user count
    const societyWithCount = await prisma.society.findUnique({
      where: { id: society.id },
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
      society: societyWithCount,
      message: 'Society created successfully and admin invite email sent'
    });
  } catch (error) {
    console.error('Error creating society:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
