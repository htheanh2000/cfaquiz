import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, apiResponse, apiError, unauthorized } from '@/lib/utils/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    // Get accuracy from performance data
    const performanceResult = await pool.query(
      `SELECT 
        SUM(total_questions) as total_questions,
        SUM(correct_answers) as total_correct
      FROM performance 
      WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '30 days'`,
      [userId]
    );

    const totalQuestions = parseInt(performanceResult.rows[0]?.total_questions || '0');
    const totalCorrect = parseInt(performanceResult.rows[0]?.total_correct || '0');
    const accuracy = totalQuestions > 0 
      ? Math.round((totalCorrect / totalQuestions) * 100) 
      : 0;

    // Get wrong answers count
    const wrongAnswersResult = await pool.query(
      'SELECT COUNT(*) as count FROM wrong_answers WHERE user_id = $1 AND reviewed_at IS NULL',
      [userId]
    );
    const wrongAnswersCount = parseInt(wrongAnswersResult.rows[0]?.count || '0');

    // Get user's daily goal from profile
    const userResult = await pool.query(
      'SELECT daily_goal FROM users WHERE id = $1',
      [userId]
    );
    const dailyGoalTotal = userResult.rows[0]?.daily_goal || 50;

    // Get daily goal progress (from today's performance)
    const todayResult = await pool.query(
      `SELECT SUM(total_questions) as today_questions
       FROM performance 
       WHERE user_id = $1 AND date = CURRENT_DATE`,
      [userId]
    );
    const todayQuestions = parseInt(todayResult.rows[0]?.today_questions || '0');
    const dailyGoal = todayQuestions;

    return apiResponse({
      accuracy: isNaN(accuracy) ? 0 : accuracy,
      wrongAnswersCount,
      dailyGoal,
      dailyGoalTotal,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return apiError('Internal server error', 500);
  }
}
