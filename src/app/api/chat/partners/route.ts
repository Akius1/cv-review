import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@/lib/cloudflare';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 400 }
      );
    }
    
    // Get database from Cloudflare context
    const { env } = getCloudflareContext();
    const db = env.DB;
    
    // Get all chat partners for this user
    const chatPartners = await db.prepare(`
      SELECT DISTINCT 
        u.id, u.first_name, u.last_name, u.email, u.user_type,
        (SELECT MAX(created_at) FROM messages 
         WHERE (sender_id = ? AND receiver_id = u.id) 
            OR (sender_id = u.id AND receiver_id = ?)) as last_message_time,
        (SELECT COUNT(*) FROM messages 
         WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0) as unread_count
      FROM users u
      JOIN messages m ON (m.sender_id = u.id AND m.receiver_id = ?) 
                      OR (m.sender_id = ? AND m.receiver_id = u.id)
      ORDER BY last_message_time DESC
    `)
    .bind(
      parseInt(userId), 
      parseInt(userId), 
      parseInt(userId), 
      parseInt(userId), 
      parseInt(userId)
    )
    .all();
    
    return NextResponse.json({
      success: true,
      chatPartners: chatPartners.results
    });
  } catch (error) {
    console.error('Get chat partners error:', error);
    return NextResponse.json(
      { error: 'Failed to get chat partners' },
      { status: 500 }
    );
  }
}
