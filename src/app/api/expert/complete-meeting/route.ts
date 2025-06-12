/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth/utils'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function buildCorsHeaders(origin: string) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Cookie',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) })
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  
  try {
    console.log('=== Complete Meeting API Debug ===')
    
    // Verify authentication
    const authHeader = request.headers.get('cookie')
    const token = authHeader?.split('auth_token=')[1]?.split(';')[0]
    
    if (!token) {
      console.log('No token found')
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: buildCorsHeaders(origin) }
      )
    }

    const verified = await verifyToken(token) as any
    
    if (!verified || verified.user_type !== 'expert') {
      console.log('Invalid token or not expert')
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - Expert access required' }),
        { status: 401, headers: buildCorsHeaders(origin) }
      )
    }

    const expertId = verified.id
    console.log('Expert ID:', expertId)

    // Parse request body
    const body = await request.json()
    const { meetingId } = body as any

    console.log('Request data:', { meetingId })

    if (!meetingId) {
      return new NextResponse(
        JSON.stringify({ error: 'Meeting ID is required' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    // Verify the meeting belongs to this expert and is scheduled
    const { data: meeting, error: fetchError } = await supabase
      .from('meeting_bookings')
      .select('id, expert_id, status, title, meeting_date, start_time')
      .eq('id', meetingId)
      .eq('expert_id', expertId)
      .single()

    if (fetchError || !meeting) {
      console.error('Meeting fetch error:', fetchError)
      return new NextResponse(
        JSON.stringify({ error: 'Meeting not found or access denied' }),
        { status: 404, headers: buildCorsHeaders(origin) }
      )
    }

    if (meeting.status !== 'scheduled') {
      return new NextResponse(
        JSON.stringify({ error: 'Only scheduled meetings can be marked as completed' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    console.log('Meeting found:', meeting.title, 'Status:', meeting.status)

    // Update the meeting status to completed
    const { data: updatedMeeting, error: updateError } = await supabase
      .from('meeting_bookings')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', meetingId)
      .eq('expert_id', expertId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to mark meeting as completed',
          details: updateError.message 
        }),
        { status: 500, headers: buildCorsHeaders(origin) }
      )
    }

    console.log('Meeting marked as completed successfully')

    return new NextResponse(
      JSON.stringify({ 
        success: true,
        message: 'Meeting marked as completed successfully',
        meeting: updatedMeeting
      }),
      { status: 200, headers: buildCorsHeaders(origin) }
    )

  } catch (error: any) {
    console.error('Complete Meeting API error:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      }),
      { status: 500, headers: buildCorsHeaders(origin) }
    )
  }
}