// src/app/api/chat/messages/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key to bypass RLS if necessary
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// CORS helper
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
    const senderIdParam = request.nextUrl.searchParams.get('senderId')
    const receiverIdParam = request.nextUrl.searchParams.get('receiverId')
    if (!senderIdParam || !receiverIdParam) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing senderId or receiverId' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    const senderId = Number(senderIdParam)
    const receiverId = Number(receiverIdParam)
    if (isNaN(senderId) || isNaN(receiverId)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid senderId or receiverId' }),
        { status: 400, headers: buildCorsHeaders(origin) }
      )
    }

    // Fetch messages between the two users, include sender and receiver names
    const { data: messages, error: fetchErr } = await supabase
      .from('messages')
      .select(
        `id, sender_id, receiver_id, content, is_read, created_at,
         sender:users(first_name, last_name),
         receiver:users(first_name, last_name)`
      )
      .or(
        `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
      )
      .order('created_at', { ascending: true })

    if (fetchErr) {
      console.error('Error fetching messages:', fetchErr)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch messages' }),
        { status: 500, headers: buildCorsHeaders(origin) }
      )
    }

    // Mark incoming messages as read
    const { error: updateErr } = await supabase
      .from('messages')
      .update({ is_read: true })
      .match({ sender_id: receiverId, receiver_id: senderId, is_read: false })

    if (updateErr) console.error('Error marking messages read:', updateErr)

    // Normalize nested user info and return
    const formatted = (messages || []).map((m: any) => ({
      id: m.id,
      sender_id: m.sender_id,
      receiver_id: m.receiver_id,
      content: m.content,
      is_read: m.is_read,
      created_at: m.created_at,
      sender_first_name: m.sender?.first_name,
      sender_last_name: m.sender?.last_name,
      receiver_first_name: m.receiver?.first_name,
      receiver_last_name: m.receiver?.last_name,
    }))

    return new NextResponse(
      JSON.stringify({ success: true, messages: formatted }),
      { status: 200, headers: buildCorsHeaders(origin) }
    )
  } catch (error) {
    console.error('Get messages error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: buildCorsHeaders(request.headers.get('origin') || '*') }
    )
  }
}
