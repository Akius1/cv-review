/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/chat/send/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { senderId, receiverId, content } = (await request.json()) as {
      senderId: number | string
      receiverId: number | string
      content: string
    }

    // Validate input
    const sid = Number(senderId)
    const rid = Number(receiverId)
    if (!sid || !rid || !content?.trim()) {
      return NextResponse.json(
        { error: 'Missing or invalid fields' },
        { status: 400 }
      )
    }

    // Insert new message
    const { data: inserted, error: insertError } = await supabase
      .from('messages')
      .insert({
        sender_id: sid,
        receiver_id: rid,
        content: content.trim(),
        is_read: false
      })
      .select('id')
      .single()

    if (insertError || !inserted) {
      console.error('Insert message error:', insertError)
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }

    // Fetch full message with user names via foreign-key join
    const { data: msgRow, error: fetchError } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        content,
        is_read,
        created_at,
        sender:users!sender_id ( first_name, last_name ),
        receiver:users!receiver_id ( first_name, last_name )
      `)
      .eq('id', inserted.id)
      .single()

    if (fetchError || !msgRow) {
      console.error('Fetch message error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to load message details' },
        { status: 500 }
      )
    }

    const {
      id,
      sender_id,
      receiver_id,
      content: msgContent,
      is_read,
      created_at,
      sender,
      receiver
    } = msgRow

    // Respond with same shape as before
    return NextResponse.json({
      success: true,
      message: {
        id,
        sender_id,
        receiver_id,
        content: msgContent,
        is_read: Number(is_read),
        created_at,
        sender_first_name: (sender as any).first_name,
        sender_last_name: (sender as any).last_name,
        receiver_first_name: (receiver as any).first_name,
        receiver_last_name: (receiver as any).last_name
      }
    })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
