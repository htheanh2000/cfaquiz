import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, apiResponse, apiError, unauthorized } from '@/lib/utils/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    const result = await pool.query(
      'SELECT * FROM streaks WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Create streak if not exists
      await pool.query(
        'INSERT INTO streaks (user_id, current_streak, longest_streak) VALUES ($1, 0, 0)',
        [userId]
      );
      return apiResponse({
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
      });
    }

    const streak = result.rows[0];
    // Current streak only counts if user was active today (otherwise streak is "broken" for today)
    const lastActivityDate = streak.last_activity_date
      ? new Date(streak.last_activity_date).toISOString().split('T')[0]
      : null;
    const today = new Date().toISOString().split('T')[0];
    const currentStreak = lastActivityDate === today ? streak.current_streak : 0;

    return apiResponse({
      currentStreak,
      longestStreak: streak.longest_streak,
      lastActivityDate: streak.last_activity_date,
    });
  } catch (error) {
    console.error('Get streak error:', error);
    return apiError('Internal server error', 500);
  }
}
