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
    const status = searchParams.get('status') || '';
    const tier = searchParams.get('tier') || '';

    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.id::text = $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (level && level !== 'all') {
      conditions.push(`u.level_preference = $${paramIndex}`);
      params.push(level);
      paramIndex++;
    }

    // Base query for students
    let whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countParams = [...params];
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      countParams
    );
    const total = parseInt(countResult.rows[0]?.total || '0');

    // Get students with their stats
    const studentsQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.level_preference,
        u.created_at,
        COALESCE(s.current_streak, 0) as current_streak,
        COALESCE(s.longest_streak, 0) as longest_streak,
        s.last_activity_date,
        (
          SELECT COUNT(*) 
          FROM quiz_sessions qs 
          WHERE qs.user_id = u.id 
          AND qs.completed_at >= CURRENT_DATE
        ) as today_quiz_count,
        (
          SELECT MAX(qs.completed_at)
          FROM quiz_sessions qs
          WHERE qs.user_id = u.id
          AND qs.completed_at IS NOT NULL
        ) as last_quiz_at,
        (
          SELECT AVG(qs.score)
          FROM quiz_sessions qs
          WHERE qs.user_id = u.id
          AND qs.completed_at IS NOT NULL
        ) as avg_score,
        (
          SELECT COUNT(*)
          FROM quiz_sessions qs
          WHERE qs.user_id = u.id
          AND qs.completed_at IS NOT NULL
        ) as total_quizzes
      FROM users u
      LEFT JOIN streaks s ON u.id = s.user_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const result = await pool.query(studentsQuery, params);
    let students = result.rows.map(row => ({
      id: row.id,
      name: row.name || 'Unknown',
      email: row.email,
      level: row.level_preference || 'Level I',
      streak: parseInt(row.current_streak || '0'),
      lastActive: row.last_activity_date || row.created_at,
      lastQuizAt: row.last_quiz_at,
      avgScore: parseFloat(row.avg_score || '0'),
      totalQuizzes: parseInt(row.total_quizzes || '0'),
      todayQuizCount: parseInt(row.today_quiz_count || '0'),
      createdAt: row.created_at,
    }));

    // Apply status filter
    if (status === 'Active Today') {
      students = students.filter(s => s.todayQuizCount > 0);
    }

    // Note: Tier filtering is complex and would require getting all students first
    // For now, we'll skip it in the API and let frontend handle it if needed

    return apiResponse({
      students,
      total: status === 'Active Today' ? students.length : total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Get students error:', error);
    return apiError('Internal server error', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    // TODO: Add admin check here

    const { userIds } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return apiError('User IDs are required', 400);
    }

    // Delete users (cascade will handle related records due to ON DELETE CASCADE)
    const result = await pool.query(
      `DELETE FROM users WHERE id = ANY($1::int[]) RETURNING id`,
      [userIds]
    );

    return apiResponse({
      deletedCount: result.rows.length,
      message: `Successfully deleted ${result.rows.length} user(s)`,
    });
  } catch (error) {
    console.error('Delete users error:', error);
    return apiError('Internal server error', 500);
  }
}
