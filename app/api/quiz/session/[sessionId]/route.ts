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

    // Get session with subject and level info
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

    return apiResponse({
      sessionId: session.id,
      subjectName: session.subject_name,
      levelName: session.level_name,
      timeLimit: session.time_limit,
      showHints: session.show_hints,
      totalQuestions: session.total_questions,
    });
  } catch (error) {
    console.error('Get session error:', error);
    return apiError('Internal server error', 500);
  }
}
