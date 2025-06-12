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

function isValidId(id: any): boolean {
  return (typeof id === 'number' && Number.isInteger(id) && id > 0) || 
         (typeof id === 'string' && /^\d+$/.test(id) && parseInt(id) > 0)
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) })
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  
  try {
    // Verify authentication
    const authHeader = request.headers.get('cookie')
    const token = authHeader?.split('auth_token=')[1]?.split(';')[0]
    
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: buildCorsHeaders(origin) }
      )
    }

    const verified = await verifyToken(token) as any
    
    if (!verified || verified.user_type !== 'applicant') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - Applicant access required' }),
        { status: 401, headers: buildCorsHeaders(origin) }
      )
    }

    const applicantId = verified.id
    
    if (!applicantId || !isValidId(applicantId)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid user ID format' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    const body = await request.json()
    const { meetingId, cancellationReason } = body as any

    if (!meetingId || !isValidId(meetingId)) {
      return new NextResponse(
        JSON.stringify({ error: 'Valid meeting ID is required' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    // Fetch the meeting to verify ownership and status
    const { data: meeting, error: fetchError } = await supabase
      .from('meeting_bookings')
      .select(`
        *,
        expert:users!expert_id(first_name, last_name, email)
      `)
      .eq('id', meetingId)
      .eq('applicant_id', applicantId)
      .single()

    if (fetchError || !meeting) {
      return new NextResponse(
        JSON.stringify({ error: 'Meeting not found or you do not have permission to cancel it' }),
        { status: 404, headers: buildCorsHeaders(origin) }
      )
    }

    if (meeting.status !== 'scheduled') {
      return new NextResponse(
        JSON.stringify({ error: `Cannot cancel a meeting that is ${meeting.status}` }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    // Check if meeting is in the past
    const meetingDateTime = new Date(`${meeting.meeting_date}T${meeting.start_time}`)
    if (meetingDateTime <= new Date()) {
      return new NextResponse(
        JSON.stringify({ error: 'Cannot cancel a meeting that has already started or passed' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    // Update the meeting status
    const updateData = {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: applicantId,
      cancellation_reason: cancellationReason || 'Cancelled by applicant',
      updated_at: new Date().toISOString()
    }

    const { data: updatedMeeting, error: updateError } = await supabase
      .from('meeting_bookings')
      .update(updateData)
      .eq('id', meetingId)
      .eq('applicant_id', applicantId)
      .select(`
        *,
        expert:users!expert_id(first_name, last_name, email)
      `)
      .single()

    if (updateError) {
      console.error('Error cancelling meeting:', updateError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to cancel meeting' }),
        { status: 500, headers: buildCorsHeaders(origin) }
      )
    }

    return new NextResponse(
      JSON.stringify({
        success: true,
        meeting: updatedMeeting,
        message: 'Meeting cancelled successfully. The expert has been notified.'
      }),
      { status: 200, headers: buildCorsHeaders(origin) }
    )
  } catch (error: any) {
    console.error('Cancel meeting error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: buildCorsHeaders(origin) }
    )
  }
}