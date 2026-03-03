import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, apiResponse, apiError, unauthorized } from '@/lib/utils/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');
    const allTime = searchParams.get('allTime') === 'true';

    const dateFilter = allTime 
      ? '' 
      : `AND date >= CURRENT_DATE - INTERVAL '${days} days'`;

    // Get streak
    const streakResult = await pool.query(
      'SELECT current_streak, longest_streak, last_activity_date FROM streaks WHERE user_id = $1',
      [userId]
    );
    const streak = streakResult.rows[0] || { current_streak: 0, longest_streak: 0, last_activity_date: null };

    // Check if user practiced today; current streak only counts when active today
    const today = new Date().toISOString().split('T')[0];
    const lastActivityDate = streak.last_activity_date
      ? new Date(streak.last_activity_date).toISOString().split('T')[0]
      : null;
    const practicedToday = lastActivityDate === today ? 1 : 0;
    const currentStreak = lastActivityDate === today ? (streak.current_streak || 0) : 0;

    // Get accuracy and total questions
    const performanceResult = await pool.query(
      `SELECT 
        SUM(total_questions) as total_questions,
        SUM(correct_answers) as total_correct,
        SUM(time_spent) as total_time_spent
      FROM performance 
      WHERE user_id = $1 ${dateFilter}`,
      [userId]
    );

    const totalQuestions = parseInt(performanceResult.rows[0]?.total_questions || '0');
    const totalCorrect = parseInt(performanceResult.rows[0]?.total_correct || '0');
    const totalTimeSpent = parseInt(performanceResult.rows[0]?.total_time_spent || '0');
    const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    // Calculate study velocity (questions per hour)
    const studyVelocity = totalTimeSpent > 0 
      ? Math.round((totalQuestions / totalTimeSpent) * 3600) 
      : 0;

    // Get previous period for comparison
    const previousPeriodResult = await pool.query(
      `SELECT 
        SUM(total_questions) as total_questions,
        SUM(correct_answers) as total_correct,
        SUM(time_spent) as total_time_spent
      FROM performance 
      WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '${days * 2} days' AND date < CURRENT_DATE - INTERVAL '${days} days'`,
      [userId]
    );

    const prevTotalQuestions = parseInt(previousPeriodResult.rows[0]?.total_questions || '0');
    const prevTotalCorrect = parseInt(previousPeriodResult.rows[0]?.total_correct || '0');
    const prevAccuracy = prevTotalQuestions > 0 ? (prevTotalCorrect / prevTotalQuestions) * 100 : 0;
    const prevTimeSpent = parseInt(previousPeriodResult.rows[0]?.total_time_spent || '0');
    const prevVelocity = prevTimeSpent > 0 
      ? Math.round((prevTotalQuestions / prevTimeSpent) * 3600) 
      : 0;

    const accuracyChange = accuracy - prevAccuracy;
    const velocityChange = prevVelocity > 0 ? ((studyVelocity - prevVelocity) / prevVelocity) * 100 : 0;

    // Get total questions available (from database)
    const totalAvailableResult = await pool.query('SELECT COUNT(*) as count FROM questions');
    const totalAvailable = parseInt(totalAvailableResult.rows[0]?.count || '0');

    return apiResponse({
      streak: {
        current: currentStreak,
        longest: streak.longest_streak || 0,
        todayChange: practicedToday,
      },
      accuracy: {
        value: parseFloat(accuracy.toFixed(1)),
        change: parseFloat(accuracyChange.toFixed(1)),
      },
      totalQuestions: {
        answered: totalQuestions,
        available: totalAvailable,
      },
      studyVelocity: {
        value: studyVelocity,
        change: parseFloat(velocityChange.toFixed(1)),
      },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return apiError('Internal server error', 500);
  }
}
