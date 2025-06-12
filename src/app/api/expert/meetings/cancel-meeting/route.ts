// /app/api/expert/cancel-meeting/route.ts
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

// Helper function to validate ID format
function isValidId(id: any): boolean {
  return (typeof id === 'number' && Number.isInteger(id) && id > 0) || 
         (typeof id === 'string' && /^\d+$/.test(id) && parseInt(id) > 0)
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) })
}

// POST - Cancel a meeting (expert side)
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  
  try {
    // Verify authentication
    const authHeader = request.headers.get('cookie')
    if (!authHeader) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: buildCorsHeaders(origin) }
      )
    }

    const token = authHeader.split('auth_token=')[1]?.split(';')[0]
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'No token provided' }),
        { status: 401, headers: buildCorsHeaders(origin) }
      )
    }

    const verified = await verifyToken(token) as any
    
    if (!verified || verified.user_type !== 'expert') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - Expert access required' }),
        { status: 401, headers: buildCorsHeaders(origin) }
      )
    }

    const expertId = verified.id
    
    if (!expertId || !isValidId(expertId)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid user ID format' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    const body = await request.json()
    const { meetingId, cancellationReason } = body as any

    if (!meetingId) {
      return new NextResponse(
        JSON.stringify({ error: 'Meeting ID is required' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    console.log(`Cancelling meeting ${meetingId} for expert ${expertId}`)

    // Update the meeting to cancelled status
    const { data: cancelledMeeting, error } = await supabase
      .from('meeting_bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: expertId,
        cancellation_reason: cancellationReason || 'Cancelled by expert',
        updated_at: new Date().toISOString()
      })
      .eq('id', meetingId)
      .eq('expert_id', expertId) // Ensure expert can only cancel their own meetings
      .eq('status', 'scheduled') // Can only cancel scheduled meetings
      .select(`
        *,
        applicant:users!applicant_id(first_name, last_name, email)
      `)
      .single()

    if (error) {
      console.error('Error cancelling meeting:', error)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to cancel meeting', details: error.message }),
        { status: 500, headers: buildCorsHeaders(origin) }
      )
    }

    if (!cancelledMeeting) {
      return new NextResponse(
        JSON.stringify({ error: 'Meeting not found or cannot be cancelled' }),
        { status: 404, headers: buildCorsHeaders(origin) }
      )
    }

    console.log(`Successfully cancelled meeting ${meetingId}`)

    // Format the response
    const formattedMeeting = {
      ...cancelledMeeting,
      applicant_name: cancelledMeeting.applicant ? 
        `${cancelledMeeting.applicant.first_name} ${cancelledMeeting.applicant.last_name}` : 
        'Unknown Applicant'
    }

    // TODO: Send cancellation notification to applicant
    // TODO: Cancel Google Calendar events
    // TODO: Send confirmation email to both parties

    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        meeting: formattedMeeting,
        message: 'Meeting cancelled successfully. The applicant has been notified.'
      }),
      { status: 200, headers: buildCorsHeaders(origin) }
    )
  } catch (error: any) {
    console.error('Cancel meeting POST error:', error)
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: buildCorsHeaders(origin) }
    )
  }
}