/* eslint-disable @typescript-eslint/no-explicit-any */
// /app/api/expert/availability/preferences/route.ts
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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Cookie',
    'Access-Control-Allow-Credentials': 'true',
  }
}

// Helper function to validate ID format (now accepts integers)
function isValidId(id: any): boolean {
  return (typeof id === 'number' && Number.isInteger(id) && id > 0) || 
         (typeof id === 'string' && /^\d+$/.test(id) && parseInt(id) > 0)
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) })
}

// GET - Fetch expert's availability preferences
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  
  try {
    const authHeader = request.headers.get('cookie')
    const token = authHeader?.split('auth_token=')[1]?.split(';')[0]
    
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: buildCorsHeaders(origin) }
      )
    }

    const verified = await verifyToken(token) as any
    
    if (!verified || verified.user_type !== 'expert') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: buildCorsHeaders(origin) }
      )
    }

    // Debug: Log the verified user data
    console.log('Verified user data for preferences GET:', JSON.stringify(verified, null, 2))

    const expertId = verified.id
    
    // Validate ID format
    if (!expertId || !isValidId(expertId)) {
      console.error('Invalid expert ID format:', expertId)
      return new NextResponse(
        JSON.stringify({ error: 'Invalid user ID format' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    const { data: preferences, error } = await supabase
      .from('expert_availability_preferences')
      .select('*')
      .eq('expert_id', expertId)
      .eq('is_active', true)
      .order('day_of_week')

    if (error) {
      console.error('Error fetching preferences:', error)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch preferences' }),
        { status: 500, headers: buildCorsHeaders(origin) }
      )
    }

    return new NextResponse(
      JSON.stringify({ success: true, preferences: preferences || [] }),
      { status: 200, headers: buildCorsHeaders(origin) }
    )
  } catch (error) {
    console.error('Preferences GET error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: buildCorsHeaders(origin) }
    )
  }
}

// POST - Create new availability preference
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  
  try {
    const authHeader = request.headers.get('cookie')
    const token = authHeader?.split('auth_token=')[1]?.split(';')[0]
    const verified = await verifyToken(token!) as any
    
    if (!verified || verified.user_type !== 'expert') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: buildCorsHeaders(origin) }
      )
    }

    // Debug: Log the verified user data
    console.log('Verified user data for preferences POST:', JSON.stringify(verified, null, 2))

    const expertId = verified.id
    
    // Validate ID format
    if (!expertId || !isValidId(expertId)) {
      console.error('Invalid expert ID format:', expertId)
      console.error('Available fields in verified token:', Object.keys(verified))
      return new NextResponse(
        JSON.stringify({ 
          error: 'Invalid user ID format', 
          debug: {
            providedId: expertId,
            availableFields: Object.keys(verified),
            tokenData: verified
          }
        }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    const body = await request.json()
    const { 
      dayOfWeek, 
      startTime, 
      endTime, 
      timezone = 'UTC', 
      slotDuration = 60, 
      bufferTime = 15 
    } = body as any

    // Validate required fields
    if (dayOfWeek === undefined || !startTime || !endTime) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    // Validate day of week
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return new NextResponse(
        JSON.stringify({ error: 'Day of week must be between 0 and 6' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    const preferenceData = {
      expert_id: expertId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      timezone,
      slot_duration: slotDuration,
      buffer_time: bufferTime,
      is_active: true
    }

    console.log('Preference data to insert:', JSON.stringify(preferenceData, null, 2))

    const { data, error } = await supabase
      .from('expert_availability_preferences')
      .insert(preferenceData)
      .select()
      .single()

    if (error) {
      console.error('Error creating preference:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      
      if (error.code === '23505') { // Unique constraint violation
        return new NextResponse(
          JSON.stringify({ error: 'Preference for this day already exists' }),
          { status: 409, headers: buildCorsHeaders(origin) }
        )
      }
      
      if (error.code === '22P02') { // Invalid input syntax for type
        return new NextResponse(
          JSON.stringify({ 
            error: 'Invalid ID format', 
            debug: { expertId, errorCode: error.code }
          }),
          { status: 400, headers: buildCorsHeaders(origin) }
        )
      }
      
      return new NextResponse(
        JSON.stringify({ error: 'Failed to create preference' }),
        { status: 500, headers: buildCorsHeaders(origin) }
      )
    }

    return new NextResponse(
      JSON.stringify({ success: true, preference: data }),
      { status: 201, headers: buildCorsHeaders(origin) }
    )
  } catch (error) {
    console.error('Preferences POST error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: buildCorsHeaders(origin) }
    )
  }
}

// PUT - Update existing preference
export async function PUT(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  
  try {
    const authHeader = request.headers.get('cookie')
    const token = authHeader?.split('auth_token=')[1]?.split(';')[0]
    const verified = await verifyToken(token!) as any
    
    if (!verified || verified.user_type !== 'expert') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: buildCorsHeaders(origin) }
      )
    }

    const expertId = verified.id
    
    // Validate ID format
    if (!expertId || !isValidId(expertId)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid user ID format' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    const body = await request.json()
    const { id, ...updateData } = body as { id: number; [key: string]: any }

    if (!id) {
      return new NextResponse(
        JSON.stringify({ error: 'Preference ID is required' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    const { data, error } = await supabase
      .from('expert_availability_preferences')
      .update(updateData)
      .eq('id', id)
      .eq('expert_id', expertId)
      .select()
      .single()

    if (error) {
      console.error('Error updating preference:', error)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to update preference' }),
        { status: 500, headers: buildCorsHeaders(origin) }
      )
    }

    if (!data) {
      return new NextResponse(
        JSON.stringify({ error: 'Preference not found' }),
        { status: 404, headers: buildCorsHeaders(origin) }
      )
    }

    return new NextResponse(
      JSON.stringify({ success: true, preference: data }),
      { status: 200, headers: buildCorsHeaders(origin) }
    )
  } catch (error) {
    console.error('Preferences PUT error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: buildCorsHeaders(origin) }
    )
  }
}

// DELETE - Remove preference
export async function DELETE(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  
  try {
    const authHeader = request.headers.get('cookie')
    const token = authHeader?.split('auth_token=')[1]?.split(';')[0]
    const verified = await verifyToken(token!) as any
    
    if (!verified || verified.user_type !== 'expert') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: buildCorsHeaders(origin) }
      )
    }

    const expertId = verified.id
    
    // Validate ID format
    if (!expertId || !isValidId(expertId)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid user ID format' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    const { searchParams } = new URL(request.url)
    const preferenceId = searchParams.get('id')

    if (!preferenceId) {
      return new NextResponse(
        JSON.stringify({ error: 'Preference ID is required' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    const { error } = await supabase
      .from('expert_availability_preferences')
      .delete()
      .eq('id', preferenceId)
      .eq('expert_id', expertId)

    if (error) {
      console.error('Error deleting preference:', error)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to delete preference' }),
        { status: 500, headers: buildCorsHeaders(origin) }
      )
    }

    return new NextResponse(
      JSON.stringify({ success: true, message: 'Preference deleted successfully' }),
      { status: 200, headers: buildCorsHeaders(origin) }
    )
  } catch (error) {
    console.error('Preferences DELETE error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: buildCorsHeaders(origin) }
    )
  }
}