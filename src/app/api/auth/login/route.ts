// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyPassword, generateToken } from '@/lib/auth/utils'

// Initialize Supabase client with service-role key
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
)

// CORS helper (same as register)
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
    const { identifier, password } = (await request.json()) as {
      identifier: string
      password: string
    }

    // Validate required
    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    // Determine if identifier is email or phone
    const isEmail = identifier.includes('@')

    // Query user
    const { data: users, error: selectErr } = await supabase
      .from('users')
      .select('id, email, phone_number, first_name, last_name, user_type, password_hash')
      [isEmail ? 'eq' : 'eq'](isEmail ? 'email' : 'phone_number', identifier)
      .single()

    if (selectErr) {
      // If no rows found or other error
      console.error('Login select error:', selectErr)
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401, headers: buildCorsHeaders(origin) }
      )
    }

    const user = users
    // Verify password
    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401, headers: buildCorsHeaders(origin) }
      )
    }

    // Generate token and set cookie
    const token = await generateToken({
      id: user.id,
      email: user.email,
      user_type: user.user_type,
    })

    const response = NextResponse.json(
      { success: true, user: {
          id: user.id,
          email: user.email,
          phone_number: user.phone_number,
          first_name: user.first_name,
          last_name: user.last_name,
          user_type: user.user_type,
        }
      },
      { status: 200, headers: buildCorsHeaders(origin) }
    )

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500, headers: buildCorsHeaders(origin) }
    )
  }
}
