// src/app/api/expert/submit-review/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service_role key
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Parse and validate payload
    const { cvId, expertId, content } = (await request.json()) as {
      cvId: number | string
      expertId: number | string
      content: string
    }

    if (!cvId || !expertId || !content.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update CV status to 'reviewed'
    const { error: cvErr } = await supabase
      .from('cvs')
      .update({ status: 'reviewed' })
      .eq('id', Number(cvId))

    if (cvErr) {
      console.error('CV update error:', cvErr)
      throw cvErr
    }

    // Insert new review and fetch reviewer info
    const { data: inserted, error: revErr } = await supabase
      .from('reviews')
      .insert({
        cv_id: Number(cvId),
        expert_id: Number(expertId),
        content,
      })
      .select('id, content, created_at, users(first_name, last_name)')
      .single()

    if (revErr || !inserted) {
      console.error('Review insert error:', revErr)
      throw revErr
    }

    // Normalize nested users
    const reviewer = Array.isArray(inserted.users)
      ? inserted.users[0]
      : inserted.users

    // Shape response
    const review = {
      id: inserted.id,
      content: inserted.content,
      created_at: inserted.created_at,
      first_name: reviewer.first_name,
      last_name: reviewer.last_name,
    }

    return NextResponse.json({ success: true, review }, { status: 200 })
  } catch (error) {
    console.error('Submit review error:', error)
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    )
  }
}
