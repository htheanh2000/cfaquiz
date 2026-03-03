import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, apiResponse, apiError, unauthorized } from '@/lib/utils/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    // TODO: Add admin check here

    // Get total students
    const totalStudentsResult = await pool.query('SELECT COUNT(*) as total FROM users');
    const totalStudents = parseInt(totalStudentsResult.rows[0]?.total || '0');

    // Get students active today (completed a quiz today)
    const activeTodayResult = await pool.query(
      `SELECT COUNT(DISTINCT user_id) as total
       FROM quiz_sessions
       WHERE completed_at >= CURRENT_DATE
       AND completed_at < CURRENT_DATE + INTERVAL '1 day'`
    );
    const activeToday = parseInt(activeTodayResult.rows[0]?.total || '0');

    // Get average streak
    const avgStreakResult = await pool.query(
      `SELECT AVG(current_streak) as avg_streak FROM streaks WHERE current_streak > 0`
    );
    const avgStreak = parseFloat(avgStreakResult.rows[0]?.avg_streak || '0');

    // Get new signups in last 7 days
    const newSignupsResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM users
       WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`
    );
    const newSignups = parseInt(newSignupsResult.rows[0]?.total || '0');

    // Get total students from last period for comparison
    const lastPeriodTotalResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM users
       WHERE created_at < CURRENT_DATE - INTERVAL '30 days'`
    );
    const lastPeriodTotal = parseInt(lastPeriodTotalResult.rows[0]?.total || '0');
    const totalStudentsChange = lastPeriodTotal > 0 
      ? ((totalStudents - lastPeriodTotal) / lastPeriodTotal * 100).toFixed(1)
      : '0';

    // Get active today from yesterday for comparison
    const activeYesterdayResult = await pool.query(
      `SELECT COUNT(DISTINCT user_id) as total
       FROM quiz_sessions
       WHERE completed_at >= CURRENT_DATE - INTERVAL '1 day'
       AND completed_at < CURRENT_DATE`
    );
    const activeYesterday = parseInt(activeYesterdayResult.rows[0]?.total || '0');
    const activeTodayChange = activeYesterday > 0
      ? ((activeToday - activeYesterday) / activeYesterday * 100).toFixed(1)
      : '0';

    // Get average streak from last week
    const lastWeekAvgStreakResult = await pool.query(
      `SELECT AVG(current_streak) as avg_streak
       FROM streaks
       WHERE updated_at < CURRENT_DATE - INTERVAL '7 days'`
    );
    const lastWeekAvgStreak = parseFloat(lastWeekAvgStreakResult.rows[0]?.avg_streak || '0');
    const avgStreakChange = lastWeekAvgStreak > 0
      ? (avgStreak - lastWeekAvgStreak).toFixed(1)
      : '0';

    // Get new signups from previous 7 days
    const prevWeekSignupsResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM users
       WHERE created_at >= CURRENT_DATE - INTERVAL '14 days'
       AND created_at < CURRENT_DATE - INTERVAL '7 days'`
    );
    const prevWeekSignups = parseInt(prevWeekSignupsResult.rows[0]?.total || '0');
    const newSignupsChange = prevWeekSignups > 0
      ? ((newSignups - prevWeekSignups) / prevWeekSignups * 100).toFixed(0)
      : '0';

    return apiResponse({
      totalStudents,
      totalStudentsChange,
      activeToday,
      activeTodayChange,
      avgStreak: Math.round(avgStreak * 10) / 10,
      avgStreakChange,
      newSignups,
      newSignupsChange,
    });
  } catch (error) {
    console.error('Get student stats error:', error);
    return apiError('Internal server error', 500);
  }
}
