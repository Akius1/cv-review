// 2. Create /api/responses/route.ts for fetching responses by review ID

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reviewId = searchParams.get('reviewId')

    if (!reviewId) {
      return NextResponse.json(
        { success: false, error: 'Review ID is required' },
        { status: 400 }
      )
    }

    const { data: responses, error } = await supabase
      .from('responses')
      .select('*')
      .eq('review_id', reviewId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching responses:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch responses' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      responses: responses || [],
    })

  } catch (error) {
    console.error('Responses API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

