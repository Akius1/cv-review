import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@/lib/cloudflare';

export async function GET(request: NextRequest) {
  try {
    const senderId = request.nextUrl.searchParams.get('senderId');
    const receiverId = request.nextUrl.searchParams.get('receiverId');
    
    if (!senderId || !receiverId) {
      return NextResponse.json(
        { error: 'Missing sender or receiver ID' },
        { status: 400 }
      );
    }
    
    // Get database from Cloudflare context
    const { env } = getCloudflareContext();
    const db = env.DB;
    
    // Get messages between these two users
    const messages = await db.prepare(`
      SELECT m.*, 
        sender.first_name as sender_first_name, 
        sender.last_name as sender_last_name,
        receiver.first_name as receiver_first_name, 
        receiver.last_name as receiver_last_name
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users receiver ON m.receiver_id = receiver.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?)
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
    `)
    .bind(
      parseInt(senderId), 
      parseInt(receiverId),
      parseInt(receiverId),
      parseInt(senderId)
    )
    .all();
    
    // Mark messages as read
    await db.prepare(`
      UPDATE messages
      SET is_read = 1
      WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
    `)
    .bind(parseInt(receiverId), parseInt(senderId))
    .run();
    
    return NextResponse.json({
      success: true,
      messages: messages.results
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 }
    );
  }
}
