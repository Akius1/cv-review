import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@/lib/cloudflare';

export async function POST(request: NextRequest) {
  try {
    const { reviewId, content, userId } = (await request.json()) as {
         reviewId: string;
          content: string;
           userId: string
    };
    
    if (!reviewId || !content || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get database from Cloudflare context
    const { env } = getCloudflareContext();
    const db = env.DB;
    
    // Verify that the review exists and belongs to a CV owned by the user
    const reviewCheck = await db.prepare(`
      SELECT r.id
      FROM reviews r
      JOIN cvs c ON r.cv_id = c.id
      WHERE r.id = ? AND c.user_id = ?
    `)
    .bind(parseInt(reviewId), parseInt(userId))
    .first();
    
    if (!reviewCheck) {
      return NextResponse.json(
        { error: 'Review not found or not authorized' },
        { status: 404 }
      );
    }
    
    // Insert response
    const result = await db.prepare(`
      INSERT INTO responses (review_id, content)
      VALUES (?, ?)
    `)
    .bind(parseInt(reviewId), content)
    .run();
    
    const responseId = result.meta.last_row_id;
    
    return NextResponse.json({
      success: true,
      response: {
        id: responseId,
        review_id: reviewId,
        content,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Response submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit response' },
      { status: 500 }
    );
  }
}
