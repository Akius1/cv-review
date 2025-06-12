/* eslint-disable @typescript-eslint/no-explicit-any */
// /app/api/expert/availability/route.ts
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

// Helper function to calculate date ranges for filters
function getDateRange(period: string, filterDate?: string) {
  const today = new Date()
  let startDate: string
  let endDate: string

  switch (period) {
    case 'day':
      startDate = filterDate || today.toISOString().split('T')[0]
      endDate = startDate
      break
    
    case 'week':
      const baseDate = filterDate ? new Date(filterDate) : today
      // Get the start of the week (Monday)
      const startOfWeek = new Date(baseDate)
      const dayOfWeek = startOfWeek.getDay()
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      startOfWeek.setDate(startOfWeek.getDate() - daysToSubtract)
      
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      
      startDate = startOfWeek.toISOString().split('T')[0]
      endDate = endOfWeek.toISOString().split('T')[0]
      break
    
    case 'month':
      const baseMonth = filterDate ? new Date(filterDate) : today
      const year = baseMonth.getFullYear()
      const month = baseMonth.getMonth()
      
      startDate = new Date(year, month, 1).toISOString().split('T')[0]
      endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]
      break
    
    case 'all':
    default:
      // Get all future availability (from today onwards)
      startDate = today.toISOString().split('T')[0]
      // Set end date to 1 year from now as a reasonable limit
      const oneYearFromNow = new Date(today)
      oneYearFromNow.setFullYear(today.getFullYear() + 1)
      endDate = oneYearFromNow.toISOString().split('T')[0]
      break
  }

  return { startDate, endDate }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) })
}

// GET - Fetch expert's availability with filtering support
export async function GET(request: NextRequest) {
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

    console.log('Verified user data:', JSON.stringify(verified, null, 2))

    const expertId = verified.id
    
    // Validate ID format
    if (!expertId || !isValidId(expertId)) {
      console.error('Invalid expert ID format:', expertId)
      return new NextResponse(
        JSON.stringify({ error: 'Invalid user ID format' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all'
    const filterDate: any = searchParams.get('filterDate')
    
    // Support legacy startDate/endDate parameters for backward compatibility
    const legacyStartDate = searchParams.get('startDate')
    const legacyEndDate = searchParams.get('endDate')

    let startDate: string
    let endDate: string

    if (legacyStartDate && legacyEndDate) {
      // Use legacy parameters if provided
      startDate = legacyStartDate
      endDate = legacyEndDate
    } else {
      // Use new filtering logic
      const dateRange = getDateRange(period, filterDate )
      startDate = dateRange.startDate
      endDate = dateRange.endDate
    }

  

    // Fetch availability with booking counts
    const { data: availability, error } = await supabase
      .from('expert_availability')
      .select(`
        *,
        bookings:meeting_bookings!availability_id(
          id, status, applicant_id, start_time, end_time,
          applicant:users!applicant_id(first_name, last_name, email)
        )
      `)
      .eq('expert_id', expertId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching availability:', error)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch availability', details: error.message }),
        { status: 500, headers: buildCorsHeaders(origin) }
      )
    }

    console.log(`Found ${availability?.length || 0} availability slots for period: ${period}`)

    // Add computed fields to availability data
    const processedAvailability = (availability || []).map(slot => ({
      ...slot,
      current_bookings: slot.bookings ? slot.bookings.filter((booking: any) => booking.status === 'scheduled').length : 0,
      available_spots: slot.max_bookings - (slot.bookings ? slot.bookings.filter((booking: any) => booking.status === 'scheduled').length : 0),
      is_fully_booked: (slot.bookings ? slot.bookings.filter((booking: any) => booking.status === 'scheduled').length : 0) >= slot.max_bookings,
      is_available: slot.is_available && (slot.bookings ? slot.bookings.filter((booking: any) => booking.status === 'scheduled').length : 0) < slot.max_bookings
    }))

    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        availability: processedAvailability,
        filter: {
          period,
          filterDate,
          startDate,
          endDate,
          total_slots: processedAvailability.length
        }
      }),
      { status: 200, headers: buildCorsHeaders(origin) }
    )
  } catch (error) {
    console.error('Availability GET error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: buildCorsHeaders(origin) }
    )
  }
}

// POST - Create new availability slots
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

    console.log('Verified user data for POST:', JSON.stringify(verified, null, 2))

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
    const { slots } = body as {slots: any}

    if (!slots || !Array.isArray(slots)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid slots data - must be an array' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    console.log(`Creating ${slots.length} availability slots for expert ${expertId}`)

    // Validate and prepare slots for insertion
    const slotsToInsert = slots.map((slot: any, index: number) => {
      // Validate required fields
      if (!slot.date || !slot.startTime || !slot.endTime) {
        throw new Error(`Slot ${index + 1}: Missing required fields: date, startTime, endTime`)
      }

      // Validate time format and logic
      if (slot.startTime >= slot.endTime) {
        throw new Error(`Slot ${index + 1}: Start time must be before end time`)
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(slot.date)) {
        throw new Error(`Slot ${index + 1}: Invalid date format. Expected YYYY-MM-DD`)
      }

      // Validate time format
      const timeRegex = /^\d{2}:\d{2}$/
      if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
        throw new Error(`Slot ${index + 1}: Invalid time format. Expected HH:MM`)
      }

      // Validate date is not in the past
      const slotDate = new Date(slot.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (slotDate < today) {
        throw new Error(`Slot ${index + 1}: Cannot create availability slots for past dates`)
      }

      return {
        expert_id: expertId,
        date: slot.date,
        start_time: slot.startTime,
        end_time: slot.endTime,
        timezone: slot.timezone || 'Africa/Lagos', // Default to WAT
        max_bookings: slot.maxBookings || 1,
        is_available: true
      }
    })

    console.log('Slots to insert:', JSON.stringify(slotsToInsert, null, 2))

    // Check for overlapping slots for the same expert
    for (const slot of slotsToInsert) {
      const { data: existingSlots, error: checkError } = await supabase
        .from('expert_availability')
        .select('id, date, start_time, end_time')
        .eq('expert_id', expertId)
        .eq('date', slot.date)

      if (checkError) {
        console.error('Error checking for existing slots:', checkError)
        continue
      }

      // Check for time overlap
      const hasOverlap = existingSlots?.some(existing => {
        const newStart = slot.start_time
        const newEnd = slot.end_time
        const existingStart = existing.start_time
        const existingEnd = existing.end_time

        // Check if the new slot overlaps with existing slot
        return (newStart < existingEnd && newEnd > existingStart)
      })

      if (hasOverlap) {
        throw new Error(`Time slot ${slot.start_time}-${slot.end_time} on ${slot.date} overlaps with an existing slot`)
      }
    }

    // Insert availability slots
    const { data, error } = await supabase
      .from('expert_availability')
      .insert(slotsToInsert)
      .select()

    if (error) {
      console.error('Error creating availability:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      
      // Handle specific constraint violations
      if (error.code === '23505') { // Unique constraint violation
        return new NextResponse(
          JSON.stringify({ error: 'Some time slots already exist for the selected times' }),
          { status: 409, headers: buildCorsHeaders(origin) }
        )
      }
      
      if (error.code === '22P02') { // Invalid input syntax for UUID
        return new NextResponse(
          JSON.stringify({ 
            error: 'Invalid ID format', 
            debug: { expertId, errorCode: error.code }
          }),
          { status: 400, headers: buildCorsHeaders(origin) }
        )
      }
      
      return new NextResponse(
        JSON.stringify({ error: 'Failed to create availability slots', details: error.message }),
        { status: 500, headers: buildCorsHeaders(origin) }
      )
    }

    console.log(`Successfully created ${data?.length || 0} availability slots`)

    return new NextResponse(
      JSON.stringify({ success: true, slots: data }),
      { status: 201, headers: buildCorsHeaders(origin) }
    )
  } catch (error: any) {
    console.error('Availability POST error:', error)
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: buildCorsHeaders(origin) }
    )
  }
}

// PUT - Update existing availability slot
export async function PUT(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  
  try {
    // Verify authentication
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
        JSON.stringify({ error: 'Slot ID is required' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    // Validate update data if provided
    if (updateData.date || updateData.start_time || updateData.end_time) {
      // Check if there are existing bookings for this slot
      const { data: bookings } = await supabase
        .from('meeting_bookings')
        .select('id')
        .eq('availability_id', id)
        .eq('status', 'scheduled')

      if (bookings && bookings.length > 0) {
        return new NextResponse(
          JSON.stringify({ error: 'Cannot modify slot with existing bookings' }),
          { status: 409, headers: buildCorsHeaders(origin) }
        )
      }
    }

    // Update the availability slot (only if it belongs to the expert)
    const { data, error } = await supabase
      .from('expert_availability')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('expert_id', expertId)
      .select()
      .single()

    if (error) {
      console.error('Error updating availability:', error)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to update availability slot' }),
        { status: 500, headers: buildCorsHeaders(origin) }
      )
    }

    if (!data) {
      return new NextResponse(
        JSON.stringify({ error: 'Availability slot not found or unauthorized' }),
        { status: 404, headers: buildCorsHeaders(origin) }
      )
    }

    return new NextResponse(
      JSON.stringify({ success: true, slot: data }),
      { status: 200, headers: buildCorsHeaders(origin) }
    )
  } catch (error) {
    console.error('Availability PUT error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: buildCorsHeaders(origin) }
    )
  }
}

// DELETE - Remove availability slot
export async function DELETE(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  
  try {
    // Verify authentication
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
    const slotId = searchParams.get('id')

    if (!slotId) {
      return new NextResponse(
        JSON.stringify({ error: 'Slot ID is required' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    // Check if there are any bookings for this slot
    const { data: bookings } = await supabase
      .from('meeting_bookings')
      .select('id, status')
      .eq('availability_id', slotId)
      .eq('status', 'scheduled')

    if (bookings && bookings.length > 0) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Cannot delete slot with existing bookings',
          bookingCount: bookings.length
        }),
        { status: 409, headers: buildCorsHeaders(origin) }
      )
    }

    // Verify the slot belongs to this expert before deletion
    const { data: slot } = await supabase
      .from('expert_availability')
      .select('id, expert_id')
      .eq('id', slotId)
      .eq('expert_id', expertId)
      .single()

    if (!slot) {
      return new NextResponse(
        JSON.stringify({ error: 'Availability slot not found or unauthorized' }),
        { status: 404, headers: buildCorsHeaders(origin) }
      )
    }

    // Delete the availability slot
    const { error } = await supabase
      .from('expert_availability')
      .delete()
      .eq('id', slotId)
      .eq('expert_id', expertId)

    if (error) {
      console.error('Error deleting availability:', error)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to delete availability slot' }),
        { status: 500, headers: buildCorsHeaders(origin) }
      )
    }

    console.log(`Successfully deleted availability slot ${slotId} for expert ${expertId}`)

    return new NextResponse(
      JSON.stringify({ success: true, message: 'Availability slot deleted successfully' }),
      { status: 200, headers: buildCorsHeaders(origin) }
    )
  } catch (error) {
    console.error('Availability DELETE error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: buildCorsHeaders(origin) }
    )
  }
}