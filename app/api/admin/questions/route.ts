import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, apiResponse, apiError, unauthorized } from '@/lib/utils/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    // TODO: Add admin check here
    // For now, allow any authenticated user to access admin endpoints

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const level = searchParams.get('level') || '';
    const topic = searchParams.get('topic') || '';
    const module = searchParams.get('module') || '';

    const offset = (page - 1) * limit;
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';

    if (search) {
      whereClause += ` AND (q.question_text ILIKE $${paramIndex} OR q.id::text ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (level && level !== 'all') {
      whereClause += ` AND q.level_id = $${paramIndex}`;
      queryParams.push(parseInt(level));
      paramIndex++;
    }

    if (topic && topic !== 'all') {
      whereClause += ` AND s.code = $${paramIndex}`;
      queryParams.push(topic);
      paramIndex++;
    }

    // Handle module filter - use JOIN to get module info
    let moduleJoin = '';
    let moduleParamIndex = paramIndex;
    if (module && module !== 'all') {
      moduleJoin = `INNER JOIN question_modules qm ON qm.question_id = q.id AND qm.module_id = $${paramIndex}
        LEFT JOIN modules m ON m.id = qm.module_id`;
      queryParams.push(parseInt(module));
      paramIndex++;
    }

    // Get total count (use separate params array to avoid conflicts)
    const countParams = [...queryParams];
    const countModuleJoin = module && module !== 'all' 
      ? `INNER JOIN question_modules qm ON qm.question_id = q.id AND qm.module_id = $${moduleParamIndex}
        LEFT JOIN modules m ON m.id = qm.module_id`
      : '';
    const countQuery = `
      SELECT COUNT(*) as total
      FROM questions q
      LEFT JOIN subjects s ON q.subject_id = s.id
      ${countModuleJoin}
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0]?.total || '0');

    // Get questions with pagination
    const moduleIdSelect = module && module !== 'all' 
      ? `qm.module_id,
        m.module_code as module,`
      : `NULL as module_id,
        NULL as module,`;
    
    const orderBy = module && module !== 'all' 
      ? 'qm.created_at DESC'
      : 'q.updated_at DESC, q.id DESC';
    
    const questionsQuery = `
      SELECT 
        q.id,
        q.question_text,
        q.question_type,
        q.updated_at,
        ${moduleIdSelect}
        s.name as subject_name,
        l.name as level_name,
        CASE 
          WHEN q.id % 3 = 0 THEN 'high'
          WHEN q.id % 3 = 1 THEN 'medium'
          ELSE 'low'
        END as difficulty
      FROM questions q
      LEFT JOIN subjects s ON q.subject_id = s.id
      LEFT JOIN levels l ON q.level_id = l.id
      ${moduleJoin}
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    const questionsResult = await pool.query(questionsQuery, queryParams);

    const questions = questionsResult.rows.map((row: any) => ({
      id: row.id,
      question_id: `CFA-${row.module || 'UNKNOWN'}-${row.id}`,
      question_text: row.question_text,
      subject_name: row.subject_name,
      module: row.module || null,
      level_name: row.level_name,
      difficulty: row.difficulty,
      updated_at: row.updated_at,
      module_id: row.module_id || null,
    }));

    return apiResponse({
      questions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get admin questions error:', error);
    return apiError('Internal server error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    // TODO: Add admin check here

    const {
      subjectId,
      levelId,
      questionText,
      explanation,
      difficulty,
      losTags = [],
      answers,
      moduleId,
    } = await req.json();

    if (!subjectId || !levelId || !questionText || !answers || answers.length < 2) {
      return apiError('Missing required fields', 400);
    }

    const correctAnswers = answers.filter((a: any) => a.isCorrect);
    if (correctAnswers.length !== 1) {
      return apiError('Exactly one correct answer is required', 400);
    }

    // Insert question
    const questionResult = await pool.query(
      `INSERT INTO questions (subject_id, level_id, question_text, explanation, question_type)
       VALUES ($1, $2, $3, $4, 'multiple_choice')
       RETURNING id, created_at, updated_at`,
      [subjectId, levelId, questionText, explanation || null]
    );

    const questionId = questionResult.rows[0].id;
    const questionCreatedAt = questionResult.rows[0].created_at;
    const questionUpdatedAt = questionResult.rows[0].updated_at;

    // Insert answers
    for (const answer of answers) {
      await pool.query(
        `INSERT INTO answers (question_id, answer_text, is_correct, order_index)
         VALUES ($1, $2, $3, $4)`,
        [questionId, answer.answerText, answer.isCorrect, answer.orderIndex]
      );
    }

    // Link question to module if moduleId is provided
    if (moduleId) {
      try {
        await pool.query(
          `INSERT INTO question_modules (question_id, module_id)
           VALUES ($1, $2)
           ON CONFLICT (question_id, module_id) DO NOTHING`,
          [questionId, moduleId]
        );
      } catch (error: any) {
        // If question_modules table doesn't exist, log warning but don't fail
        if (error.code === '42P01') {
          console.warn('question_modules table does not exist. Please run the migration.');
        } else {
          console.error('Error linking question to module:', error);
        }
      }
    }

    // Get full question data with joins
    const questionDataResult = await pool.query(
      `SELECT 
        q.id,
        q.question_text,
        q.question_type,
        q.explanation,
        q.created_at,
        q.updated_at,
        s.name as subject_name,
        s.code as subject_code,
        l.name as level_name,
        l.id as level_id,
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

    const questionData = questionDataResult.rows[0];

    // Get module info if linked
    let moduleInfo = null;
    if (moduleId) {
      try {
        const moduleResult = await pool.query(
          `SELECT m.id, m.module_code, m.title
           FROM modules m
           WHERE m.id = $1`,
          [moduleId]
        );
        if (moduleResult.rows.length > 0) {
          moduleInfo = {
            id: moduleResult.rows[0].id,
            module_code: moduleResult.rows[0].module_code,
            title: moduleResult.rows[0].title,
          };
        }
      } catch (error) {
        console.error('Error fetching module info:', error);
      }
    }

    return apiResponse({
      id: questionData.id,
      question_id: `CFA-${moduleInfo?.module_code || questionData.subject_code || 'UNKNOWN'}-${questionData.id}`,
      question_text: questionData.question_text,
      explanation: questionData.explanation,
      subject_name: questionData.subject_name,
      subject_code: questionData.subject_code,
      level_name: questionData.level_name,
      level_id: questionData.level_id,
      difficulty: questionData.difficulty,
      created_at: questionData.created_at,
      updated_at: questionData.updated_at,
      module_id: moduleId || null,
      module: moduleInfo?.module_code || null,
      message: 'Question created successfully',
    });
  } catch (error) {
    console.error('Create question error:', error);
    return apiError('Internal server error', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    // TODO: Add admin check here

    const { questionIds } = await req.json();

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return apiError('Question IDs are required', 400);
    }

    // Delete answers first (due to foreign key constraint)
    await pool.query(
      `DELETE FROM answers WHERE question_id = ANY($1::int[])`,
      [questionIds]
    );

    // Delete questions
    const result = await pool.query(
      `DELETE FROM questions WHERE id = ANY($1::int[]) RETURNING id`,
      [questionIds]
    );

    return apiResponse({
      deletedCount: result.rows.length,
      message: `Successfully deleted ${result.rows.length} question(s)`,
    });
  } catch (error) {
    console.error('Delete questions error:', error);
    return apiError('Internal server error', 500);
  }
}
