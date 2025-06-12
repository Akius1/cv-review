/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth/utils'
import { createGoogleMeetEvent } from '@/lib/google-oauth'
import { sendMeetingInvitations } from '@/lib/email-notifications'

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

// Function to get Google tokens for admin user
async function getAdminGoogleTokens(): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    // Get the first admin user with Google tokens
    const { data: adminTokens, error } = await supabase
      .from('user_google_tokens')
      .select(`
        access_token,
        refresh_token,
        expires_at,
        users!user_id(user_type)
      `)
      .eq('users.user_type', 'admin')
      .not('access_token', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !adminTokens) {
      console.log('No admin Google tokens found');
      return null;
    }

    // Check if token is expired
    const isExpired = adminTokens.expires_at ? new Date(adminTokens.expires_at) < new Date() : false;
    
    if (isExpired) {
      console.log('Admin Google tokens are expired');
      return null;
    }

    return {
      accessToken: adminTokens.access_token,
      refreshToken: adminTokens.refresh_token
    };

  } catch (error) {
    console.error('Error getting admin Google tokens:', error);
    return null;
  }
}

// Function to generate Jitsi Meet as fallback
function generateJitsiMeetLink(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `https://meet.jit.si/cv-review-${timestamp}-${random}`;
}

// Updated meeting generation logic
async function generateMeetingLink(
  expertEmail: string,
  applicantEmail: string,
  expertName: string,
  applicantName: string,
  meetingDate: string,
  startTime: string,
  endTime: string,
  title: string,
  description: string
): Promise<{ meetingLink: string; eventId: string | null; method: 'google_meet' | 'jitsi' }> {
  
  // Try to get admin Google tokens
  const adminTokens = await getAdminGoogleTokens();
  
  if (adminTokens) {
    try {
      console.log('Creating real Google Meet with OAuth2...');
      
      const result = await createGoogleMeetEvent(
        adminTokens.accessToken,
        adminTokens.refreshToken,
        expertEmail,
        applicantEmail,
        expertName,
        applicantName,
        meetingDate,
        startTime,
        endTime,
        title,
        description
      );
      
      console.log('Real Google Meet created successfully!');
      return {
        meetingLink: result.googleMeetLink,
        eventId: result.eventId,
        method: 'google_meet'
      };
      
    } catch (error: any) {
      console.error('OAuth2 Google Meet creation failed:', error.message);
      console.log('Falling back to Jitsi Meet...');
    }
  } else {
    console.log('No admin Google tokens available, using Jitsi Meet');
  }
  
  // Fallback to Jitsi Meet
  const jitsiLink = generateJitsiMeetLink();
  return {
    meetingLink: jitsiLink,
    eventId: null,
    method: 'jitsi'
  };
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) })
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  
  try {
    console.log('=== Book Meeting API ===')
    
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
    console.log('Authenticated applicant:', applicantId)
    
    if (!applicantId || !isValidId(applicantId)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid user ID format' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    const body = await request.json()
    const {
      availabilityId,
      expertId,
      meetingDate,
      startTime,
      endTime,
      meetingType = 'google_meet',
      title = 'CV Review Meeting',
      description = 'Professional CV review and feedback session'
    } = body as any

    console.log('Booking request:', {
      availabilityId,
      expertId,
      meetingDate,
      startTime,
      endTime,
      meetingType
    })

    // Validate required fields
    if (!availabilityId || !expertId || !meetingDate || !startTime || !endTime) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required booking information' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    if (!isValidId(availabilityId) || !isValidId(expertId)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid ID format' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    // Check if the slot is still available
    const { data: availabilitySlot, error: availabilityError } = await supabase
      .from('expert_availability')
      .select(`
        *,
        bookings:meeting_bookings!availability_id(id, status, applicant_id)
      `)
      .eq('id', availabilityId)
      .eq('expert_id', expertId)
      .eq('is_available', true)
      .single()

    if (availabilityError || !availabilitySlot) {
      console.error('Availability slot error:', availabilityError)
      return new NextResponse(
        JSON.stringify({ error: 'Availability slot not found or no longer available' }),
        { status: 404, headers: buildCorsHeaders(origin) }
      )
    }

    // Validate slot is in the future
    const slotDateTime = new Date(`${availabilitySlot.date}T${availabilitySlot.start_time}`)
    if (slotDateTime <= new Date()) {
      return new NextResponse(
        JSON.stringify({ error: 'Cannot book slots in the past' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    // Check capacity
    const activeBookings = (availabilitySlot.bookings || []).filter(
      (booking: any) => booking.status === 'scheduled'
    ).length

    if (activeBookings >= availabilitySlot.max_bookings) {
      return new NextResponse(
        JSON.stringify({ error: 'This time slot is fully booked' }),
        { status: 409, headers: buildCorsHeaders(origin) }
      )
    }

    // Check for duplicate booking by same user
    const existingUserBooking = (availabilitySlot.bookings || []).find(
      (booking: any) => booking.applicant_id === applicantId && booking.status === 'scheduled'
    )

    if (existingUserBooking) {
      return new NextResponse(
        JSON.stringify({ error: 'You already have a booking for this time slot' }),
        { status: 409, headers: buildCorsHeaders(origin) }
      )
    }

    // Get expert and applicant details for Google Calendar
    const { data: expert, error: expertError } = await supabase
      .from('users')
      .select('first_name, last_name, email')
      .eq('id', expertId)
      .eq('user_type', 'expert')
      .single()

    const { data: applicant, error: applicantError } = await supabase
      .from('users')
      .select('first_name, last_name, email')
      .eq('id', applicantId)
      .eq('user_type', 'applicant')
      .single()

    if (expertError || !expert || applicantError || !applicant) {
      console.error('User details error:', { expertError, applicantError })
      return new NextResponse(
        JSON.stringify({ error: 'Failed to get user details' }),
        { status: 500, headers: buildCorsHeaders(origin) }
      )
    }

    console.log('Users found:', {
      expert: `${expert.first_name} ${expert.last_name} (${expert.email})`,
      applicant: `${applicant.first_name} ${applicant.last_name} (${applicant.email})`
    })

    // Generate meeting link using the new OAuth integration
    const meetingResult = await generateMeetingLink(
      expert.email,
      applicant.email,
      `${expert.first_name} ${expert.last_name}`.trim(),
      `${applicant.first_name} ${applicant.last_name}`.trim(),
      meetingDate,
      startTime,
      endTime,
      title,
      description
    );

    const videoMeetingLink = meetingResult.meetingLink;
    const googleEventId = meetingResult.eventId;
    const meetingMethod = meetingResult.method;

    console.log(`Meeting created using: ${meetingMethod}`);

    // Create the booking
    const bookingData = {
      availability_id: availabilityId,
      expert_id: expertId,
      applicant_id: applicantId,
      meeting_date: meetingDate,
      start_time: startTime,
      end_time: endTime,
      status: 'scheduled',
      meeting_type: meetingType,
      google_meet_link: videoMeetingLink,
      google_event_id: googleEventId,
      title,
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('Creating booking in database...')
    const { data: booking, error: bookingError } = await supabase
      .from('meeting_bookings')
      .insert(bookingData)
      .select(`
        *,
        expert:users!expert_id(first_name, last_name, email),
        applicant:users!applicant_id(first_name, last_name, email)
      `)
      .single()

    if (bookingError) {
      console.error('Error creating booking:', bookingError)
      
      // If database insert fails but Google event was created, we should clean up
      if (googleEventId) {
        try {
          console.log('Cleaning up Google Calendar event due to database error')
          // You could add cleanup logic here if needed
        } catch (cleanupError) {
          console.error('Failed to cleanup Google Calendar event:', cleanupError)
        }
      }
      
      if (bookingError.code === '23505') {
        return new NextResponse(
          JSON.stringify({ error: 'You already have a booking for this time slot' }),
          { status: 409, headers: buildCorsHeaders(origin) }
        )
      }
      
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to create booking',
          details: bookingError.message 
        }),
        { status: 500, headers: buildCorsHeaders(origin) }
      )
    }

    console.log('Booking created successfully:', booking.id)

    // Send email notifications to both parties
    if (videoMeetingLink) {
      try {
        await sendMeetingInvitations({
          expertName: `${expert.first_name} ${expert.last_name}`.trim(),
          expertEmail: expert.email,
          applicantName: `${applicant.first_name} ${applicant.last_name}`.trim(),
          applicantEmail: applicant.email,
          meetingDate,
          startTime,
          endTime,
          googleMeetLink: videoMeetingLink,
          title,
          description
        })
        
        console.log('Email notifications sent successfully')
      } catch (emailError) {
        console.error('Failed to send email notifications:', emailError)
        // Don't fail the entire booking if emails fail
      }
    }

    // Update the success message based on method
    const successMessage = meetingMethod === 'google_meet' 
      ? 'Meeting booked successfully! A real Google Meet link has been created and calendar invitations sent.'
      : 'Meeting booked successfully! A Jitsi Meet room has been created for your video call.';

    return new NextResponse(
      JSON.stringify({
        success: true,
        booking,
        message: successMessage,
        meetingMethod,
        hasGoogleMeet: meetingMethod === 'google_meet'
      }),
      { status: 201, headers: buildCorsHeaders(origin) }
    )
  } catch (error: any) {
    console.error('Book meeting error:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: buildCorsHeaders(origin) }
    )
  }
}