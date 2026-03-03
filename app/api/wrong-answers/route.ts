import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, apiResponse, apiError, unauthorized } from '@/lib/utils/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    const { searchParams } = new URL(req.url);
    const reviewed = searchParams.get('reviewed');

    let query = `
      SELECT wa.*, q.*,
        json_agg(json_build_object(
          'id', a.id,
          'answer_text', a.answer_text,
          'is_correct', a.is_correct,
          'order_index', a.order_index
        ) ORDER BY a.order_index) as answers
      FROM wrong_answers wa
      INNER JOIN questions q ON wa.question_id = q.id
      LEFT JOIN answers a ON q.id = a.question_id
      WHERE wa.user_id = $1
    `;

    if (reviewed === 'true') {
      query += ' AND wa.reviewed_at IS NOT NULL';
    } else if (reviewed === 'false') {
      query += ' AND wa.reviewed_at IS NULL';
    }

    query += ' GROUP BY wa.id, q.id ORDER BY wa.last_wrong_at DESC';

    const result = await pool.query(query, [userId]);
    const wrongAnswers = result.rows.map((row: any) => ({
      id: row.id,
      questionId: row.question_id,
      timesWrong: row.times_wrong,
      lastWrongAt: row.last_wrong_at,
      reviewedAt: row.reviewed_at,
      question: {
        id: row.question_id,
        questionText: row.question_text,
        explanation: row.explanation,
        answers: row.answers.filter((a: any) => a.id !== null),
      },
    }));

    return apiResponse({ wrongAnswers });
  } catch (error) {
    console.error('Get wrong answers error:', error);
    return apiError('Internal server error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    const { questionId } = await req.json();

    if (!questionId) {
      return apiError('Question ID is required');
    }

    await pool.query(
      'UPDATE wrong_answers SET reviewed_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND question_id = $2',
      [userId, questionId]
    );

    return apiResponse({ success: true });
  } catch (error) {
    console.error('Mark reviewed error:', error);
    return apiError('Internal server error', 500);
  }
}
