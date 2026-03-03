import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, apiResponse, apiError, unauthorized } from '@/lib/utils/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    // Get average time per question by difficulty level
    // Also calculate from session total time if individual times are 0
    // Use LEFT JOIN to ensure all levels are returned
    const timeResult = await pool.query(
      `SELECT 
        l.id as level_id,
        l.name as level_name,
        l.order_index,
        COALESCE(
          NULLIF(AVG(CASE WHEN qa.time_taken > 0 THEN qa.time_taken ELSE NULL END), 0),
          AVG(CASE WHEN qs.total_questions > 0 THEN qs.time_taken::float / qs.total_questions ELSE NULL END)
        ) as avg_time,
        COUNT(qa.id) as question_count
      FROM levels l
      LEFT JOIN questions q ON q.level_id = l.id
      LEFT JOIN quiz_answers qa ON qa.question_id = q.id
      LEFT JOIN quiz_sessions qs ON qa.quiz_session_id = qs.id AND qs.user_id = $1 AND qs.completed_at IS NOT NULL
      GROUP BY l.id, l.name, l.order_index
      ORDER BY l.order_index`,
      [userId]
    );

    // Target times (in seconds)
    const targets: { [key: number]: number } = {
      1: 90,  // Easy: 90 seconds
      2: 120, // Moderate: 120 seconds
      3: 180, // Difficult: 180 seconds
    };

    const timeEfficiency = timeResult.rows.map((row: any) => {
      const levelId = row.level_id;
      const avgTime = parseFloat(row.avg_time || 0);
      const target = targets[levelId] || 120;
      const percentage = target > 0 ? (avgTime / target) * 100 : 0;
      const overTarget = avgTime > target ? ((avgTime - target) / target) * 100 : 0;

      return {
        levelId,
        levelName: row.level_name || 'Unknown',
        difficulty: levelId === 1 ? 'EASY' : levelId === 2 ? 'MODERATE' : 'DIFFICULT',
        yourTime: Math.round(avgTime),
        target: target,
        percentage: parseFloat(percentage.toFixed(1)),
        overTarget: parseFloat(overTarget.toFixed(1)),
      };
    });

    // Get insight for difficult questions
    const difficultData = timeEfficiency.find(t => t.levelId === 3);
    const insight = difficultData && difficultData.overTarget > 0
      ? `You are exceeding recommended limits on 'Difficult' questions by ${difficultData.overTarget.toFixed(1)}%. Practice pacing with mock sessions.`
      : 'Your time management is within recommended limits. Keep up the good work!';

    return apiResponse({
      timeEfficiency,
      insight,
    });
  } catch (error) {
    console.error('Get time efficiency error:', error);
    return apiError('Internal server error', 500);
  }
}
