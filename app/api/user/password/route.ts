import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, apiResponse, apiError, unauthorized } from '@/lib/utils/api-helpers';
import { hashPassword, verifyPassword } from '@/lib/utils/auth';

export async function PUT(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    const { currentPassword, newPassword, confirmPassword } = await req.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return apiError('All password fields are required');
    }

    if (newPassword !== confirmPassword) {
      return apiError('New password and confirm password do not match');
    }

    if (newPassword.length < 6) {
      return apiError('New password must be at least 6 characters');
    }

    // Get current password hash
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return apiError('User not found', 404);
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, userResult.rows[0].password_hash);
    if (!isValid) {
      return apiError('Current password is incorrect', 401);
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    return apiResponse({ success: true });
  } catch (error) {
    console.error('Update password error:', error);
    return apiError('Internal server error', 500);
  }
}
