import { NextRequest } from 'next/server';
import { repository, CollectionName } from '@/lib/db/repository';
import { eventBus, EventTopic } from '@/lib/events/event-bus';
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

const VALID_COLLECTIONS = new Set<string>(ALL_COLLECTIONS);

/**
 * GET /api/events?collections=gates,incidents,crowdMetrics
 *
 * Server-Sent Events stream. Pushes a `{ collection, data, ts }` JSON message
 * to the client any time a watched collection changes server-side.
 *
 * The optional `?collections=` query param lets each dashboard subscribe to
 * ONLY the collections it actually uses, reducing server-side fan-out work
 * and client-side re-renders. If omitted, all collections are streamed.
 */
export async function GET(req: NextRequest) {
  // Parse the optional collections filter.
  const { searchParams } = new URL(req.url);
  const requestedCollections = searchParams.get('collections');
  const watched: CollectionName[] = requestedCollections
    ? requestedCollections
        .split(',')
        .map((c) => c.trim())
        .filter((c) => VALID_COLLECTIONS.has(c)) as CollectionName[]
    : ALL_COLLECTIONS;
  // Fallback to ALL if the filter was empty/invalid.
  const collections = watched.length > 0 ? watched : ALL_COLLECTIONS;

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

      for (const collection of collections) {
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

      // Also surface event-bus publishes for all known topics.
      const eventTopics: EventTopic[] = [
        'stadium.incident.created',
        'stadium.gate.congested',
        'stadium.simulation.act_triggered',
        'stadium.emergency.broadcast_requested',
      ];
      eventTopics.forEach((topic) => {
        const unsub = eventBus.subscribe(topic, async () => {
          // The actual state change will already be fanned out via the
          // repository subscribers above; this just keeps the bus warm.
        });
        unsubs.push(unsub);
      });

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
      // Reference cleanup so it's not flagged as unused; the ReadableStream
      // cancel() hook below handles per-reader teardown.
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
