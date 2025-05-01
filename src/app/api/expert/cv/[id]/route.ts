/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/expert/cv/[id]/route.ts
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const origin = request.headers.get('origin') || '*'
  try {
    // Await dynamic params
    const { id } = await context.params
    const cvId = parseInt(id, 10)
    if (isNaN(cvId)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid CV ID' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    // Fetch CV with applicant info
    const { data: cv, error: cvErr } = await supabase
      .from('cvs')
      .select(
        'id, file_name, file_path, status, created_at, user_id, users(first_name, last_name, email)'
      )
      .eq('id', cvId)
      .single()

    if (cvErr || !cv) {
      console.error('CV fetch error:', cvErr)
      return new NextResponse(
        JSON.stringify({ error: 'CV not found' }),
        { status: 404, headers: buildCorsHeaders(origin) }
      )
    }

    // Map CV shape
    const cvDetail = {
      id: cv.id,
      file_name: cv.file_name,
      file_path: cv.file_path,
      status: cv.status,
      created_at: cv.created_at,
      first_name: cv.users.first_name,
      last_name: cv.users.last_name,
      email: cv.users.email,
    }

    // Fetch existing reviews by this expert on this CV
    const { data: reviewsRaw, error: revErr } = await supabase
      .from('reviews')
      .select('id, content, created_at, users(first_name, last_name)')
      .eq('cv_id', cvId)
      .eq('expert_id', cv.user_id)
      .order('created_at', { ascending: false })

    if (revErr) {
      console.error('Reviews fetch error:', revErr)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch reviews' }),
        { status: 500, headers: buildCorsHeaders(origin) }
      )
    }

    const reviews = (reviewsRaw || []).map(r => {
      const reviewer = Array.isArray(r.users) ? r.users[0] : r.users
      return {
        id: r.id,
        content: r.content,
        created_at: r.created_at,
        first_name: reviewer.first_name,
        last_name: reviewer.last_name,
      }
    })

    // Fetch responses to those reviews
    const reviewIds = reviews.map(r => r.id)
    let responses: any[] = []
    if (reviewIds.length > 0) {
      const { data: respRaw, error: respErr } = await supabase
        .from('responses')
        .select('id, review_id, content, created_at')
        .in('review_id', reviewIds)
        .order('created_at', { ascending: true })

      if (respErr) {
        console.error('Responses fetch error:', respErr)
        return new NextResponse(
          JSON.stringify({ error: 'Failed to fetch responses' }),
          { status: 500, headers: buildCorsHeaders(origin) }
        )
      }
      responses = respRaw || []
    }

    return new NextResponse(
      JSON.stringify({ success: true, cv: cvDetail, reviews, responses }),
      { status: 200, headers: buildCorsHeaders(origin) }
    )
  } catch (error) {
    console.error('Expert CV detail route error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to get CV details' }),
      { status: 500, headers: buildCorsHeaders(request.headers.get('origin') || '*') }
    )
  }
}
