import { NextResponse } from 'next/server';
import { createAdminUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName } = await request.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    const result = await createAdminUser(email, password, firstName, lastName);

    if (result.success) {
      return NextResponse.json(result);
    }

    return NextResponse.json(result, { status: 400 });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
