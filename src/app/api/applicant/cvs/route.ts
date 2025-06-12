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

// GET - Fetch applicant's CVs
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  
  try {
    // Verify authentication
    const authHeader = request.headers.get('cookie')
    if (!authHeader) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: buildCorsHeaders(origin) }
      )
    }

    const token = authHeader.split('auth_token=')[1]?.split(';')[0]
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'No token provided' }),
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
    
    if (!applicantId) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid user ID' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    console.log(`Fetching CVs for applicant ${applicantId}`)

    // Fetch applicant's CVs with any assigned expert details
    const { data: cvs, error } = await supabase
      .from('cv_submissions') // Assuming you have a cv_submissions table
      .select(`
        *,
        expert:users(first_name, last_name, email)
      `)
      .eq('user_id', applicantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching CVs:', error)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch CVs', details: error.message }),
        { status: 500, headers: buildCorsHeaders(origin) }
      )
    }

    // Format the CVs data
    const formattedCVs = (cvs || []).map((cv: any) => ({
      ...cv,
      expert_name: cv.expert ? `${cv.expert.first_name} ${cv.expert.last_name}` : null,
      expert_email: cv.expert?.email || null
    }))

    console.log(`Found ${formattedCVs.length} CVs for applicant`)

    return new NextResponse(
      JSON.stringify({ success: true, cvs: formattedCVs }),
      { status: 200, headers: buildCorsHeaders(origin) }
    )
  } catch (error) {
    console.error('CVs GET error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: buildCorsHeaders(origin) }
    )
  }
}