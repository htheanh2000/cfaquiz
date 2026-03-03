import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../utils/auth';

export function getAuthUser(req: NextRequest): number | null {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}

export function apiResponse(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function unauthorized() {
  return apiError('Unauthorized', 401);
}
