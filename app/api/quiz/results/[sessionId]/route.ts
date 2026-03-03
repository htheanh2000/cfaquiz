import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, apiResponse, apiError, unauthorized } from '@/lib/utils/api-helpers';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    const { sessionId } = await params;

    // Get session info
    const sessionResult = await pool.query(
      `SELECT 
        qs.*,
        s.name as subject_name,
        l.name as level_name
      FROM quiz_sessions qs
      LEFT JOIN subjects s ON qs.subject_id = s.id
      LEFT JOIN levels l ON qs.level_id = l.id
      WHERE qs.id = $1 AND qs.user_id = $2`,
      [sessionId, userId]
    );

    if (sessionResult.rows.length === 0) {
      return apiError('Session not found', 404);
    }

    const session = sessionResult.rows[0];

    // Check if session is completed
    if (!session.completed_at) {
      return apiError('Session not completed yet', 400);
    }

    // Get all questions with user answers and correct answers
    // First get all quiz answers
    const quizAnswersResult = await pool.query(
      `SELECT 
        qa.question_id,
        qa.answer_id as user_answer_id,
        qa.is_correct,
        qa.time_taken
      FROM quiz_answers qa
      WHERE qa.quiz_session_id = $1
      ORDER BY qa.id`,
      [sessionId]
    );

    // Then get questions with all their answers
    const questions = await Promise.all(
      quizAnswersResult.rows.map(async (qaRow: any) => {
        const questionResult = await pool.query(
          `SELECT 
            q.id,
            q.question_text,
            q.explanation,
            q.subject_id,
            q.level_id,
            json_agg(
              json_build_object(
                'id', a.id,
                'answer_text', a.answer_text,
                'is_correct', a.is_correct,
                'order_index', a.order_index
              ) ORDER BY a.order_index
            ) FILTER (WHERE a.id IS NOT NULL) as all_answers
          FROM questions q
          LEFT JOIN answers a ON q.id = a.question_id
          WHERE q.id = $1
          GROUP BY q.id, q.question_text, q.explanation, q.subject_id, q.level_id`,
          [qaRow.question_id]
        );

        const question = questionResult.rows[0];
        const allAnswers = (question.all_answers || []).filter((a: any) => a && a.id !== null);
        
        return {
          id: question.id,
          questionText: question.question_text,
          explanation: question.explanation,
          userAnswerId: qaRow.user_answer_id,
          isCorrect: qaRow.is_correct,
          timeTaken: qaRow.time_taken || 0,
          answers: allAnswers.map((a: any) => ({
            id: a.id,
            answerText: a.answer_text,
            isCorrect: a.is_correct,
            orderIndex: a.order_index,
          })),
        };
      })
    );

    // Calculate percentile (mock for now - can be improved with actual user data)
    const percentile = Math.min(100, Math.max(0, Math.round(session.score * 0.84)));

    return apiResponse({
      session: {
        id: session.id,
        subjectName: session.subject_name,
        levelName: session.level_name,
        score: parseFloat(session.score || 0),
        correctAnswers: session.correct_answers || 0,
        totalQuestions: session.total_questions || 0,
        timeTaken: session.time_taken || 0,
        completedAt: session.completed_at,
      },
      questions,
      percentile,
    });
  } catch (error) {
    console.error('Get quiz results error:', error);
    return apiError('Internal server error', 500);
  }
}
