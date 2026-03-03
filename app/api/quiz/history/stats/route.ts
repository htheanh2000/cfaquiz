import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, apiResponse, apiError, unauthorized } from '@/lib/utils/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    // Get average score
    const avgScoreResult = await pool.query(
      `SELECT 
        AVG(score) as avg_score,
        COUNT(*) as total_sessions,
        SUM(time_taken) as total_time
      FROM quiz_sessions
      WHERE user_id = $1 AND completed_at IS NOT NULL`,
      [userId]
    );

    const avgScore = parseFloat(avgScoreResult.rows[0]?.avg_score || '0');
    const totalSessions = parseInt(avgScoreResult.rows[0]?.total_sessions || '0');
    const totalTime = parseInt(avgScoreResult.rows[0]?.total_time || '0');

    // Get average score from last week for comparison
    const lastWeekAvgResult = await pool.query(
      `SELECT AVG(score) as avg_score
       FROM quiz_sessions
       WHERE user_id = $1 
         AND completed_at IS NOT NULL
         AND completed_at >= CURRENT_DATE - INTERVAL '7 days'
         AND completed_at < CURRENT_DATE - INTERVAL '1 day'`,
      [userId]
    );
    const lastWeekAvg = parseFloat(lastWeekAvgResult.rows[0]?.avg_score || '0');
    const avgScoreChange = avgScore - lastWeekAvg;

    // Get sessions this week
    const thisWeekResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM quiz_sessions
       WHERE user_id = $1 
         AND completed_at IS NOT NULL
         AND completed_at >= DATE_TRUNC('week', CURRENT_DATE)`,
      [userId]
    );
    const thisWeekSessions = parseInt(thisWeekResult.rows[0]?.count || '0');

    // Get sessions last week
    const lastWeekSessionsResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM quiz_sessions
       WHERE user_id = $1 
         AND completed_at IS NOT NULL
         AND completed_at >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '7 days'
         AND completed_at < DATE_TRUNC('week', CURRENT_DATE)`,
      [userId]
    );
    const lastWeekSessions = parseInt(lastWeekSessionsResult.rows[0]?.count || '0');
    const sessionsChange = thisWeekSessions - lastWeekSessions;

    // Get total study time this month
    const thisMonthResult = await pool.query(
      `SELECT SUM(time_taken) as total_time
       FROM quiz_sessions
       WHERE user_id = $1 
         AND completed_at IS NOT NULL
         AND completed_at >= DATE_TRUNC('month', CURRENT_DATE)`,
      [userId]
    );
    const thisMonthTime = parseInt(thisMonthResult.rows[0]?.total_time || '0');

    // Get total study time last month
    const lastMonthResult = await pool.query(
      `SELECT SUM(time_taken) as total_time
       FROM quiz_sessions
       WHERE user_id = $1 
         AND completed_at IS NOT NULL
         AND completed_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
         AND completed_at < DATE_TRUNC('month', CURRENT_DATE)`,
      [userId]
    );
    const lastMonthTime = parseInt(lastMonthResult.rows[0]?.total_time || '0');
    const timeChange = thisMonthTime - lastMonthTime;

    return apiResponse({
      avgScore: Math.round(avgScore * 10) / 10,
      avgScoreChange: Math.round(avgScoreChange * 10) / 10,
      totalSessions,
      sessionsChange,
      totalTime: Math.round(totalTime / 3600), // Convert to hours
      timeChange: Math.round(timeChange / 3600), // Convert to hours
    });
  } catch (error) {
    console.error('Get quiz history stats error:', error);
    return apiError('Internal server error', 500);
  }
}
