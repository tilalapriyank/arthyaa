import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';
import { handleFileUpload, validateFile } from '@/lib/upload';
import crypto from 'crypto';

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
    const adminEmail = formData.get('adminEmail') as string;
    const csvDataString = formData.get('csvData') as string;
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

    if (!csvDataString || csvDataString.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'CSV data is required' },
        { status: 400 }
      );
    }

    // Parse CSV data
    let csvData;
    try {
      csvData = JSON.parse(csvDataString);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid CSV data format' },
        { status: 400 }
      );
    }

    if (!Array.isArray(csvData) || csvData.length === 0) {
      return NextResponse.json(
        { success: false, message: 'CSV data must contain at least one record' },
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
      // Validate file
      const validation = validateFile(logoFile, ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], 5);
      if (!validation.isValid) {
        return NextResponse.json(
          { success: false, message: validation.error },
          { status: 400 }
        );
      }
      
      // Upload file
      const uploadResult = await handleFileUpload(logoFile, 'societies');
      if (!uploadResult.success) {
        return NextResponse.json(
          { success: false, message: `File upload failed: ${uploadResult.error}` },
          { status: 500 }
        );
      }
      
      logoPath = uploadResult.filePath;
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
        logo: logoPath
      }
    });

    // Process CSV data to create blocks and flats
    const blockMap = new Map<string, string>(); // block name -> block id
    const uniqueBlocks = new Set<string>();
    
    // Extract unique blocks from CSV data
    csvData.forEach((row: any) => {
      if (row.block && row.block.trim()) {
        uniqueBlocks.add(row.block.trim());
      }
    });

    // Create blocks
    for (const blockName of uniqueBlocks) {
      const block = await prisma.block.create({
        data: {
          name: blockName,
          societyId: society.id
        }
      });
      blockMap.set(blockName, block.id);
    }

    // Create flats
    const flatPromises = csvData.map(async (row: any) => {
      if (row.block && row.flat && row.floor) {
        const blockId = blockMap.get(row.block.trim());
        if (blockId) {
          return prisma.flat.create({
            data: {
              name: row.flat.trim(),
              floorNumber: parseInt(row.floor) || 1,
              blockId: blockId
            }
          });
        }
      }
      return null;
    });

    const flats = await Promise.all(flatPromises);
    const validFlats = flats.filter(flat => flat !== null);

    // Update society with calculated totals
    const totalBlocks = uniqueBlocks.size;
    const totalFlats = validFlats.length;
    
    await prisma.society.update({
      where: { id: society.id },
      data: {
        blocks: totalBlocks,
        flats: totalFlats
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

    // Get society with user count and structure
    const societyWithCount = await prisma.society.findUnique({
      where: { id: society.id },
      include: {
        _count: {
          select: {
            users: true
          }
        },
        blockList: {
          include: {
            flats: true
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
