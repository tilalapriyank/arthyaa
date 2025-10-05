import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const societyId = searchParams.get('societyId');

    let society;

     if (societyId) {
       // Get specific society details with society admin email
       const societyWithAdmin = await prisma.society.findUnique({
         where: { id: societyId },
         select: {
           id: true,
           name: true,
           address: true,
           city: true,
           state: true,
           pincode: true,
           mobile: true,
           blocks: true,
           flats: true,
           logo: true,
           createdAt: true,
           updatedAt: true,
           users: {
             where: { role: 'SOCIETY_ADMIN' },
             select: {
               email: true,
               firstName: true,
               lastName: true
             }
           }
         }
       });

       if (!societyWithAdmin) {
         return NextResponse.json({ success: false, message: 'Society not found' }, { status: 404 });
       }

       // Extract society admin email (users are already filtered by role in the query)
       const societyAdmin = societyWithAdmin.users[0]; // First user is the society admin
       society = {
         ...societyWithAdmin,
         adminEmail: societyAdmin?.email || null,
         adminName: societyAdmin ? `${societyAdmin.firstName || ''} ${societyAdmin.lastName || ''}`.trim() : null
       };
    } else {
       // For SOCIETY_ADMIN, get their society details with admin email
       if (decoded.role === 'SOCIETY_ADMIN') {
         const userWithSociety = await prisma.user.findUnique({
           where: { id: decoded.id },
           include: {
             society: {
               select: {
                 id: true,
                 name: true,
                 address: true,
                 city: true,
                 state: true,
                 pincode: true,
                 mobile: true,
                 blocks: true,
                 flats: true,
                 logo: true,
                 createdAt: true,
                 updatedAt: true,
                 users: {
                   where: { role: 'SOCIETY_ADMIN' },
                   select: {
                     email: true,
                     firstName: true,
                     lastName: true
                   }
                 }
               }
             }
           }
         });

         if (!userWithSociety?.society) {
           return NextResponse.json({ success: false, message: 'Society not found for user' }, { status: 404 });
         }

         // Extract society admin email (users are already filtered by role in the query)
         const societyAdmin = userWithSociety.society.users[0]; // First user is the society admin
         society = {
           ...userWithSociety.society,
           adminEmail: societyAdmin?.email || null,
           adminName: societyAdmin ? `${societyAdmin.firstName || ''} ${societyAdmin.lastName || ''}`.trim() : null
         };
      } else {
        return NextResponse.json({ success: false, message: 'Society ID is required for admin users' }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: true,
      society
    });

  } catch (error) {
    console.error('Error fetching society details:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const societyId = searchParams.get('societyId');

    const body = await request.json();
    const { name, address, city, state, pincode, mobile } = body;

    // Validate required fields
    if (!name || !address || !city || !state || !pincode) {
      return NextResponse.json({ 
        success: false, 
        message: 'Name, address, city, state, and pincode are required' 
      }, { status: 400 });
    }

    let targetSocietyId = societyId || undefined;

    // If no societyId provided, get the user's society
    if (!societyId && decoded.role === 'SOCIETY_ADMIN') {
      const userWithSociety = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          society: {
            select: { id: true }
          }
        }
      });

      if (!userWithSociety?.society) {
        return NextResponse.json({ success: false, message: 'Society not found for user' }, { status: 404 });
      }

      targetSocietyId = userWithSociety.society.id;
    } else if (!societyId && decoded.role === 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Society ID is required for admin users' }, { status: 400 });
    }

    // Update society
    const updatedSociety = await prisma.society.update({
      where: { id: targetSocietyId },
      data: {
        name,
        address,
        city,
        state,
        pincode,
        mobile: mobile || undefined,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        mobile: true,
        blocks: true,
        flats: true,
        logo: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Society updated successfully',
      society: updatedSociety
    });

  } catch (error) {
    console.error('Error updating society:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
