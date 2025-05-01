import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@/lib/cloudflare';

export async function POST(request: NextRequest) {
  try {
    const { senderId, receiverId, content } = (await request.json()) as {
        senderId: string;
        receiverId: string;
        content: string
    }
    
    if (!senderId || !receiverId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get database from Cloudflare context
    const { env } = getCloudflareContext();
    const db = env.DB;
    
    // Insert message
    const result = await db.prepare(`
      INSERT INTO messages (sender_id, receiver_id, content, is_read)
      VALUES (?, ?, ?, 0)
    `)
    .bind(parseInt(senderId), parseInt(receiverId), content)
    .run();
    
    const messageId = result.meta.last_row_id;
    
    // Get sender info
    const sender = await db.prepare(`
      SELECT first_name, last_name
      FROM users
      WHERE id = ?
    `)
    .bind(parseInt(senderId))
    .first();
    
    // Get receiver info
    const receiver = await db.prepare(`
      SELECT first_name, last_name
      FROM users
      WHERE id = ?
    `)
    .bind(parseInt(receiverId))
    .first();
    
    return NextResponse.json({
      success: true,
      message: {
        id: messageId,
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        is_read: 0,
        created_at: new Date().toISOString(),
        sender_first_name: sender.first_name,
        sender_last_name: sender.last_name,
        receiver_first_name: receiver.first_name,
        receiver_last_name: receiver.last_name
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
