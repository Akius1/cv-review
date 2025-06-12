/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// /src/app/api/admin/google-status/route.ts
// Check if Google OAuth is connected

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/auth/utils';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const cookieHeader = request.headers.get('cookie');
    const authToken = cookieHeader?.split('auth_token=')[1]?.split(';')[0];
    
    if (!authToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const verified = await verifyToken(authToken) as any;
    
    if (!verified) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }

    // Allow expert users to check Google status (since they'll be connecting their accounts)
    if (verified.user_type !== 'expert') {
      return NextResponse.json({ error: 'Expert access required' }, { status: 403 });
    }

    // Check if ANY expert user has Google tokens (for system-wide Google Meet functionality)
    const { data: systemTokens, error: systemError } = await supabase
      .from('user_google_tokens')
      .select(`
        access_token, 
        expires_at,
        users!user_id(user_type)
      `)
      .eq('users.user_type', 'expert')
      .not('access_token', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    // Also check if THIS specific user has tokens
    const { data: userTokens, error: userError } = await supabase
      .from('user_google_tokens')
      .select('access_token, expires_at')
      .eq('user_id', verified.id)
      .single();

    const hasSystemTokens = !!(systemTokens && systemTokens.access_token);
    const hasUserTokens = !!(userTokens && userTokens.access_token);
    
    // Check if any tokens are expired
    const systemExpired = systemTokens?.expires_at ? new Date(systemTokens.expires_at) < new Date() : false;
    const userExpired = userTokens?.expires_at ? new Date(userTokens.expires_at) < new Date() : false;

    // System is considered "connected" if ANY admin/expert has valid tokens
    const systemConnected = hasSystemTokens && !systemExpired;
    const userConnected = hasUserTokens && !userExpired;

    return NextResponse.json({
      connected: systemConnected || userConnected,
      expired: (hasSystemTokens && systemExpired) || (hasUserTokens && userExpired),
      needs_reauth: (hasSystemTokens && systemExpired) || (hasUserTokens && userExpired),
      user_connected: userConnected,
      system_connected: systemConnected,
      details: {
        system_has_tokens: hasSystemTokens,
        user_has_tokens: hasUserTokens,
        system_expired: systemExpired,
        user_expired: userExpired
      }
    });

  } catch (error: any) {
    console.error('Error checking Google status:', error);
    return NextResponse.json({ error: 'Failed to check Google status' }, { status: 500 });
  }
}