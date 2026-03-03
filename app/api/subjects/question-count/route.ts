import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { apiResponse, apiError } from '@/lib/utils/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectIds = searchParams.get('subjectIds')?.split(',').filter(Boolean).map(Number);

    if (!subjectIds || subjectIds.length === 0) {
      // Get count for all subjects
      const result = await pool.query(
        `SELECT 
          s.id,
          s.name,
          s.code,
          COUNT(q.id) as question_count
        FROM subjects s
        LEFT JOIN questions q ON s.id = q.subject_id
        GROUP BY s.id, s.name, s.code
        ORDER BY s.id`
      );
      return apiResponse({ counts: result.rows });
    }

    // Get count for specific subjects
    const placeholders = subjectIds.map((_, i) => `$${i + 1}`).join(',');
    const result = await pool.query(
      `SELECT 
        s.id,
        s.name,
        s.code,
        COUNT(q.id) as question_count
      FROM subjects s
      LEFT JOIN questions q ON s.id = q.subject_id
      WHERE s.id IN (${placeholders})
      GROUP BY s.id, s.name, s.code
      ORDER BY s.id`,
      subjectIds
    );

    return apiResponse({ counts: result.rows });
  } catch (error) {
    console.error('Get question counts error:', error);
    return apiError('Internal server error', 500);
  }
}
