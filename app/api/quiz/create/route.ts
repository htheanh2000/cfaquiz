import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, apiResponse, apiError, unauthorized } from '@/lib/utils/api-helpers';

export async function POST(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    const {
      subjectId,
      subjectIds,
      levelId,
      quizType = 'random',
      questionCount = 10,
      questionIds: requestQuestionIds,
      timeLimit,
      showHints,
    } = await req.json();

    let questionsQuery: string;
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Retake mistakes: use explicit question IDs from Results page
    const questionIds = Array.isArray(requestQuestionIds)
      ? requestQuestionIds.filter((id: unknown) => Number.isInteger(Number(id))).map(Number)
      : null;

    if (questionIds && questionIds.length > 0) {
      questionsQuery = `
        SELECT q.*,
          json_agg(json_build_object(
            'id', a.id,
            'answer_text', a.answer_text,
            'is_correct', a.is_correct,
            'order_index', a.order_index
          ) ORDER BY a.order_index) as answers
        FROM questions q
        LEFT JOIN answers a ON q.id = a.question_id
        WHERE q.id = ANY($${paramIndex})
        GROUP BY q.id ORDER BY RANDOM()
        LIMIT $${paramIndex + 1}
      `;
      queryParams.push(questionIds, Math.min(questionIds.length, Number(questionCount) || questionIds.length));
      paramIndex += 2;
    } else if (quizType === 'wrong_answers') {
      questionsQuery = `
        SELECT q.*,
          json_agg(json_build_object(
            'id', a.id,
            'answer_text', a.answer_text,
            'is_correct', a.is_correct,
            'order_index', a.order_index
          ) ORDER BY a.order_index) as answers
        FROM questions q
        LEFT JOIN answers a ON q.id = a.question_id
        INNER JOIN wrong_answers wa ON q.id = wa.question_id
        WHERE wa.user_id = $${paramIndex} AND wa.reviewed_at IS NULL
        GROUP BY q.id ORDER BY RANDOM() LIMIT $${paramIndex + 1}
      `;
      queryParams.push(userId, questionCount);
      paramIndex += 2;
    } else {
      questionsQuery = `
        SELECT q.*,
          json_agg(json_build_object(
            'id', a.id,
            'answer_text', a.answer_text,
            'is_correct', a.is_correct,
            'order_index', a.order_index
          ) ORDER BY a.order_index) as answers
        FROM questions q
        LEFT JOIN answers a ON q.id = a.question_id
        WHERE 1=1
      `;
      if (subjectIds && Array.isArray(subjectIds) && subjectIds.length > 0) {
        const placeholders = subjectIds.map((_, i) => `$${paramIndex + i}`).join(',');
        questionsQuery += ` AND q.subject_id IN (${placeholders})`;
        queryParams.push(...subjectIds);
        paramIndex += subjectIds.length;
      } else if (subjectId) {
        questionsQuery += ` AND q.subject_id = $${paramIndex}`;
        queryParams.push(subjectId);
        paramIndex++;
      }
      if (levelId) {
        questionsQuery += ` AND q.level_id = $${paramIndex}`;
        queryParams.push(levelId);
        paramIndex++;
      }
      questionsQuery += ` GROUP BY q.id ORDER BY RANDOM() LIMIT $${paramIndex}`;
      queryParams.push(questionCount);
    }

    const questionsResult = await pool.query(questionsQuery, queryParams);
    const questions = questionsResult.rows.map((row: any) => ({
      ...row,
      answers: row.answers.filter((a: any) => a.id !== null),
    }));

    if (questions.length === 0) {
      return apiError('No questions found', 404);
    }

    // Create quiz session
    const sessionResult = await pool.query(
      `INSERT INTO quiz_sessions (user_id, subject_id, level_id, quiz_type, total_questions, time_limit, show_hints)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, subject_id, level_id, quiz_type, total_questions, time_limit, show_hints, created_at`,
      [userId, subjectIds?.[0] || subjectId || null, levelId || null, quizType, questions.length, timeLimit || null, showHints || false]
    );

    const session = sessionResult.rows[0];

    return apiResponse({
      sessionId: session.id,
      questions,
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    return apiError('Internal server error', 500);
  }
}
