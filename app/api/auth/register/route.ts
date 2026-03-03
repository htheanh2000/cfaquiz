import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/utils/auth';
import { apiResponse, apiError } from '@/lib/utils/api-helpers';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return apiError('Email and password are required');
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return apiError('User already exists', 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, passwordHash, name || null]
    );

    const user = result.rows[0];

    // Generate token
    const token = generateToken(user.id);

    // Create initial streak (best-effort; do not fail register if this fails)
    try {
      await pool.query(
        'INSERT INTO streaks (user_id, current_streak, longest_streak) VALUES ($1, 0, 0) ON CONFLICT (user_id) DO NOTHING',
        [user.id]
      );
    } catch (streakErr) {
      console.warn('[auth/register] Streak insert skipped:', streakErr);
    }

    return apiResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    }, 201);
  } catch (error) {
    console.error('Register error:', error);
    return apiError('Internal server error', 500);
  }
}
