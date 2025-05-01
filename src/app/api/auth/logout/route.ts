import { cookies } from 'next/headers';
import {NextResponse } from 'next/server';

export async function GET() {
  try {
    // Clear auth cookie
     const cookieStore = await cookies();
    cookieStore.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0, // Expire immediately
      path: '/',
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
