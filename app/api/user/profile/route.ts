import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, apiResponse, apiError, unauthorized } from '@/lib/utils/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    const result = await pool.query(
      `SELECT 
        id, 
        email, 
        name,
        phone,
        exam_date,
        daily_goal,
        email_notifications,
        weekly_reports,
        level_preference,
        avatar_url,
        created_at
      FROM users 
      WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return apiError('User not found', 404);
    }

    const user = result.rows[0];

    // Calculate days to exam
    let daysToExam = null;
    if (user.exam_date) {
      const examDate = new Date(user.exam_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      examDate.setHours(0, 0, 0, 0);
      const diffTime = examDate.getTime() - today.getTime();
      daysToExam = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return apiResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone || '',
        examDate: user.exam_date || null,
        dailyGoal: user.daily_goal || 50,
        emailNotifications: user.email_notifications !== false,
        weeklyReports: user.weekly_reports !== false,
        levelPreference: user.level_preference || 'Level I',
        avatarUrl: user.avatar_url || null,
        daysToExam,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return apiError('Internal server error', 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    const { name, phone, examDate, dailyGoal, emailNotifications, weeklyReports, levelPreference, avatarUrl } = await req.json();

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      updateValues.push(name);
      paramIndex++;
    }

    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex}`);
      updateValues.push(phone);
      paramIndex++;
    }

    if (examDate !== undefined) {
      updateFields.push(`exam_date = $${paramIndex}`);
      updateValues.push(examDate || null);
      paramIndex++;
    }

    if (dailyGoal !== undefined) {
      updateFields.push(`daily_goal = $${paramIndex}`);
      updateValues.push(dailyGoal);
      paramIndex++;
    }

    if (emailNotifications !== undefined) {
      updateFields.push(`email_notifications = $${paramIndex}`);
      updateValues.push(emailNotifications);
      paramIndex++;
    }

    if (weeklyReports !== undefined) {
      updateFields.push(`weekly_reports = $${paramIndex}`);
      updateValues.push(weeklyReports);
      paramIndex++;
    }

    if (levelPreference !== undefined) {
      updateFields.push(`level_preference = $${paramIndex}`);
      updateValues.push(levelPreference);
      paramIndex++;
    }

    if (avatarUrl !== undefined) {
      updateFields.push(`avatar_url = $${paramIndex}`);
      updateValues.push(avatarUrl || null);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return apiError('No fields to update');
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(userId);

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, name, phone, exam_date, daily_goal, email_notifications, weekly_reports, level_preference, avatar_url`;

    const result = await pool.query(query, updateValues);

    return apiResponse({
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        name: result.rows[0].name,
        phone: result.rows[0].phone || '',
        examDate: result.rows[0].exam_date,
        dailyGoal: result.rows[0].daily_goal || 50,
        emailNotifications: result.rows[0].email_notifications !== false,
        weeklyReports: result.rows[0].weekly_reports !== false,
        levelPreference: result.rows[0].level_preference || 'Level I',
        avatarUrl: result.rows[0].avatar_url || null,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return apiError('Internal server error', 500);
  }
}
