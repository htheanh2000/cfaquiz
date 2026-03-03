import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const ts = new Date().toISOString();
  const method = request.method;
  const path = request.nextUrl.pathname;
  // Log to stdout so Dozzle/container logs show activity
  // eslint-disable-next-line no-console
  console.log(`[${ts}] ${method} ${path}`);
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
