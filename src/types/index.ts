// Define application types
export interface Expert {
  id: string;
  name: string;
  email: string;
  expertise: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Applicant {
  id: string;
  name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export interface Availability {
  id: string;
  expert_id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  expert?: Expert;
  created_at?: string;
  updated_at?: string;
}

// API response types that include related data
export interface AvailabilityWithExpert extends Availability {
  expert: Expert;
}

export interface Booking {
  id: string;
  availability_id: string;
  applicant_id: string;
  expert_id: string;
  start_time: string;
  end_time: string;
  google_meet_link?: string | null;
  status: 'scheduled' | 'canceled' | 'completed';
  created_at?: string;
  updated_at?: string;
}
export interface BookingWithDetails extends Booking {
  expert: Expert;
  applicant: Applicant;
  availability: Availability;
}