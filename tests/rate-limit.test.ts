import { describe, it, expect, beforeEach, vi } from 'vitest';

// Stub server-only so the rate-limit module can be imported in tests.
vi.mock('server-only', () => ({}));

import { NextRequest } from 'next/server';
import { rateLimit, __resetRateLimiterForTesting } from '@/lib/auth/rate-limit';

function makeReq(pathname: string, method = 'GET', ip = '1.2.3.4'): NextRequest {
  const url = `http://localhost${pathname}`;
  const req = new NextRequest(url, { method, headers: { 'x-forwarded-for': ip } });
  return req;
}

describe('rateLimit', () => {
  beforeEach(() => {
    __resetRateLimiterForTesting();
  });

  it('returns null for non-API routes', () => {
    expect(rateLimit(makeReq('/fan'))).toBeNull();
    expect(rateLimit(makeReq('/'))).toBeNull();
  });

  it('returns null for /api/events (SSE exempt)', () => {
    expect(rateLimit(makeReq('/api/events'))).toBeNull();
  });

  it('allows requests under the limit', () => {
    for (let i = 0; i < 5; i++) {
      const res = rateLimit(makeReq('/api/state', 'GET'));
      expect(res).toBeNull();
    }
  });

  it('returns 429 when GET limit (120/min) is exceeded', async () => {
    // Fire 120 requests (the limit) — all should pass.
    for (let i = 0; i < 120; i++) {
      expect(rateLimit(makeReq('/api/state', 'GET'))).toBeNull();
    }
    // The 121st should be rate-limited.
    const res = rateLimit(makeReq('/api/state', 'GET'));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(429);
    const body = await res!.json();
    expect(body.error).toBe('Too Many Requests');
    expect(res!.headers.get('retry-after')).toBeTruthy();
    expect(res!.headers.get('x-ratelimit-limit')).toBe('120');
  });

  it('returns 429 when POST limit (30/min) is exceeded', () => {
    for (let i = 0; i < 30; i++) {
      expect(rateLimit(makeReq('/api/incidents', 'POST'))).toBeNull();
    }
    const res = rateLimit(makeReq('/api/incidents', 'POST'));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(429);
    expect(res!.headers.get('x-ratelimit-limit')).toBe('30');
  });

  it('returns 429 when AUTH limit (10/min) is exceeded', () => {
    for (let i = 0; i < 10; i++) {
      expect(rateLimit(makeReq('/api/auth/switch', 'POST'))).toBeNull();
    }
    const res = rateLimit(makeReq('/api/auth/switch', 'POST'));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(429);
    expect(res!.headers.get('x-ratelimit-limit')).toBe('10');
  });

  it('tracks IPs independently', () => {
    // IP A uses 120 GETs.
    for (let i = 0; i < 120; i++) {
      rateLimit(makeReq('/api/state', 'GET', '1.1.1.1'));
    }
    // IP B should still be allowed.
    expect(rateLimit(makeReq('/api/state', 'GET', '2.2.2.2'))).toBeNull();
    // IP A is over the limit.
    expect(rateLimit(makeReq('/api/state', 'GET', '1.1.1.1'))).not.toBeNull();
  });

  it('tracks routes independently per IP', () => {
    // 30 POSTs to /api/incidents from one IP.
    for (let i = 0; i < 30; i++) {
      rateLimit(makeReq('/api/incidents', 'POST'));
    }
    // Same IP can still GET /api/state.
    expect(rateLimit(makeReq('/api/state', 'GET'))).toBeNull();
    // Same IP POSTing to /api/incidents is blocked.
    expect(rateLimit(makeReq('/api/incidents', 'POST'))).not.toBeNull();
  });

  it('returns null for unknown IPs on the first request', () => {
    const req = new NextRequest('http://localhost/api/state');
    // No x-forwarded-for header — should still work (defaults to 'unknown').
    expect(rateLimit(req)).toBeNull();
  });
});
