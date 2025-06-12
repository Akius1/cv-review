/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { deleteAvailability } from '@/lib/db'
import { buildCorsHeaders } from '../route'

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(origin),
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin') || '*'

  console.log("hello world")
  
  try {
    const id = params.id
    
    if (!id) {
      return NextResponse.json(
        { error: 'Availability ID is required' },
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }
    
    await deleteAvailability(id)
    
    return NextResponse.json(
      { success: true },
      { status: 200, headers: buildCorsHeaders(origin) }
    )
    
  } catch (error: any) {
    console.error('Error deleting availability:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete availability' },
      { status: 500, headers: buildCorsHeaders(origin) }
    )
  }
}