import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/auth/rate-limit';

/**
 * Next.js middleware — runs on every request before the route handler.
 * Two responsibilities:
 *   1. Rate-limit all /api/* routes (skip /api/events SSE).
 *   2. Attach strict Content-Security-Policy + security headers to every
 *      response to prevent XSS, clickjacking, and MIME-sniffing attacks.
 */

const SECURITY_HEADERS: Record<string, string> = {
  'content-security-policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  'x-frame-options': 'DENY',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
};

export function middleware(req: NextRequest) {
  // 1. Rate limit API routes.
  const limited = rateLimit(req);
  if (limited) return limited;

  // 2. Attach security headers to every response.
  const res = NextResponse.next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(key, value);
  }
  return res;
}

export const config = {
  // Run on every route except static asset optimizations.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
