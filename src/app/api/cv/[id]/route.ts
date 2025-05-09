/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/cv/[id]/route.ts
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

// Dynamic API routes params must be awaited per Next.js
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const origin = request.headers.get('origin') || '*'

  try {
    // Await dynamic params
    const { id } = await context.params
    if (!id) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing CV ID' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    const cvId = Number(id)
    if (isNaN(cvId)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid CV ID' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    // Fetch CV record
    const { data: cv, error: cvErr } = await supabase
      .from('cvs')
      .select('id, file_name, file_path, status, created_at')
      .eq('id', cvId)
      .single()

    if (cvErr || !cv) {
      console.error('CV fetch error:', cvErr)
      return new NextResponse(
        JSON.stringify({ error: 'CV not found' }),
        { status: 404, headers: buildCorsHeaders(origin) }
      )
    }

    // Fetch related reviews
    const { data: reviewsRaw, error: revErr } = await supabase
      .from('reviews')
      .select('id, content, created_at, expert:users(first_name, last_name)')
      .eq('cv_id', cvId)
      .order('created_at', { ascending: false })

    if (revErr) {
      console.error('Reviews fetch error:', revErr)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch reviews' }),
        { status: 500, headers: buildCorsHeaders(origin) }
      )
    }

    // Map reviews to desired shape, handling nested expert users
    const reviews = (reviewsRaw || []).map(r => {
      // Normalize expert relationship (could be array or single object)
      const reviewer = Array.isArray(r.expert) ? r.expert[0] : r.expert;
      return {
        id: r.id,
        content: r.content,
        created_at: r.created_at,
        first_name: reviewer?.first_name,
        last_name: reviewer?.last_name,
      };
    });

    // Fetch responses for these reviews
    const reviewIds = reviews.map(r => r.id)
    let responses: any[] = []

    if (reviewIds.length) {
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
      JSON.stringify({ success: true, cv, reviews, responses }),
      { status: 200, headers: buildCorsHeaders(origin) }
    )
  } catch (error) {
    console.error('CV detail route error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to get CV details' }),
      { status: 500, headers: buildCorsHeaders(request.headers.get('origin') || '*') }
    )
  }
}
