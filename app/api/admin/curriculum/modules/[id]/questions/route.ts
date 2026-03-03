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
    const moduleId = parseInt(id);

    if (isNaN(moduleId)) {
      return apiError('Invalid module ID', 400);
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get total count of linked questions (only count valid question_ids)
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM question_modules WHERE module_id = $1 AND question_id IS NOT NULL',
      [moduleId]
    );
    const total = parseInt(countResult.rows[0]?.count || '0');

    // Get linked questions with pagination (only valid question_ids)
    const result = await pool.query(
      `SELECT 
        qm.question_id,
        qm.created_at as linked_at,
        q.id,
        q.question_text,
        q.question_type,
        q.explanation,
        q.created_at,
        q.updated_at,
        s.name as subject_name,
        s.code as subject_code,
        l.id as level_id,
        l.name as level_name,
        CASE 
          WHEN q.id % 3 = 0 THEN 'high'
          WHEN q.id % 3 = 1 THEN 'medium'
          ELSE 'low'
        END as difficulty
      FROM question_modules qm
      INNER JOIN questions q ON qm.question_id = q.id
      LEFT JOIN subjects s ON q.subject_id = s.id
      LEFT JOIN levels l ON q.level_id = l.id
      WHERE qm.module_id = $1 AND qm.question_id IS NOT NULL
      ORDER BY qm.created_at DESC
      LIMIT $2 OFFSET $3`,
      [moduleId, limit, offset]
    );

    const questions = result.rows.map((row: any) => ({
      id: row.id,
      questionId: `CFA-${row.subject_code}-${row.id}`,
      questionText: row.question_text,
      subjectName: row.subject_name,
      subjectCode: row.subject_code,
      levelName: row.level_name,
      difficulty: row.difficulty,
      linkedAt: row.linked_at,
      updatedAt: row.updated_at,
    }));

    return apiResponse({
      questions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get linked questions error:', error);
    return apiError('Internal server error', 500);
  }
}
