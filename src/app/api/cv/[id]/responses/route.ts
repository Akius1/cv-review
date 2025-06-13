// 3. Create /api/cv/[id]/responses/route.ts for alternative response fetching

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cvId = params.id

    // First get all reviews for this CV
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('id')
      .eq('cv_id', cvId)

    if (reviewsError || !reviews) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch reviews' },
        { status: 500 }
      )
    }

    // Get all responses for these reviews
    const reviewIds = reviews.map(review => review.id)
    let responses: any[] = []

    if (reviewIds.length > 0) {
      const { data: responsesData, error: responsesError } = await supabase
        .from('responses')
        .select('*')
        .in('review_id', reviewIds)
        .order('created_at', { ascending: true })

      if (responsesError) {
        console.error('Error fetching responses:', responsesError)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch responses' },
          { status: 500 }
        )
      }

      responses = responsesData || []
    }

    return NextResponse.json({
      success: true,
      responses,
    })

  } catch (error) {
    console.error('CV Responses API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}