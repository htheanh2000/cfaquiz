import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, apiResponse, apiError, unauthorized } from '@/lib/utils/api-helpers';

export async function POST(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    // TODO: Add admin check here

    const {
      name,
      code,
      levelId,
      description,
      icon,
      themeColor,
      weightage,
      status,
      backgroundImageUrl,
    } = await req.json();

    if (!name || !code) {
      return apiError('Topic name and code are required', 400);
    }

    // Check if code already exists
    const existingCheck = await pool.query(
      'SELECT id FROM subjects WHERE code = $1',
      [code.toUpperCase()]
    );

    if (existingCheck.rows.length > 0) {
      return apiError('Topic code already exists', 400);
    }

    // Insert new subject/topic
    const result = await pool.query(
      `INSERT INTO subjects (name, code, description)
       VALUES ($1, $2, $3)
       RETURNING id, name, code, description`,
      [name.trim(), code.toUpperCase(), description || null]
    );

    const newTopic = result.rows[0];

    // TODO: Store additional metadata (icon, themeColor, weightage, status, backgroundImageUrl) in a separate table
    // For now, we'll just return success with the basic topic data

    return apiResponse({
      topic: {
        id: newTopic.id,
        name: newTopic.name,
        code: newTopic.code,
        description: newTopic.description,
        icon,
        themeColor,
        weightage,
        status,
        backgroundImageUrl: backgroundImageUrl || null,
      },
      message: 'Topic created successfully',
    });
  } catch (error: any) {
    console.error('Create topic error:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return apiError('Topic code already exists', 400);
    }
    
    return apiError('Internal server error', 500);
  }
}
