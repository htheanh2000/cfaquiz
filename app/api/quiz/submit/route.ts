import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, apiResponse, apiError, unauthorized } from '@/lib/utils/api-helpers';

export async function POST(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    const { sessionId, answers } = await req.json();

    if (!sessionId || !answers || !Array.isArray(answers)) {
      return apiError('Session ID and answers array are required');
    }

    // Verify session belongs to user
    const sessionResult = await pool.query(
      'SELECT * FROM quiz_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );

    if (sessionResult.rows.length === 0) {
      return apiError('Quiz session not found', 404);
    }

    const session = sessionResult.rows[0];

    if (session.completed_at) {
      return apiError('Quiz session already completed', 400);
    }

    let correctCount = 0;
    const startTime = new Date(session.created_at);
    const endTime = new Date();

    // Process each answer
    for (const answer of answers) {
      const { questionId, answerId, timeTaken = 0 } = answer;

      // Get correct answer
      const correctAnswerResult = await pool.query(
        'SELECT id FROM answers WHERE question_id = $1 AND is_correct = true LIMIT 1',
        [questionId]
      );

      const isCorrect = correctAnswerResult.rows.length > 0 &&
        correctAnswerResult.rows[0].id === answerId;

      if (isCorrect) {
        correctCount++;
      } else {
        // Add to wrong answers
        await pool.query(
          `INSERT INTO wrong_answers (user_id, question_id, times_wrong, last_wrong_at)
           VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
           ON CONFLICT (user_id, question_id)
           DO UPDATE SET
             times_wrong = wrong_answers.times_wrong + 1,
             last_wrong_at = CURRENT_TIMESTAMP,
             reviewed_at = NULL`,
          [userId, questionId]
        );
      }

      // Save quiz answer
      await pool.query(
        `INSERT INTO quiz_answers (quiz_session_id, question_id, answer_id, is_correct, time_taken)
         VALUES ($1, $2, $3, $4, $5)`,
        [sessionId, questionId, answerId, isCorrect, timeTaken]
      );
    }

    // Calculate score
    const score = (correctCount / session.total_questions) * 100;
    const timeTaken = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // Update quiz session
    await pool.query(
      `UPDATE quiz_sessions
       SET correct_answers = $1, score = $2, time_taken = $3, completed_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [correctCount, score, timeTaken, sessionId]
    );

    // Update streak
    await pool.query(
      `UPDATE streaks
       SET current_streak = CASE
         WHEN last_activity_date = CURRENT_DATE THEN current_streak
         WHEN last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1
         ELSE 1
       END,
       longest_streak = GREATEST(longest_streak, CASE
         WHEN last_activity_date = CURRENT_DATE THEN current_streak
         WHEN last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1
         ELSE 1
       END),
       last_activity_date = CURRENT_DATE,
       updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1`,
      [userId]
    );

    // Update performance tracking
    const today = new Date().toISOString().split('T')[0];
    await pool.query(
      `INSERT INTO performance (user_id, subject_id, level_id, date, total_quizzes, total_questions, correct_answers, average_score, time_spent)
       VALUES ($1, $2, $3, $4, 1, $5, $6, $7, $8)
       ON CONFLICT (user_id, subject_id, level_id, date)
       DO UPDATE SET
         total_quizzes = performance.total_quizzes + 1,
         total_questions = performance.total_questions + $5,
         correct_answers = performance.correct_answers + $6,
         average_score = (performance.average_score * performance.total_quizzes + $7) / (performance.total_quizzes + 1),
         time_spent = performance.time_spent + $8`,
      [userId, session.subject_id, session.level_id, today, session.total_questions, correctCount, score, timeTaken]
    );

    return apiResponse({
      sessionId,
      score,
      correctAnswers: correctCount,
      totalQuestions: session.total_questions,
      timeTaken,
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    return apiError('Internal server error', 500);
  }
}
