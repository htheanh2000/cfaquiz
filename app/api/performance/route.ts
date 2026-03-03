import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, apiResponse, apiError, unauthorized } from '@/lib/utils/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');
    const levelId = searchParams.get('levelId');
    const days = parseInt(searchParams.get('days') || '30');

    let query = `
      SELECT p.*, s.name as subject_name, l.name as level_name
      FROM performance p
      LEFT JOIN subjects s ON p.subject_id = s.id
      LEFT JOIN levels l ON p.level_id = l.id
      WHERE p.user_id = $1 AND p.date >= CURRENT_DATE - INTERVAL '${days} days'
    `;
    const params: any[] = [userId];

    if (subjectId) {
      query += ` AND p.subject_id = $${params.length + 1}`;
      params.push(subjectId);
    }

    if (levelId) {
      query += ` AND p.level_id = $${params.length + 1}`;
      params.push(levelId);
    }

    query += ' ORDER BY p.date DESC';

    const result = await pool.query(query, params);

    // Aggregate data
    const totalQuizzes = result.rows.reduce((sum, row) => sum + parseInt(row.total_quizzes), 0);
    const totalQuestions = result.rows.reduce((sum, row) => sum + parseInt(row.total_questions), 0);
    const totalCorrect = result.rows.reduce((sum, row) => sum + parseInt(row.correct_answers), 0);
    const avgScore = result.rows.length > 0
      ? result.rows.reduce((sum, row) => sum + parseFloat(row.average_score), 0) / result.rows.length
      : 0;

    return apiResponse({
      performance: result.rows,
      summary: {
        totalQuizzes,
        totalQuestions,
        totalCorrect,
        averageScore: avgScore,
        accuracy: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
      },
    });
  } catch (error) {
    console.error('Get performance error:', error);
    return apiError('Internal server error', 500);
  }
}
