import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, apiResponse, apiError, unauthorized } from '@/lib/utils/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    // TODO: Add admin check here

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');

    if (subjectId) {
      // Get module count for a specific subject
      const countResult = await pool.query(
        'SELECT COUNT(*) as count FROM modules WHERE subject_id = $1',
        [parseInt(subjectId)]
      );
      return apiResponse({
        count: parseInt(countResult.rows[0]?.count || '0'),
      });
    }

    // Get all modules
    const result = await pool.query(
      `SELECT 
        m.id,
        m.subject_id,
        m.module_code,
        m.title,
        m.description,
        m.estimated_time,
        m.status,
        m.order_index,
        s.name as subject_name,
        s.code as subject_code
      FROM modules m
      LEFT JOIN subjects s ON m.subject_id = s.id
      ORDER BY m.subject_id, m.order_index, m.id`
    );

    return apiResponse({
      modules: result.rows,
    });
  } catch (error) {
    console.error('Get modules error:', error);
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
      title,
      moduleCode,
      description,
      estimatedTime,
      status,
      linkedQuestionIds = [],
    } = await req.json();

    if (!subjectId || !title || !moduleCode) {
      return apiError('Subject ID, title, and module code are required', 400);
    }

    // Check if module code already exists
    const existingCheck = await pool.query(
      'SELECT id FROM modules WHERE module_code = $1',
      [moduleCode]
    );

    if (existingCheck.rows.length > 0) {
      return apiError('Module code already exists', 400);
    }

    // Get max order_index for this subject to append new module at the end
    const maxOrderResult = await pool.query(
      'SELECT COALESCE(MAX(order_index), 0) as max_order FROM modules WHERE subject_id = $1',
      [subjectId]
    );
    const nextOrderIndex = parseInt(maxOrderResult.rows[0]?.max_order || '0') + 1;

    // Insert new module
    const result = await pool.query(
      `INSERT INTO modules (subject_id, module_code, title, description, estimated_time, status, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, module_code, title, description, estimated_time, status, order_index`,
      [
        subjectId,
        moduleCode,
        title.trim(),
        description || null,
        estimatedTime || 0,
        status || 'draft',
        nextOrderIndex,
      ]
    );

    const newModule = result.rows[0];

    // Link questions to module if linkedQuestionIds is provided
    if (linkedQuestionIds && Array.isArray(linkedQuestionIds) && linkedQuestionIds.length > 0) {
      try {
        for (const questionId of linkedQuestionIds) {
          await pool.query(
            'INSERT INTO question_modules (question_id, module_id) VALUES ($1, $2) ON CONFLICT (question_id, module_id) DO NOTHING',
            [questionId, newModule.id]
          );
        }
      } catch (error: any) {
        // If question_modules table doesn't exist, log warning but don't fail
        if (error.code === '42P01') {
          console.warn('question_modules table does not exist. Please run the migration.');
        } else {
          console.error('Error linking questions to module:', error);
        }
      }
    }

    return apiResponse({
      module: {
        id: newModule.id,
        moduleCode: newModule.module_code,
        title: newModule.title,
        description: newModule.description,
        estimatedTime: newModule.estimated_time,
        status: newModule.status,
        orderIndex: newModule.order_index,
      },
      message: 'Module created successfully',
    });
  } catch (error: any) {
    console.error('Create module error:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return apiError('Module code already exists', 400);
    }
    
    return apiError('Internal server error', 500);
  }
}
