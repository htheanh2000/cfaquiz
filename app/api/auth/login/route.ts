import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/utils/auth';
import { apiResponse, apiError } from '@/lib/utils/api-helpers';

export async function POST(req: NextRequest) {
  let email: string | undefined;
  try {
    const body = await req.json();
    email = typeof body?.email === 'string' ? body.email : undefined;
    const password = typeof body?.password === 'string' ? body.password : undefined;

    if (!email || !password) {
      return apiError('Email and password are required', 400);
    }

    // Get user
    const result = await pool.query(
      'SELECT id, email, password_hash, name FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.warn('[auth/login] No user found for email:', email);
      return apiError('Invalid credentials', 401);
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      console.warn('[auth/login] Invalid password for email:', email);
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
    console.error('[auth/login] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return apiError('Internal server error', 500);
  }
}
