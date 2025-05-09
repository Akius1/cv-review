// src/app/api/review/respond/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// CORS helper (if needed)
function buildCorsHeaders(origin: string) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) })
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  try {
    const { reviewId, content, userId } = (await request.json()) as {
      reviewId: number | string
      content: string
      userId: number | string
    }
    // Validate input
    if (!reviewId || !content?.trim() || !userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }
    const revId = Number(reviewId)
    const usrId = Number(userId)
    if (isNaN(revId) || isNaN(usrId)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid IDs provided' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    // Authorization: ensure the CV belongs to this user
    const { data: reviewRow, error: reviewErr } = await supabase
      .from('reviews')
      .select('cv_id')
      .eq('id', revId)
      .single()
    if (reviewErr || !reviewRow) {
      return new NextResponse(
        JSON.stringify({ error: 'Review not found' }),
        { status: 404, headers: buildCorsHeaders(origin) }
      )
    }
    const cvId = reviewRow.cv_id

    const { data: cvRow, error: cvErr } = await supabase
      .from('cvs')
      .select('user_id')
      .eq('id', cvId)
      .single()
    if (cvErr || !cvRow || cvRow.user_id !== usrId) {
      return new NextResponse(
        JSON.stringify({ error: 'Not authorized to respond to this review' }),
        { status: 403, headers: buildCorsHeaders(origin) }
      )
    }

    // Insert response
    const { data: inserted, error: insertErr } = await supabase
      .from('responses')
      .insert({ review_id: revId, content: content.trim() })
      .select('id, review_id, content, created_at')
      .single()

    if (insertErr || !inserted) {
      console.error('Insert response error:', insertErr)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to submit response' }),
        { status: 500, headers: buildCorsHeaders(origin) }
      )
    }

    return new NextResponse(
      JSON.stringify({ success: true, response: inserted }),
      { status: 200, headers: buildCorsHeaders(origin) }
    )
  } catch (error) {
    console.error('Response submission error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: buildCorsHeaders(request.headers.get('origin') || '*') }
    )
  }
}
