/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/expert/pending-cvs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// CORS helper
function buildCorsHeaders(origin: string) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  try {
    // Fetch all pending CVs with applicant info
    const { data: rawCVs, error } = await supabase
      .from('cvs')
      .select(
        `id, file_name, file_path, status, created_at, users (` +
        `first_name, last_name, email` +
        `)`
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase pending CVs error:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch pending CVs' }),
        { status: 500, headers: buildCorsHeaders(origin) }
      );
    }

    // Map to desired shape
    const cvs = (rawCVs || []).map((c: any) => ({
      id: c.id,
      file_name: c.file_name,
      file_path: c.file_path,
      status: c.status,
      created_at: c.created_at,
      user_id: c.users?.id,
      applicant_name: `${c.users.first_name} ${c.users.last_name}`,
      applicant_email: c.users.email,
    }));

    return new NextResponse(
      JSON.stringify({ success: true, cvs }),
      { status: 200, headers: buildCorsHeaders(origin) }
    );
  } catch (err) {
    console.error('Pending CVs route error:', err);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: buildCorsHeaders(request.headers.get('origin') || '*') }
    );
  }
}
