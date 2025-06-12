/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/availabilities/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAvailableTimeSlots, addAvailability } from '@/lib/db'

// Initialize Supabase client with service-role key (matching your auth pattern)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
)

// CORS helper (matching your login route pattern)
export function buildCorsHeaders(origin: string) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(origin),
  })
}

export async function GET(request: NextRequest) {
  
  const origin = request.headers.get('origin') || '*'
  
  try {
    const { searchParams } = new URL(request.url)

    console.log("searchParams", searchParams)
    const expertId = searchParams.get('expertId') || undefined
    
    const availableSlots = await getAvailableTimeSlots(expertId)
    
    return NextResponse.json(
      { success: true, availableSlots },
      { status: 200, headers: buildCorsHeaders(origin) }
    )
    
  } catch (error: any) {
    console.error('Error fetching available time slots:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch available time slots' },
      { status: 500, headers: buildCorsHeaders(origin) }
    )
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  
  try {
    const { expertId, startTime, endTime } = await request.json() as {
      expertId: string
      startTime: string
      endTime: string
    }
    
    // Validate required fields
    if (!expertId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }
    
    const availability = await addAvailability(expertId, startTime, endTime)
    
    return NextResponse.json(
      { success: true, availability },
      { status: 200, headers: buildCorsHeaders(origin) }
    )
    
  } catch (error: any) {
    console.error('Error adding availability:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add availability' },
      { status: 500, headers: buildCorsHeaders(origin) }
    )
  }
}