/* eslint-disable @typescript-eslint/no-explicit-any */
// /src/app/api/auth/google/callback/route.ts
// Handle OAuth2 callback and store tokens

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTokensFromCode } from '@/lib/google-oauth';
import { verifyToken } from '@/lib/auth/utils';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/expert/settings?error=oauth_denied`);
    }

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/expert/settings?error=no_code`);
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);
    
    // Get current user from cookies
    const cookieHeader = request.headers.get('cookie');
    const authToken = cookieHeader?.split('auth_token=')[1]?.split(';')[0];
    
    if (!authToken) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/login?error=not_authenticated`);
    }

    const verified = await verifyToken(authToken) as any;
    
    if (!verified) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/login?error=invalid_token`);
    }

    // Only allow expert users to connect Google OAuth
    if (verified.user_type !== 'expert') {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/expert/settings?error=expert_access_required`);
    }

    // Store tokens in database
    await supabase
      .from('user_google_tokens')
      .upsert({
        user_id: verified.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type,
        expires_at: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: tokens.scope,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    console.log('Google tokens stored successfully for expert:', verified.id);

    // Redirect back to expert settings with success
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/expert/settings?google_connected=true`);

  } catch (error: any) {
    console.error('Error in Google OAuth callback:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/expert/settings?error=oauth_failed`);
  }
}