import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/utils'



interface AuthPayload {
  id: number
  email: string
  first_name?: string
  last_name?: string
  user_type: 'applicant' | 'expert'
  iat?: number
  exp?: number
}

export async function GET() {
  try {
    // ⚠️ NO await here
    const cookieStore = cookies()
    const token = (await cookieStore)?.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // ⚠️ YES await here
    const verified = (await verifyToken(token)) as AuthPayload | null
    if (!verified) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const { id, email, user_type, first_name, last_name } = verified
    return NextResponse.json(
      { authenticated: true, user: { id, email, user_type, first_name, last_name } },
      { status: 200 }
    )
  } catch (error) {
    console.error('Authentication check error:', error)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}
