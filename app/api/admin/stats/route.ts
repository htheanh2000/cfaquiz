import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, apiResponse, apiError, unauthorized } from '@/lib/utils/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    // TODO: Add admin check here
    // For now, allow any authenticated user to access admin endpoints

    // Get total questions count
    const totalQuestionsResult = await pool.query('SELECT COUNT(*) as total FROM questions');
    const totalQuestions = parseInt(totalQuestionsResult.rows[0]?.total || '0');

    // Get active quiz sessions (sessions created in last 24 hours that are not completed)
    const activeSessionsResult = await pool.query(
      `SELECT COUNT(*) as total 
       FROM quiz_sessions 
       WHERE created_at > NOW() - INTERVAL '24 hours' 
       AND completed_at IS NULL`
    );
    const activeSessions = parseInt(activeSessionsResult.rows[0]?.total || '0');

    // Get questions that need review (can be extended with actual review logic)
    // For now, return a mock number or implement based on your review criteria
    const needsReview = 15; // Mock value - can be replaced with actual query

    return apiResponse({
      total: totalQuestions,
      activeSessions,
      needsReview,
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    return apiError('Internal server error', 500);
  }
}
