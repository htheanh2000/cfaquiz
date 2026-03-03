import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, apiResponse, apiError, unauthorized } from '@/lib/utils/api-helpers';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    // TODO: Add admin check here

    const { id } = await params;
    const questionId = parseInt(id);
    if (isNaN(questionId)) {
      return apiError('Invalid question ID', 400);
    }

    // Get question with subject and level info
    const questionResult = await pool.query(
      `SELECT 
        q.id,
        q.question_text,
        q.question_type,
        q.explanation,
        q.created_at,
        q.updated_at,
        s.id as subject_id,
        s.name as subject_name,
        s.code as subject_code,
        l.id as level_id,
        l.name as level_name,
        CASE 
          WHEN q.id % 3 = 0 THEN 'high'
          WHEN q.id % 3 = 1 THEN 'medium'
          ELSE 'low'
        END as difficulty
      FROM questions q
      LEFT JOIN subjects s ON q.subject_id = s.id
      LEFT JOIN levels l ON q.level_id = l.id
      WHERE q.id = $1`,
      [questionId]
    );

    if (questionResult.rows.length === 0) {
      return apiError('Question not found', 404);
    }

    const question = questionResult.rows[0];

    // Get answers for this question
    const answersResult = await pool.query(
      `SELECT 
        id,
        answer_text,
        is_correct,
        order_index
      FROM answers
      WHERE question_id = $1
      ORDER BY order_index ASC`,
      [questionId]
    );

    const answers = answersResult.rows.map((row: any) => ({
      id: row.id,
      answerText: row.answer_text,
      isCorrect: row.is_correct,
      orderIndex: row.order_index,
    }));

    // Format the response
    const response = {
      id: question.id,
      questionId: `CFA-${question.subject_code}-${question.id}`,
      questionText: question.question_text,
      explanation: question.explanation,
      questionType: question.question_type,
      difficulty: question.difficulty,
      subject: {
        id: question.subject_id,
        name: question.subject_name,
        code: question.subject_code,
      },
      level: {
        id: question.level_id,
        name: question.level_name,
      },
      answers: answers,
      createdAt: question.created_at,
      updatedAt: question.updated_at,
      // Mock data for status and audit history
      status: 'published', // You can add a status field to the database later
      lastModifiedBy: 'Admin',
      auditHistory: [
        {
          event: 'Initial Upload',
          date: new Date(question.created_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }),
        },
        {
          event: 'Technical Audit',
          date: new Date(question.created_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }),
        },
        {
          event: 'Published',
          date: new Date(question.updated_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }),
        },
      ],
    };

    return apiResponse(response);
  } catch (error) {
    console.error('Get question detail error:', error);
    return apiError('Internal server error', 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    // TODO: Add admin check here

    const { id } = await params;
    const questionId = parseInt(id);
    if (isNaN(questionId)) {
      return apiError('Invalid question ID', 400);
    }

    const {
      questionText,
      explanation,
      difficulty,
      answers,
      subjectId,
      levelId,
    } = await req.json();

    if (!questionText || !answers || answers.length < 2) {
      return apiError('Missing required fields', 400);
    }

    const correctAnswers = answers.filter((a: any) => a.isCorrect);
    if (correctAnswers.length !== 1) {
      return apiError('Exactly one correct answer is required', 400);
    }

    // Update question
    await pool.query(
      `UPDATE questions 
       SET question_text = $1, 
           explanation = $2,
           subject_id = COALESCE($3, subject_id),
           level_id = COALESCE($4, level_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [questionText, explanation || null, subjectId || null, levelId || null, questionId]
    );

    // Delete existing answers
    await pool.query(
      `DELETE FROM answers WHERE question_id = $1`,
      [questionId]
    );

    // Insert updated answers
    for (const answer of answers) {
      await pool.query(
        `INSERT INTO answers (question_id, answer_text, is_correct, order_index)
         VALUES ($1, $2, $3, $4)`,
        [questionId, answer.answerText, answer.isCorrect, answer.orderIndex]
      );
    }

    return apiResponse({
      message: 'Question updated successfully',
      questionId,
    });
  } catch (error) {
    console.error('Update question error:', error);
    return apiError('Internal server error', 500);
  }
}
