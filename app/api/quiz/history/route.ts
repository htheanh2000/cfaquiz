import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, apiResponse, apiError, unauthorized } from '@/lib/utils/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const levelId = searchParams.get('levelId');

    const offset = (page - 1) * limit;

    // Build query
    let query = `
      SELECT 
        qs.id,
        qs.created_at,
        qs.completed_at,
        qs.score,
        qs.correct_answers,
        qs.total_questions,
        qs.time_taken,
        qs.quiz_type,
        s.name as subject_name,
        s.code as subject_code,
        l.name as level_name,
        l.order_index as level_order
      FROM quiz_sessions qs
      LEFT JOIN subjects s ON qs.subject_id = s.id
      LEFT JOIN levels l ON qs.level_id = l.id
      WHERE qs.user_id = $1 AND qs.completed_at IS NOT NULL
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    // Add search filter
    if (search) {
      query += ` AND (
        s.name ILIKE $${paramIndex} OR 
        s.code ILIKE $${paramIndex} OR
        qs.quiz_type ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add date range filter
    if (dateFrom) {
      query += ` AND DATE(qs.completed_at) >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      query += ` AND DATE(qs.completed_at) <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    // Add level filter
    if (levelId) {
      query += ` AND qs.level_id = $${paramIndex}`;
      params.push(levelId);
      paramIndex++;
    }

    // Get total count
    const countQuery = query.replace(
      /SELECT[\s\S]*FROM/,
      'SELECT COUNT(*) as total FROM'
    );
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || '0');

    // Add ordering and pagination
    query += ` ORDER BY qs.completed_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get subjects for each session (for multi-subject sessions)
    const sessions = await Promise.all(
      result.rows.map(async (row: any) => {
        // Get all subjects for this session from quiz_answers
        const subjectsResult = await pool.query(
          `SELECT DISTINCT s.id, s.name, s.code
           FROM quiz_answers qa
           JOIN questions q ON qa.question_id = q.id
           JOIN subjects s ON q.subject_id = s.id
           WHERE qa.quiz_session_id = $1
           ORDER BY s.name`,
          [row.id]
        );

        const sessionSubjects = subjectsResult.rows.map((s: any) => ({
          id: s.id,
          name: s.name,
          code: s.code,
        }));

        // Fallback to session's subject if no subjects found from answers
        const finalSubjects = sessionSubjects.length > 0 
          ? sessionSubjects 
          : (row.subject_name ? [{ name: row.subject_name, code: row.subject_code }] : []);

        return {
          id: row.id,
          date: row.created_at,
          completedAt: row.completed_at,
          score: parseFloat(row.score || 0),
          correctAnswers: row.correct_answers || 0,
          totalQuestions: row.total_questions || 0,
          timeTaken: row.time_taken || 0,
          quizType: row.quiz_type,
          subjectName: row.subject_name,
          subjectCode: row.subject_code,
          levelName: row.level_name,
          levelOrder: row.level_order,
          subjects: finalSubjects,
        };
      })
    );

    return apiResponse({
      sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get quiz history error:', error);
    return apiError('Internal server error', 500);
  }
}
