/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/cv/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Get bucket name from env (ensure this exists in your Supabase Storage)
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'cvs'

// CORS helper
function buildCorsHeaders(origin: string) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) })
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  try {
    const formData = await request.formData()
    const file = formData.get('file') as Blob | null
    const userId = formData.get('userId') as string | null

    if (!file || !userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    // Create a unique storage path
    const fileName = (formData.get('file') as any).name as string
    const timestamp = Date.now()
    const path = `${userId}/${timestamp}_${fileName}`

    // Upload file to Supabase Storage
    const { data: storageData, error: uploadErr } = await supabase
      .storage
      .from(BUCKET_NAME)
      .upload(path, file, { upsert: false })

    if (uploadErr) {
      console.error(`Storage upload error (bucket: ${BUCKET_NAME}):`, uploadErr)
      return new NextResponse(
        JSON.stringify({ error: `Storage upload failed: ${uploadErr.message}` }),
        { status: 500, headers: buildCorsHeaders(origin) }
      )
    }

    // Insert record in 'cvs' table and return the new row
    const { data: inserted, error: dbErr } = await supabase
      .from('cvs')
      .insert([
        { user_id: Number(userId), file_path: storageData?.path || path, file_name: fileName, status: 'pending' }
      ])
      .select('id, file_name, file_path, status, created_at')
      .single()

    if (dbErr || !inserted) {
      console.error('Database insert error:', dbErr)
      return new NextResponse(
        JSON.stringify({ error: 'Database insert failed' }),
        { status: 500, headers: buildCorsHeaders(origin) }
      )
    }

    // Build the CV object (with initial review_count = 0)
    const cv = { ...inserted, review_count: 0 }

    return new NextResponse(
      JSON.stringify({ success: true, cv }),
      { status: 200, headers: buildCorsHeaders(origin) }
    )
  } catch (error) {
    console.error('Upload route error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to upload CV' }),
      { status: 500, headers: buildCorsHeaders(request.headers.get('origin') || '*') }
    )
  }
}

/**
 * ⚠️ NEXT STEPS:
 * - In your Supabase Dashboard, create a Storage bucket named to match `SUPABASE_STORAGE_BUCKET` (default: 'cvs').
 * - Ensure Row Level Security is configured appropriately on the storage bucket.
 */
