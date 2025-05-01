/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/cv/list/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// CORS helper
function buildCorsHeaders(origin: string) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) })
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing userId parameter' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    // Fetch CVs and associated reviews
    const { data: rawCVs, error } = await supabase
      .from('cvs')
      .select('id, file_name, file_path, status, created_at, reviews(id)')
      .eq('user_id', Number(userId))
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase fetch error:', error)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch CVs' }),
        { status: 500, headers: buildCorsHeaders(origin) }
      )
    }

    // Map to include review_count
    const cvs = (rawCVs || []).map((c: any) => ({
      id: c.id,
      file_name: c.file_name,
      file_path: c.file_path,
      status: c.status,
      created_at: c.created_at,
      review_count: Array.isArray(c.reviews) ? c.reviews.length : 0,
    }))

    return new NextResponse(
      JSON.stringify({ success: true, cvs }),
      { status: 200, headers: buildCorsHeaders(origin) }
    )
  } catch (err) {
    console.error('List route error:', err)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: buildCorsHeaders(request.headers.get('origin') || '*') }
    )
  }
}
