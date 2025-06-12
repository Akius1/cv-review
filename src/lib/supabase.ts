// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Updated to match your environment variable naming pattern
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Server-side Supabase client (use this on server components/API routes)
// Uses service role key for full database access
export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
})

// Client-side Supabase client (use this in client components)
// Uses anon key with RLS policies
export const createClientComponentClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables for client')
  }
  
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// Alternative server client factory (if you need different configurations)
export const createServerClient = (useServiceRole: boolean = true) => {
  const key = useServiceRole ? supabaseServiceKey : supabaseAnonKey
  
  if (!key) {
    throw new Error(`Missing Supabase ${useServiceRole ? 'service role' : 'anon'} key`)
  }
  
  return createClient<Database>(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  })
}