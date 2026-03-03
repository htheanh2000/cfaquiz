import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, apiResponse, apiError, unauthorized } from '@/lib/utils/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    const result = await pool.query(
      `SELECT r.*, q.*,
        json_agg(json_build_object(
          'id', a.id,
          'answer_text', a.answer_text,
          'is_correct', a.is_correct,
          'order_index', a.order_index
        ) ORDER BY a.order_index) as answers
       FROM reminders r
       INNER JOIN questions q ON r.question_id = q.id
       LEFT JOIN answers a ON q.id = a.question_id
       WHERE r.user_id = $1 AND r.remind_at <= CURRENT_TIMESTAMP AND r.is_sent = false
       GROUP BY r.id, q.id
       ORDER BY r.remind_at ASC`,
      [userId]
    );

    const reminders = result.rows.map((row: any) => ({
      id: row.id,
      questionId: row.question_id,
      remindAt: row.remind_at,
      question: {
        id: row.question_id,
        questionText: row.question_text,
        explanation: row.explanation,
        answers: row.answers.filter((a: any) => a.id !== null),
      },
    }));

    return apiResponse({ reminders });
  } catch (error) {
    console.error('Get reminders error:', error);
    return apiError('Internal server error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    const { questionIds, days = 1 } = await req.json();

    if (!questionIds || !Array.isArray(questionIds)) {
      return apiError('Question IDs array is required');
    }

    const remindAt = new Date();
    remindAt.setDate(remindAt.getDate() + days);

    for (const questionId of questionIds) {
      await pool.query(
        'INSERT INTO reminders (user_id, question_id, remind_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [userId, questionId, remindAt]
      );
    }

    return apiResponse({ success: true });
  } catch (error) {
    console.error('Create reminders error:', error);
    return apiError('Internal server error', 500);
  }
}
