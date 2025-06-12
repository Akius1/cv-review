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

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) })
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  
  try {
    
    // Get cookies from the request
    const cookieHeader = request.headers.get('cookie')
    console.log('Cookie header:', cookieHeader ? 'Present' : 'Missing')
    
    if (!cookieHeader) {
      return new NextResponse(
        JSON.stringify({ error: 'No authentication cookie found' }),
        { status: 401, headers: buildCorsHeaders(origin) }
      )
    }

    // Extract token
    const token = cookieHeader.split('auth_token=')[1]?.split(';')[0]
    
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'No authentication token found' }),
        { status: 401, headers: buildCorsHeaders(origin) }
      )
    }

    // Verify the token
    const verified = await verifyToken(token) as any
    
    if (!verified) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: buildCorsHeaders(origin) }
      )
    }

    if (verified.user_type !== 'applicant') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - Applicant access required' }),
        { status: 401, headers: buildCorsHeaders(origin) }
      )
    }

    console.log('User verified:', verified.email)

    // Fetch ALL available slots without date filtering
    console.log('Fetching all available slots...')
    const { data: availabilitySlots, error } = await supabase
      .from('expert_availability')
      .select(`
        *,
        expert:users!expert_id(
          id, first_name, last_name, email, user_type
        ),
        bookings:meeting_bookings!availability_id(
          id, status, applicant_id
        )
      `)
      .eq('is_available', true)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Supabase query error:', error)
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to fetch available slots', 
          details: error.message,
          code: error.code 
        }),
        { status: 500, headers: buildCorsHeaders(origin) }
      )
    }

    console.log('Raw query result:', {
      count: availabilitySlots?.length || 0,
      sample: availabilitySlots?.[0] || 'No data'
    })

    // Get current timestamp for comparison
    const now = new Date()
    const currentDate = now.toISOString().split('T')[0]
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 8) // HH:MM:SS format

    console.log('Current date and time:', currentDate, currentTime)

    // Process all slots to calculate availability and categorize them
    const processedSlots = availabilitySlots?.map(slot => {
      // Count active bookings (only scheduled bookings count)
      const activeBookings = (slot.bookings || []).filter(
        (booking: any) => booking.status === 'scheduled'
      ).length
      
      // Calculate available spots
      const availableSpots = slot.max_bookings - activeBookings
      
      // Check if slot is in the past
      const slotDate = slot.date
      const slotTime = slot.start_time
      const isExpired = slotDate < currentDate || 
                      (slotDate === currentDate && slotTime <= currentTime)
      
      // Determine slot status
      let slotStatus = 'available'
      if (isExpired) {
        slotStatus = 'expired'
      } else if (availableSpots <= 0) {
        slotStatus = 'fully_booked'
      }
      
      console.log(`Slot ${slot.id}: ${slot.date} ${slot.start_time}`, {
        activeBookings,
        maxBookings: slot.max_bookings,
        availableSpots,
        isExpired,
        status: slotStatus
      })
      
      return {
        ...slot,
        current_bookings: activeBookings,
        available_spots: availableSpots,
        status: slotStatus,
        is_expired: isExpired,
        is_fully_booked: availableSpots <= 0,
        expert_name: slot.expert 
          ? `${slot.expert.first_name || ''} ${slot.expert.last_name || ''}`.trim()
          : 'Unknown Expert'
      }
    }) || []

    // Separate slots into different categories
    const availableSlots = processedSlots.filter(slot => 
      slot.status === 'available' && !slot.is_expired && slot.available_spots > 0
    )
    
    const expiredSlots = processedSlots.filter(slot => slot.is_expired)
    const fullyBookedSlots = processedSlots.filter(slot => 
      !slot.is_expired && slot.available_spots <= 0
    )

    console.log('Processed slots summary:', {
      total: processedSlots.length,
      available: availableSlots.length,
      expired: expiredSlots.length,
      fullyBooked: fullyBookedSlots.length
    })

    // Return all slots data
    const responseData: any = {
      success: true,
      slots: availableSlots, // Main slots to display for booking
      all_slots: processedSlots, // All slots for debugging
      expired_slots: expiredSlots,
      fully_booked_slots: fullyBookedSlots,
      total: availableSlots.length,
      metadata: {
        total_slots: processedSlots.length,
        available_count: availableSlots.length,
        expired_count: expiredSlots.length,
        fully_booked_count: fullyBookedSlots.length
      },
      debug: {
        currentDateTime: { currentDate, currentTime },
        rawSlotsCount: availabilitySlots?.length || 0,
        processedSlotsCount: processedSlots.length
      }
    }

    return new NextResponse(
      JSON.stringify(responseData),
      { status: 200, headers: buildCorsHeaders(origin) }
    )
    
  } catch (error: any) {
    console.error('Available slots API error:', error)
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