import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  try {
    // Test Cloudinary configuration
    const result = await cloudinary.api.ping();
    
    return NextResponse.json({
      success: true,
      message: 'Cloudinary configuration is working',
      cloudinary: result,
      config: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
        api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set',
      }
    });
  } catch (error) {
    console.error('Cloudinary test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Cloudinary configuration failed',
        config: {
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
          api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set',
        }
      },
      { status: 500 }
    );
  }
}
