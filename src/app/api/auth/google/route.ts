/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// /src/app/api/auth/google/route.ts
// Initiate Google OAuth2 flow

import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/google-oauth';

export async function GET(request: NextRequest) {
  try {
    const authUrl = getGoogleAuthUrl();
    
    // Redirect user to Google OAuth consent screen
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('Error initiating Google OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google authentication' },
      { status: 500 }
    );
  }
}


