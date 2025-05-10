/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hashPassword, generateToken } from '@/lib/auth/utils'

// Initialize Supabase client with service-role key

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
)

// CORS helper
function buildCorsHeaders(origin: string) {
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

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'

  try {
    const { email, phone_number, password, first_name, last_name, user_type } =
      (await request.json()) as {
        email: string
        phone_number: string
        password: string
        first_name?: string
        last_name?: string
        user_type: 'applicant' | 'expert'
      }

    // Validate required
    if (!email || !phone_number || !password || !user_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    // Check existing email
    const { data: emailUser, error: emailErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (emailErr && emailErr.code !== 'PGRST116') {
      throw emailErr
    }
    if (emailUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    // Check existing phone
    const { data: phoneUser, error: phoneErr } = await supabase
      .from('users')
      .select('id')
      .eq('phone_number', phone_number)
      .single()

    if (phoneErr && phoneErr.code !== 'PGRST116') {
      throw phoneErr
    }
    if (phoneUser) {
      return NextResponse.json(
        { error: 'Phone number already registered' },
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    // Hash password and insert
    const password_hash = hashPassword(password)
    const { data: newUser, error: insertErr } = await supabase
      .from('users')
      .insert([
        { first_name, last_name, email, phone_number, password_hash, user_type },
      ])
      .select('id, email, phone_number, first_name, last_name, user_type')
      .single()

    if (insertErr) throw insertErr

    // Generate token
    const token = await generateToken({
      id: newUser.id,
      email: newUser.email,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      user_type: newUser.user_type,
    })

    // Build response and set cookie
    const response = NextResponse.json(
      { success: true, user: newUser },
      { status: 201, headers: buildCorsHeaders(origin) }
    )
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    return response
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500, headers: buildCorsHeaders(request.headers.get('origin') || '*') }
    )
  }
}
