import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, apiResponse, apiError, unauthorized } from '@/lib/utils/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '90');

    // Get daily activity count
    const activityResult = await pool.query(
      `SELECT 
        DATE(created_at) as activity_date,
        COUNT(*) as session_count,
        SUM(total_questions) as question_count
      FROM quiz_sessions
      WHERE user_id = $1
        AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
        AND completed_at IS NOT NULL
      GROUP BY DATE(created_at)
      ORDER BY activity_date`,
      [userId]
    );

    // Create a map of activities by date
    const activityMap = new Map<string, { sessions: number; questions: number }>();
    activityResult.rows.forEach((row: any) => {
      // Convert PostgreSQL date to YYYY-MM-DD string format
      const dateStr = row.activity_date instanceof Date 
        ? row.activity_date.toISOString().split('T')[0]
        : new Date(row.activity_date).toISOString().split('T')[0];
      activityMap.set(dateStr, {
        sessions: parseInt(row.session_count || 0),
        questions: parseInt(row.question_count || 0),
      });
    });

    // Generate all dates in range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();
    
    const allDates: { date: string; sessions: number; questions: number }[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const activity = activityMap.get(dateStr) || { sessions: 0, questions: 0 };
      allDates.push({
        date: dateStr,
        sessions: activity.sessions,
        questions: activity.questions,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Find max for intensity calculation
    const maxQuestions = Math.max(...allDates.map(a => a.questions), 1);

    const heatmapData = allDates.map(activity => ({
      date: activity.date,
      intensity: activity.questions > 0 
        ? Math.min(4, Math.max(1, Math.floor((activity.questions / maxQuestions) * 4))) // 1-4 scale
        : 0,
      sessions: activity.sessions,
      questions: activity.questions,
    }));

    return apiResponse({ heatmap: heatmapData });
  } catch (error) {
    console.error('Get heatmap error:', error);
    return apiError('Internal server error', 500);
  }
}
