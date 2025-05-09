// src/app/api/chat/partners/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with service role key to bypass RLS if needed
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// CORS headers helper
function buildCorsHeaders(origin: string) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) })
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  try {
    const userIdParam = request.nextUrl.searchParams.get('userId')
    if (!userIdParam) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing userId parameter' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    const userId = Number(userIdParam)
    if (isNaN(userId)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid userId parameter' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    // Fetch all messages involving this user
    const { data: msgs, error: msgErr } = await supabase
      .from('messages')
      .select(
        `id, sender_id, receiver_id, content, is_read, created_at,
         sender:users(id, first_name, last_name, email, user_type),
         receiver:users(id, first_name, last_name, email, user_type)`
      )
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: true })

    if (msgErr) {
      console.error('Error fetching messages:', msgErr)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch messages' }),
        { status: 500, headers: buildCorsHeaders(origin) }
      )
    }

    // Build partner map
    interface PartnerInfo {
      id: number
      first_name: string
      last_name: string
      email: string
      user_type: string
      last_message_time: string
      unread_count: number
    }

    const partnerMap = new Map<number, PartnerInfo>()

    msgs?.forEach(msg => {
      const isSender = msg.sender_id === userId
      const partnerUser = isSender ? msg.receiver : msg.sender
      if (!partnerUser) return

      const existing = partnerMap.get(partnerUser.id)
      const lastTime = msg.created_at

      if (existing) {
        // update last_message_time if this msg is newer
        if (new Date(lastTime) > new Date(existing.last_message_time)) {
          existing.last_message_time = lastTime
        }
        // count unread if this msg was sent to user and not read
        if (!isSender && msg.is_read === 0) {
          existing.unread_count += 1
        }
      } else {
        partnerMap.set(partnerUser.id, {
          id: partnerUser.id,
          first_name: partnerUser.first_name,
          last_name: partnerUser.last_name,
          email: partnerUser.email,
          user_type: partnerUser.user_type,
          last_message_time: lastTime,
          unread_count: (!isSender && msg.is_read === 0) ? 1 : 0,
        })
      }
    })

    // Sort partners by most recent message desc
    const chatPartners = Array.from(partnerMap.values()).sort((a, b) =>
      new Date(b.last_message_time).getTime() -
      new Date(a.last_message_time).getTime()
    )

    return new NextResponse(
      JSON.stringify({ success: true, chatPartners }),
      { status: 200, headers: buildCorsHeaders(origin) }
    )
  } catch (error) {
    console.error('Error in chat partners route:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: buildCorsHeaders(request.headers.get('origin') || '*') }
    )
  }
}
