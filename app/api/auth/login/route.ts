import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/utils/auth';
import { apiResponse, apiError } from '@/lib/utils/api-helpers';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return apiError('Email and password are required');
    }

    // Get user
    const result = await pool.query(
      'SELECT id, email, password_hash, name FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return apiError('Invalid credentials', 401);
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return apiError('Invalid credentials', 401);
    }

    // Generate token
    const token = generateToken(user.id);

    return apiResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return apiError('Internal server error', 500);
  }
}
