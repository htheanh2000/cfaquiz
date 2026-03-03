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
        m.created_at,
        m.updated_at,
        s.name as subject_name,
        s.code as subject_code
      FROM modules m
      LEFT JOIN subjects s ON m.subject_id = s.id
      WHERE m.id = $1`,
      [moduleId]
    );

    if (result.rows.length === 0) {
      return apiError('Module not found', 404);
    }

    const module = result.rows[0];

    return apiResponse({
      module: {
        id: module.id,
        subjectId: module.subject_id,
        subjectName: module.subject_name,
        subjectCode: module.subject_code,
        moduleCode: module.module_code,
        title: module.title,
        description: module.description,
        estimatedTime: module.estimated_time,
        status: module.status,
        orderIndex: module.order_index,
        createdAt: module.created_at,
        updatedAt: module.updated_at,
      },
    });
  } catch (error) {
    console.error('Get module error:', error);
    return apiError('Internal server error', 500);
  }
}

export async function PUT(
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

    const {
      title,
      moduleCode,
      description,
      estimatedTime,
      status,
      linkedQuestionIds = [],
    } = await req.json();

    // Check if module exists
    const existingModule = await pool.query(
      'SELECT id, module_code FROM modules WHERE id = $1',
      [moduleId]
    );

    if (existingModule.rows.length === 0) {
      return apiError('Module not found', 404);
    }

    // If module code is being changed, check if new code already exists
    if (moduleCode && moduleCode !== existingModule.rows[0].module_code) {
      const codeCheck = await pool.query(
        'SELECT id FROM modules WHERE module_code = $1 AND id != $2',
        [moduleCode, moduleId]
      );

      if (codeCheck.rows.length > 0) {
        return apiError('Module code already exists', 400);
      }
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updateFields.push(`title = $${paramIndex}`);
      updateValues.push(title.trim());
      paramIndex++;
    }

    if (moduleCode !== undefined) {
      updateFields.push(`module_code = $${paramIndex}`);
      updateValues.push(moduleCode.trim());
      paramIndex++;
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      updateValues.push(description || null);
      paramIndex++;
    }

    if (estimatedTime !== undefined) {
      updateFields.push(`estimated_time = $${paramIndex}`);
      updateValues.push(estimatedTime || 0);
      paramIndex++;
    }

    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      updateValues.push(status);
      paramIndex++;
    }

    // If there are fields to update, update the module
    let result;
    if (updateFields.length > 0) {
      // Always update updated_at
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(moduleId);

      const query = `UPDATE modules SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING id, module_code, title, description, estimated_time, status, order_index, updated_at`;

      result = await pool.query(query, updateValues);
    } else {
      // If only linkedQuestionIds is provided, just get the current module data
      const moduleResult = await pool.query(
        'SELECT id, module_code, title, description, estimated_time, status, order_index, updated_at FROM modules WHERE id = $1',
        [moduleId]
      );
      result = moduleResult;
    }

    // Update linked questions if linkedQuestionIds is provided
    if (linkedQuestionIds && Array.isArray(linkedQuestionIds)) {
      try {
        // Delete existing links
        await pool.query(
          'DELETE FROM question_modules WHERE module_id = $1',
          [moduleId]
        );

        // Insert new links
        if (linkedQuestionIds.length > 0) {
          for (const questionId of linkedQuestionIds) {
            await pool.query(
              'INSERT INTO question_modules (question_id, module_id) VALUES ($1, $2) ON CONFLICT (question_id, module_id) DO NOTHING',
              [questionId, moduleId]
            );
          }
        }
      } catch (error: any) {
        // If question_modules table doesn't exist, log warning but don't fail
        if (error.code === '42P01') {
          console.warn('question_modules table does not exist. Please run the migration.');
        } else {
          console.error('Error updating linked questions:', error);
        }
      }
    }

    return apiResponse({
      module: {
        id: result.rows[0].id,
        moduleCode: result.rows[0].module_code,
        title: result.rows[0].title,
        description: result.rows[0].description,
        estimatedTime: result.rows[0].estimated_time,
        status: result.rows[0].status,
        orderIndex: result.rows[0].order_index,
        updatedAt: result.rows[0].updated_at,
      },
      message: 'Module updated successfully',
    });
  } catch (error: any) {
    console.error('Update module error:', error);
    
    if (error.code === '23505') {
      return apiError('Module code already exists', 400);
    }
    
    return apiError('Internal server error', 500);
  }
}
