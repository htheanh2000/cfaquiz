import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, apiResponse, apiError, unauthorized } from '@/lib/utils/api-helpers';
import OpenAI from 'openai';

function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is not set');
  return new OpenAI({ apiKey: key });
}

// Configuration for rate limiting
const CONFIG = {
  // Delay between API calls (ms)
  API_CALL_DELAY_MS: 500,
  // Max questions per batch request
  MAX_BATCH_SIZE: 10,
  // Max retries for failed operations
  MAX_RETRIES: 2,
};

// Sleep utility
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate explanation using OpenAI
async function generateExplanation(question: {
  question_text: string;
  subject_name: string;
  level_name: string;
  answers: Array<{ answer_text: string; is_correct: boolean }>;
}): Promise<string> {
  const prompt = `You are a CFA exam tutor. Generate a detailed, educational explanation for the following CFA exam question.

Subject: ${question.subject_name}
Level: ${question.level_name}

Question: ${question.question_text}

Answer Options:
${question.answers.map((a, i) => `${String.fromCharCode(65 + i)}. ${a.answer_text}${a.is_correct ? ' (Correct)' : ''}`).join('\n')}

Please provide:
1. A clear explanation of why the correct answer is right
2. Brief explanations of why the other options are incorrect
3. Key concepts or formulas that help solve this type of question
4. Any relevant CFA curriculum references if applicable

Keep the explanation concise but thorough (200-400 words). Use clear language suitable for CFA candidates. If mathematical formulas are needed, use LaTeX format with $ for inline and $$ for block equations.`;

  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert CFA exam tutor. Provide clear, accurate, and educational explanations.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 800,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || '';
}

// POST: Generate explanation for a single question
export async function POST(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    const { questionId } = await req.json();

    if (!questionId) {
      return apiError('Question ID is required', 400);
    }

    // Fetch question with answers
    const questionResult = await pool.query(
      `SELECT 
        q.id,
        q.question_text,
        q.explanation,
        s.name as subject_name,
        l.name as level_name,
        COALESCE(
          json_agg(
            json_build_object(
              'answer_text', a.answer_text,
              'is_correct', a.is_correct
            ) ORDER BY a.order_index
          ) FILTER (WHERE a.id IS NOT NULL),
          '[]'
        ) as answers
      FROM questions q
      LEFT JOIN subjects s ON q.subject_id = s.id
      LEFT JOIN levels l ON q.level_id = l.id
      LEFT JOIN answers a ON a.question_id = q.id
      WHERE q.id = $1
      GROUP BY q.id, q.question_text, q.explanation, s.name, l.name`,
      [questionId]
    );

    if (questionResult.rows.length === 0) {
      return apiError('Question not found', 404);
    }

    const question = questionResult.rows[0];
    question.answers = typeof question.answers === 'string' 
      ? JSON.parse(question.answers) 
      : question.answers;

    // Generate explanation
    const explanation = await generateExplanation(question);

    if (!explanation) {
      return apiError('Failed to generate explanation', 500);
    }

    // Update database
    await pool.query(
      'UPDATE questions SET explanation = $1, updated_at = NOW() WHERE id = $2',
      [explanation, questionId]
    );

    return apiResponse({
      questionId,
      explanation,
      message: 'Explanation generated successfully',
    });
  } catch (error: any) {
    console.error('Generate explanation error:', error);
    return apiError(error.message || 'Internal server error', 500);
  }
}

// PUT: Generate explanations for multiple questions (batch)
export async function PUT(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    const { questionIds, filter } = await req.json();

    let targetQuestionIds: number[] = [];

    if (questionIds && Array.isArray(questionIds)) {
      // Specific question IDs provided
      if (questionIds.length > CONFIG.MAX_BATCH_SIZE) {
        return apiError(`Maximum batch size is ${CONFIG.MAX_BATCH_SIZE}`, 400);
      }
      targetQuestionIds = questionIds;
    } else if (filter) {
      // Filter criteria provided
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      // Filter by missing/short explanation
      if (filter.missingExplanation) {
        whereClause += ` AND (q.explanation IS NULL OR LENGTH(q.explanation) < $${paramIndex})`;
        params.push(filter.minExplanationLength || 100);
        paramIndex++;
      }

      // Filter by subject
      if (filter.subjectId) {
        whereClause += ` AND q.subject_id = $${paramIndex}`;
        params.push(filter.subjectId);
        paramIndex++;
      }

      // Filter by level
      if (filter.levelId) {
        whereClause += ` AND q.level_id = $${paramIndex}`;
        params.push(filter.levelId);
        paramIndex++;
      }

      // Limit the number of questions
      const limit = Math.min(filter.limit || CONFIG.MAX_BATCH_SIZE, CONFIG.MAX_BATCH_SIZE);

      const idsResult = await pool.query(
        `SELECT q.id FROM questions q ${whereClause} ORDER BY q.id LIMIT $${paramIndex}`,
        [...params, limit]
      );

      targetQuestionIds = idsResult.rows.map(row => row.id);
    }

    if (targetQuestionIds.length === 0) {
      return apiResponse({
        processed: 0,
        failed: 0,
        results: [],
        message: 'No questions found matching criteria',
      });
    }

    // Fetch all questions
    const questionsResult = await pool.query(
      `SELECT 
        q.id,
        q.question_text,
        s.name as subject_name,
        l.name as level_name,
        COALESCE(
          json_agg(
            json_build_object(
              'answer_text', a.answer_text,
              'is_correct', a.is_correct
            ) ORDER BY a.order_index
          ) FILTER (WHERE a.id IS NOT NULL),
          '[]'
        ) as answers
      FROM questions q
      LEFT JOIN subjects s ON q.subject_id = s.id
      LEFT JOIN levels l ON q.level_id = l.id
      LEFT JOIN answers a ON a.question_id = q.id
      WHERE q.id = ANY($1::int[])
      GROUP BY q.id, q.question_text, s.name, l.name`,
      [targetQuestionIds]
    );

    const results: Array<{ questionId: number; success: boolean; error?: string }> = [];
    let processed = 0;
    let failed = 0;

    // Process questions with delay for rate limiting
    for (const question of questionsResult.rows) {
      question.answers = typeof question.answers === 'string' 
        ? JSON.parse(question.answers) 
        : question.answers;

      try {
        const explanation = await generateExplanation(question);

        if (explanation) {
          await pool.query(
            'UPDATE questions SET explanation = $1, updated_at = NOW() WHERE id = $2',
            [explanation, question.id]
          );
          results.push({ questionId: question.id, success: true });
          processed++;
        } else {
          results.push({ questionId: question.id, success: false, error: 'Empty explanation' });
          failed++;
        }
      } catch (error: any) {
        results.push({ questionId: question.id, success: false, error: error.message });
        failed++;
      }

      // Delay between API calls for rate limiting
      await sleep(CONFIG.API_CALL_DELAY_MS);
    }

    return apiResponse({
      processed,
      failed,
      total: targetQuestionIds.length,
      results,
      message: `Generated explanations for ${processed} questions`,
    });
  } catch (error: any) {
    console.error('Batch generate explanation error:', error);
    return apiError(error.message || 'Internal server error', 500);
  }
}

// GET: Get questions needing explanations
export async function GET(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    const { searchParams } = new URL(req.url);
    const minLength = parseInt(searchParams.get('minLength') || '100');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

    // Get count of questions needing explanations
    const countResult = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE explanation IS NULL) as null_explanation,
        COUNT(*) FILTER (WHERE explanation IS NOT NULL AND LENGTH(explanation) < $1) as short_explanation
      FROM questions`,
      [minLength]
    );

    // Get list of questions needing explanations
    const questionsResult = await pool.query(
      `SELECT 
        q.id,
        q.question_text,
        LENGTH(q.explanation) as explanation_length,
        s.name as subject_name,
        l.name as level_name
      FROM questions q
      LEFT JOIN subjects s ON q.subject_id = s.id
      LEFT JOIN levels l ON q.level_id = l.id
      WHERE q.explanation IS NULL OR LENGTH(q.explanation) < $1
      ORDER BY q.id
      LIMIT $2`,
      [minLength, limit]
    );

    const stats = countResult.rows[0];

    return apiResponse({
      stats: {
        totalNeedingExplanation: parseInt(stats.null_explanation) + parseInt(stats.short_explanation),
        nullExplanation: parseInt(stats.null_explanation),
        shortExplanation: parseInt(stats.short_explanation),
        minLengthThreshold: minLength,
      },
      questions: questionsResult.rows.map(row => ({
        id: row.id,
        question_text: row.question_text.substring(0, 100) + (row.question_text.length > 100 ? '...' : ''),
        explanation_length: row.explanation_length || 0,
        subject_name: row.subject_name,
        level_name: row.level_name,
      })),
    });
  } catch (error: any) {
    console.error('Get questions needing explanation error:', error);
    return apiError(error.message || 'Internal server error', 500);
  }
}
