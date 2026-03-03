import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, apiResponse, apiError, unauthorized } from '@/lib/utils/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    const totalUsersResult = await pool.query('SELECT COUNT(*) as total FROM users');
    const totalUsers = parseInt(totalUsersResult.rows[0]?.total || '0');

    const totalQuestionsResult = await pool.query('SELECT COUNT(*) as total FROM questions');
    const totalQuestions = parseInt(totalQuestionsResult.rows[0]?.total || '0');

    const totalSessionsResult = await pool.query(
      'SELECT COUNT(*) as total FROM quiz_sessions WHERE completed_at IS NOT NULL'
    );
    const totalSessions = parseInt(totalSessionsResult.rows[0]?.total || '0');

    const sessionsLast7DaysResult = await pool.query(
      `SELECT COUNT(*) as total FROM quiz_sessions
       WHERE completed_at >= CURRENT_DATE - INTERVAL '7 days'`
    );
    const sessionsLast7Days = parseInt(sessionsLast7DaysResult.rows[0]?.total || '0');

    const newUsersLast7DaysResult = await pool.query(
      `SELECT COUNT(*) as total FROM users
       WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`
    );
    const newUsersLast7Days = parseInt(newUsersLast7DaysResult.rows[0]?.total || '0');

    return apiResponse({
      totalUsers,
      totalQuestions,
      totalSessions,
      sessionsLast7Days,
      newUsersLast7Days,
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return apiError('Internal server error', 500);
  }
}
