// FILE: /lib/db.ts
// Updated database operations with consistent types
import { supabase } from './supabase';
import { Expert, Applicant, AvailabilityWithExpert, Booking } from '@/types';

export async function getAvailableTimeSlots(expertId?: string): Promise<AvailabilityWithExpert[]> {
  // Get all available time slots, optionally filtered by expert
  let query = supabase
    .from('availabilities')
    .select(`
      *,
      expert:expert_id (*)
    `)
    .eq('is_booked', false)
    .gt('start_time', new Date().toISOString())
    .order('start_time', { ascending: true });

  if (expertId) {
    query = query.eq('expert_id', expertId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching available time slots:', error);
    throw new Error('Failed to fetch available time slots');
  }

  // Transform the data to match our type
  return (data || []).map(item => ({
    ...item,
    expert: item.expert as Expert
  })) as AvailabilityWithExpert[];
}

export async function bookTimeSlot(
  availabilityId: string,
  applicantId: string
): Promise<{
  booking: Booking;
  expert: Expert;
  applicant: Applicant;
}> {
 

  // 1. Get the availability slot with expert information
  const { data: availability, error: availabilityError } = await supabase
    .from('availabilities')
    .select(`
      *,
      expert:expert_id (*)
    `)
    .eq('id', availabilityId)
    .single();

  if (availabilityError || !availability) {
    console.error('Error fetching availability:', availabilityError);
    throw new Error('Time slot not found');
  }

  if (availability.is_booked) {
    throw new Error('Time slot already booked');
  }

  // 2. Get applicant information
  const { data: applicant, error: applicantError } = await supabase
    .from('applicants')
    .select('*')
    .eq('id', applicantId)
    .single();

  if (applicantError || !applicant) {
    console.error('Error fetching applicant:', applicantError);
    throw new Error('Applicant not found');
  }

  // 3. Mark the availability as booked
  const { error: updateError } = await supabase
    .from('availabilities')
    .update({ is_booked: true, updated_at: new Date().toISOString() })
    .eq('id', availabilityId);

  if (updateError) {
    console.error('Error updating availability:', updateError);
    throw new Error('Failed to book time slot');
  }

  // 4. Create a booking record
  const bookingData = {
    availability_id: availabilityId,
    applicant_id: applicantId,
    expert_id: availability.expert_id,
    start_time: availability.start_time,
    end_time: availability.end_time,
    status: 'scheduled' as const,
  };

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert(bookingData)
    .select()
    .single();

  if (bookingError || !booking) {
    console.error('Error creating booking:', bookingError);
    // Try to rollback the availability update
    await supabase
      .from('availabilities')
      .update({ is_booked: false, updated_at: new Date().toISOString() })
      .eq('id', availabilityId);
    throw new Error('Failed to create booking');
  }

  return {
    booking: booking as Booking,
    expert: availability.expert as Expert,
    applicant: applicant as Applicant,
  };
}

export async function createOrGetApplicant(name: string, email: string): Promise<Applicant> {
  // First, try to find an existing applicant with this email
  const { data: existingApplicant, error: fetchError } = await supabase
    .from('applicants')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (fetchError) {
    console.error('Error finding applicant:', fetchError);
    throw new Error('Failed to check existing applicant');
  }

  // If applicant exists, update name if needed
  if (existingApplicant) {
    if (existingApplicant.name !== name) {
      const { data: updatedApplicant, error: updateError } = await supabase
        .from('applicants')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', existingApplicant.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating applicant:', updateError);
        throw new Error('Failed to update applicant');
      }

      return updatedApplicant as Applicant;
    }
    return existingApplicant as Applicant;
  }

  // Otherwise, create a new applicant
  const { data: newApplicant, error: insertError } = await supabase
    .from('applicants')
    .insert({ name, email })
    .select()
    .single();

  if (insertError || !newApplicant) {
    console.error('Error creating applicant:', insertError);
    throw new Error('Failed to create applicant');
  }

  return newApplicant as Applicant;
}

export async function addAvailability(
  expertId: string,
  startTime: string,
  endTime: string
): Promise<AvailabilityWithExpert> {
  const { data, error } = await supabase
    .from('availabilities')
    .insert({
      expert_id: expertId,
      start_time: startTime,
      end_time: endTime,
      is_booked: false,
    })
    .select(`
      *,
      expert:expert_id (*)
    `)
    .single();

  if (error) {
    console.error('Error adding availability:', error);
    throw new Error('Failed to add availability');
  }

  return {
    ...data,
    expert: data.expert as Expert
  } as AvailabilityWithExpert;
}

export async function deleteAvailability(id: string): Promise<{ success: boolean }> {
  // First check if it's booked
  const { data: availability, error: fetchError } = await supabase
    .from('availabilities')
    .select('is_booked')
    .eq('id', id)
    .single();

  if (fetchError || !availability) {
    console.error('Error fetching availability:', fetchError);
    throw new Error('Availability not found');
  }

  if (availability.is_booked) {
    throw new Error('Cannot delete a booked availability');
  }

  const { error: deleteError } = await supabase
    .from('availabilities')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('Error deleting availability:', deleteError);
    throw new Error('Failed to delete availability');
  }

  return { success: true };
}

export async function updateBookingWithGoogleMeetLink(
  bookingId: string, 
  googleMeetLink: string
): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .update({ 
      google_meet_link: googleMeetLink,
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) {
    console.error('Error updating booking with Google Meet link:', error);
    throw new Error('Failed to update booking with Google Meet link');
  }

  return data as Booking;
}

// Additional function to get expert's availabilities with proper typing
export async function getExpertAvailabilities(expertId: string): Promise<AvailabilityWithExpert[]> {
  const { data, error } = await supabase
    .from('availabilities')
    .select(`
      *,
      expert:expert_id (*)
    `)
    .eq('expert_id', expertId)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching expert availabilities:', error);
    throw new Error('Failed to fetch expert availabilities');
  }

  return (data || []).map(item => ({
    ...item,
    expert: item.expert as Expert
  })) as AvailabilityWithExpert[];
}