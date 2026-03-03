import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, apiResponse, apiError, unauthorized } from '@/lib/utils/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    // TODO: Add admin check here

    // Get all subjects with question counts
    const subjectsQuery = `
      SELECT 
        s.id,
        s.name,
        s.code,
        s.description,
        COUNT(DISTINCT q.id) as question_count
      FROM subjects s
      LEFT JOIN questions q ON s.id = q.subject_id
      GROUP BY s.id, s.name, s.code, s.description
      ORDER BY s.id
    `;
    const subjectsResult = await pool.query(subjectsQuery);

    // Get all modules grouped by subject from database
    const modulesBySubject: Record<number, any[]> = {};
    
    try {
      const modulesQuery = `
        SELECT 
          m.id,
          m.subject_id,
          m.module_code,
          m.title,
          m.description,
          m.estimated_time,
          m.status,
          m.order_index,
          (
            SELECT COUNT(*) 
            FROM questions q 
            WHERE q.subject_id = m.subject_id
          ) as question_count
        FROM modules m
        ORDER BY m.subject_id, m.order_index, m.id
      `;
      
      const modulesResult = await pool.query(modulesQuery);
      
      // Group modules by subject_id
      modulesResult.rows.forEach((module: any) => {
        if (!modulesBySubject[module.subject_id]) {
          modulesBySubject[module.subject_id] = [];
        }
        modulesBySubject[module.subject_id].push({
          id: module.id,
          moduleCode: module.module_code,
          title: module.title,
          questionCount: parseInt(module.question_count || '0'),
          estimatedTime: module.estimated_time || 0,
          status: module.status || 'draft',
        });
      });
    } catch (error: any) {
      // If modules table doesn't exist, log error but continue
      if (error.code === '42P01') {
        console.warn('Modules table does not exist. Please run the migration to create it.');
      } else {
        console.error('Error loading modules:', error);
      }
    }

    const topics = subjectsResult.rows.map((subject: any) => {
      // Use only database modules - no mock data fallback
      const modules = modulesBySubject[subject.id] || [];
      
      const publishedModules = modules.filter((m: any) => m.status === 'published');
      const totalQuestions = parseInt(subject.question_count || '0');
      const moduleCount = modules.length;
      
      // Determine status: if all modules are published, topic is published
      const status = modules.length > 0 && publishedModules.length === modules.length ? 'published' : 'draft';

      return {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        description: subject.description,
        moduleCount,
        questionCount: totalQuestions,
        status,
        modules: modules.map((module: any) => ({
          ...module,
          subjectCode: subject.code,
        })),
      };
    });

    // Calculate totals
    const totalTopics = topics.length;
    const totalModules = topics.reduce((sum, t) => sum + t.moduleCount, 0);
    const totalQuestions = topics.reduce((sum, t) => sum + t.questionCount, 0);

    return apiResponse({
      topics,
      summary: {
        totalTopics,
        totalModules,
        totalQuestions,
        lastSync: new Date().toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    });
  } catch (error) {
    console.error('Get curriculum error:', error);
    return apiError('Internal server error', 500);
  }
}
