// 1. Update your existing /api/expert/cv/[id]/route.ts to include responses

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

    // Fetch CV details with applicant info
    const { data: cvData, error: cvError } = await supabase
      .from('cvs')
      .select(`
        *,
        users!cvs_user_id_fkey(first_name, last_name, email)
      `)
      .eq('id', cvId)
      .single()

    if (cvError || !cvData) {
      return NextResponse.json(
        { success: false, error: 'CV not found' },
        { status: 404 }
      )
    }

    // Fetch reviews for this CV with expert info
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        *,
        users!reviews_expert_id_fkey(first_name, last_name, email)
      `)
      .eq('cv_id', cvId)
      .order('created_at', { ascending: false })

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch reviews' },
        { status: 500 }
      )
    }

    // Fetch responses for all reviews
    const reviewIds = (reviewsData || []).map(review => review.id)
    let responsesData: any[] = []

    if (reviewIds.length > 0) {
      const { data: fetchedResponses, error: responsesError } = await supabase
        .from('responses')
        .select('*')
        .in('review_id', reviewIds)
        .order('created_at', { ascending: true })

      if (responsesError) {
        console.error('Error fetching responses:', responsesError)
      } else {
        responsesData = fetchedResponses || []
      }
    }

    // Format the data
    const formattedCV = {
      ...cvData,
      first_name: cvData.users?.first_name,
      last_name: cvData.users?.last_name,
      email: cvData.users?.email,
    }

    const formattedReviews = (reviewsData || []).map((review: any) => ({
      ...review,
      first_name: review.users?.first_name,
      last_name: review.users?.last_name,
      expert_email: review.users?.email,
    }))

    return NextResponse.json({
      success: true,
      cv: formattedCV,
      reviews: formattedReviews,
      responses: responsesData,
    })

  } catch (error) {
    console.error('Expert CV API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

