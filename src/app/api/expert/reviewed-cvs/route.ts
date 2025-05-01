/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/expert/reviewed-cvs/route.ts
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
    const expertId = request.nextUrl.searchParams.get('expertId')
    if (!expertId) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing expertId parameter' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    // Fetch reviews with nested CV and applicant info, including review content
    const { data: reviewsData, error } = await supabase
      .from('reviews')
      .select(
        `content, created_at, cvs!inner(
          id,
          file_name,
          file_path,
          status,
          created_at,
          user_id,
          users(first_name, last_name, email)
        )`
      )
      .eq('expert_id', Number(expertId))
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase reviewed CVs error:', error)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch reviewed CVs' }),
        { status: 500, headers: buildCorsHeaders(origin) }
      )
    }

    // Map to desired shape, including review content
    const cvs = (reviewsData || []).map((r: any) => ({
      id: r.cvs.id,
      file_name: r.cvs.file_name,
      file_path: r.cvs.file_path,
      status: r.cvs.status,
      created_at: r.cvs.created_at,
      user_id: r.cvs.user_id,
      applicant_name: `${r.cvs.users.first_name} ${r.cvs.users.last_name}`,
      applicant_email: r.cvs.users.email,
      reviewed_at: r.created_at,
      review_content: r.content,
    }))

    return new NextResponse(
      JSON.stringify({ success: true, cvs }),
      { status: 200, headers: buildCorsHeaders(origin) }
    )
  } catch (err) {
    console.error('Reviewed CVs route error:', err)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: buildCorsHeaders(request.headers.get('origin') || '*') }
    )
  }
}
