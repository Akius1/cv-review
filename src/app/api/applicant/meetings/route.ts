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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  
  try {
    console.log('=== Meetings API Debug ===')
    
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
    
    if (!verified || verified.user_type !== 'applicant') {
      console.log('Invalid token or not applicant')
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - Applicant access required' }),
        { status: 401, headers: buildCorsHeaders(origin) }
      )
    }

    const applicantId = verified.id
    console.log('Applicant ID:', applicantId)
    
    if (!applicantId || !isValidId(applicantId)) {
      console.log('Invalid applicant ID')
      return new NextResponse(
        JSON.stringify({ error: 'Invalid user ID format' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('Query params:', { status, limit, offset })

    // Build query - FIXED: Only select columns that exist in users table
    let query = supabase
      .from('meeting_bookings')
      .select(`
        *,
        expert:users!expert_id(
          id, first_name, last_name, email, user_type
        ),
        availability:expert_availability!availability_id(
          id, date, start_time, end_time, timezone
        )
      `)
      .eq('applicant_id', applicantId)
      .order('meeting_date', { ascending: false })
      .order('start_time', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by status if specified
    if (status && ['scheduled', 'completed', 'cancelled', 'rescheduled'].includes(status)) {
      query = query.eq('status', status)
    }

    console.log('Executing query...')
    const { data: meetings, error } = await query

    if (error) {
      console.error('Supabase query error:', error)
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to fetch meetings',
          details: error.message,
          code: error.code 
        }),
        { status: 500, headers: buildCorsHeaders(origin) }
      )
    }

    console.log('Query result:', {
      count: meetings?.length || 0,
      sample: meetings?.[0] || 'No meetings'
    })

    // Process meetings to add computed fields
    const processedMeetings = (meetings || []).map(meeting => ({
      ...meeting,
      expert_name: meeting.expert 
        ? `${meeting.expert.first_name || ''} ${meeting.expert.last_name || ''}`.trim() 
        : 'Unknown Expert',
      expert_email: meeting.expert?.email,
      is_upcoming: new Date(`${meeting.meeting_date}T${meeting.start_time}`) > new Date(),
      is_today: meeting.meeting_date === new Date().toISOString().split('T')[0]
    }))

    console.log('Processed meetings:', processedMeetings.length)

    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        meetings: processedMeetings,
        total: processedMeetings.length,
        has_more: processedMeetings.length === limit
      }),
      { status: 200, headers: buildCorsHeaders(origin) }
    )
  } catch (error: any) {
    console.error('Meetings GET error:', error)
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