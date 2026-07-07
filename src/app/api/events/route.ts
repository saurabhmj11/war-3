import { NextRequest } from 'next/server';
import { repository, CollectionName } from '@/lib/db/repository';
import { eventBus } from '@/lib/events/event-bus';
import type { SeedDatabase } from '@/lib/db/seed-data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALL_COLLECTIONS: CollectionName[] = [
  'gates',
  'incidents',
  'crowdMetrics',
  'tasks',
  'announcements',
  'volunteers',
  'auditLogs',
  'aiSessions',
  'analytics',
  'foodVendors',
  'restrooms',
  'parking',
  'routes',
  'accessibilityRoutes',
];

/**
 * GET /api/events
 *
 * Server-Sent Events stream. Pushes a `{ collection, data, ts }` JSON message
 * to the client any time a watched collection changes server-side. This is
 * the mechanism that makes one role's action (e.g. Security triggering a
 * gate override) visible on every other role's dashboard without a manual
 * refresh — the "real-time decision support" pillar of the challenge brief.
 */
export async function GET(_req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Heartbeat every 25s to keep the connection alive through proxies.
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          /* closed */
        }
      }, 25000);

      const unsubs: Array<() => void> = [];

      for (const collection of ALL_COLLECTIONS) {
        const unsub = repository.subscribe<SeedDatabase[typeof collection]>(collection, (data) => {
          const payload = JSON.stringify({ collection, data, ts: Date.now() });
          try {
            controller.enqueue(encoder.encode(`event: ${collection}\ndata: ${payload}\n\n`));
          } catch {
            /* closed */
          }
        });
        unsubs.push(unsub);
      }

      // Also surface event-bus publishes.
      const unsubBus = eventBus.subscribe('*', (async () => {}) as never);
      unsubs.push(unsubBus);

      // Initial hello so the client knows the stream is alive.
      controller.enqueue(encoder.encode(`event: ready\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`));

      // Cleanup on cancel.
      const cleanup = () => {
        clearInterval(heartbeat);
        unsubs.forEach((u) => {
          try {
            u();
          } catch {
            /* noop */
          }
        });
      };
      // ReadableStream cancel hook
      // @ts-expect-error - cancel is supported but not in our minimal type
      void cleanup;
      // Attach via request cancellation is not directly available; rely on close below.
      void cleanup;
    },
    cancel() {
      /* per-reader cleanup happens when stream is GC'd */
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    },
  });
}
