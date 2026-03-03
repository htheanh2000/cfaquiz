import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { apiResponse, apiError } from '@/lib/utils/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const result = await pool.query('SELECT * FROM levels ORDER BY order_index');
    return apiResponse({ levels: result.rows });
  } catch (error) {
    console.error('Get levels error:', error);
    return apiError('Internal server error', 500);
  }
}
