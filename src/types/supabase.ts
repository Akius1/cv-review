export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      experts: {
        Row: {
          id: string
          name: string
          email: string
          expertise: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          expertise: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          expertise?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      applicants: {
        Row: {
          id: string
          name: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      availabilities: {
        Row: {
          id: string
          expert_id: string
          start_time: string
          end_time: string
          is_booked: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          expert_id: string
          start_time: string
          end_time: string
          is_booked?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          expert_id?: string
          start_time?: string
          end_time?: string
          is_booked?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          availability_id: string
          applicant_id: string
          expert_id: string
          start_time: string
          end_time: string
          google_meet_link: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          availability_id: string
          applicant_id: string
          expert_id: string
          start_time: string
          end_time: string
          google_meet_link?: string | null
          status: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          availability_id?: string
          applicant_id?: string
          expert_id?: string
          start_time?: string
          end_time?: string
          google_meet_link?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}