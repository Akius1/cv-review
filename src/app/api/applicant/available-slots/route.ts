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

    // Fetch ALL available slots with detailed booking information
    console.log('Fetching all available slots with detailed booking info...')
    const { data: availabilitySlots, error } = await supabase
      .from('expert_availability')
      .select(`
        *,
        expert:users!expert_id(
          id, first_name, last_name, email, user_type
        ),
        bookings:meeting_bookings!availability_id(
          id, status, applicant_id, created_at, cancelled_at, cancellation_reason
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
      const bookings = slot.bookings || []
      
      // Separate bookings by status
      const scheduledBookings = bookings.filter((booking: any) => booking.status === 'scheduled')
      const cancelledBookings = bookings.filter((booking: any) => booking.status === 'cancelled')
      const completedBookings = bookings.filter((booking: any) => booking.status === 'completed')
      
      // Count only scheduled bookings for availability calculation
      const activeBookings = scheduledBookings.length
      
      // Calculate available spots (cancelled bookings free up spots)
      const availableSpots = slot.max_bookings - activeBookings
      
      // Check if slot is in the past
      const slotDate = slot.date
      const slotTime = slot.start_time
      const isExpired = slotDate < currentDate || 
                      (slotDate === currentDate && slotTime <= currentTime)
      
      // Check for recently cancelled bookings (within last 24 hours)
      const recentlyCancelled = cancelledBookings.filter((booking: any) => {
        if (!booking.cancelled_at) return false
        const cancelledDate = new Date(booking.cancelled_at)
        const hoursSinceCancellation = (now.getTime() - cancelledDate.getTime()) / (1000 * 60 * 60)
        return hoursSinceCancellation <= 24
      })
      
      // Determine slot status
      let slotStatus = 'available'
      const statusDetails: any = {
        has_cancelled_bookings: cancelledBookings.length > 0,
        recently_cancelled: recentlyCancelled.length > 0,
        total_bookings: bookings.length,
        scheduled_bookings: scheduledBookings.length,
        cancelled_bookings: cancelledBookings.length,
        completed_bookings: completedBookings.length
      }
      
      if (isExpired) {
        slotStatus = 'expired'
      } else if (availableSpots <= 0) {
        slotStatus = 'fully_booked'
      } else if (recentlyCancelled.length > 0) {
        slotStatus = 'recently_available' // New status for recently freed up slots
      }
      
      console.log(`Slot ${slot.id}: ${slot.date} ${slot.start_time}`, {
        activeBookings,
        maxBookings: slot.max_bookings,
        availableSpots,
        isExpired,
        status: slotStatus,
        cancelledBookings: cancelledBookings.length,
        recentlyCancelled: recentlyCancelled.length
      })
      
      return {
        ...slot,
        current_bookings: activeBookings,
        available_spots: availableSpots,
        status: slotStatus,
        status_details: statusDetails,
        is_expired: isExpired,
        is_fully_booked: availableSpots <= 0,
        has_cancelled_bookings: cancelledBookings.length > 0,
        recently_cancelled_count: recentlyCancelled.length,
        expert_name: slot.expert 
          ? `${slot.expert.first_name || ''} ${slot.expert.last_name || ''}`.trim()
          : 'Unknown Expert',
        // Add booking history for transparency
        booking_summary: {
          total: bookings.length,
          scheduled: scheduledBookings.length,
          cancelled: cancelledBookings.length,
          completed: completedBookings.length,
          recently_cancelled: recentlyCancelled.length
        }
      }
    }) || []

    // Separate slots into different categories
    const availableSlots = processedSlots.filter(slot => 
      !slot.is_expired && slot.available_spots > 0
    )
    
    // Separate recently available slots (had cancellations)
    const recentlyAvailableSlots = availableSlots.filter(slot => 
      slot.status === 'recently_available'
    )
    
    const regularAvailableSlots = availableSlots.filter(slot => 
      slot.status === 'available'
    )
    
    const expiredSlots = processedSlots.filter(slot => slot.is_expired)
    const fullyBookedSlots = processedSlots.filter(slot => 
      !slot.is_expired && slot.available_spots <= 0
    )

    console.log('Processed slots summary:', {
      total: processedSlots.length,
      available: availableSlots.length,
      recentlyAvailable: recentlyAvailableSlots.length,
      regularAvailable: regularAvailableSlots.length,
      expired: expiredSlots.length,
      fullyBooked: fullyBookedSlots.length
    })

    // Return enhanced slots data
    const responseData: any = {
      success: true,
      slots: availableSlots, // All bookable slots (includes recently available)
      recently_available_slots: recentlyAvailableSlots, // Slots with recent cancellations
      regular_available_slots: regularAvailableSlots, // Slots that were never booked or no recent activity
      expired_slots: expiredSlots,
      fully_booked_slots: fullyBookedSlots,
      total: availableSlots.length,
      metadata: {
        total_slots: processedSlots.length,
        available_count: availableSlots.length,
        recently_available_count: recentlyAvailableSlots.length,
        regular_available_count: regularAvailableSlots.length,
        expired_count: expiredSlots.length,
        fully_booked_count: fullyBookedSlots.length,
        slots_with_cancellations: processedSlots.filter(s => s.has_cancelled_bookings).length
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