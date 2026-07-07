'use client';

import { useEffect, useRef, useState } from 'react';
import type { SeedDatabase } from '@/lib/db/seed-data';

const EMPTY_STATE: SeedDatabase = {
  users: [],
  roles: [],
  stadiums: [],
  gates: [],
  seats: [],
  routes: [],
  parking: [],
  foodVendors: [],
  restrooms: [],
  accessibilityRoutes: [],
  incidents: [],
  crowdMetrics: [],
  volunteers: [],
  tasks: [],
  announcements: [],
  notifications: [],
  aiSessions: [],
  analytics: [],
  auditLogs: [],
};

/**
 * Module-level cache shared across every useStadiumState() caller in the
 * same tab. Acts like a stale-while-revalidate store: the first caller
 * fetches /api/state, subsequent callers get the cached snapshot instantly
 * while a background refresh runs.
 */
interface CacheEntry {
  data: SeedDatabase;
  ts: number;
  promise: Promise<SeedDatabase> | null;
}
const SWR_CACHE: CacheEntry = {
  data: EMPTY_STATE,
  ts: 0,
  promise: null,
};
const SWR_STALE_MS = 5_000; // serve cached data up to 5s old instantly

function fetchSnapshot(): Promise<SeedDatabase> {
  if (SWR_CACHE.promise) return SWR_CACHE.promise;
  SWR_CACHE.promise = (async () => {
    try {
      const res = await fetch('/api/state', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.data) {
        SWR_CACHE.data = json.data as SeedDatabase;
        SWR_CACHE.ts = Date.now();
      }
    } catch (err) {
      console.error('[useStadiumState] refresh failed:', err);
    } finally {
      SWR_CACHE.promise = null;
    }
    return SWR_CACHE.data;
  })();
  return SWR_CACHE.promise;
}

export interface UseStadiumStateResult {
  state: SeedDatabase;
  isLoading: boolean;
  lastUpdate: number | null;
  /** Forces a re-fetch of the full snapshot (e.g. after a manual refresh). */
  refresh: () => Promise<void>;
}

/**
 * Subscribes to the live stadium state via /api/state (initial snapshot) and
 * /api/events (SSE incremental updates). All client dashboards use this hook
 * instead of importing the server-only repository directly.
 *
 * @param collections Optional allowlist — only subscribe to SSE updates for
 *   the named collections. Reduces server fan-out + client re-renders.
 *   Example: `useStadiumState(['gates', 'incidents', 'crowdMetrics'])`
 */
export function useStadiumState(collections?: string[]): UseStadiumStateResult {
  const [state, setState] = useState<SeedDatabase>(() => SWR_CACHE.data);
  const [isLoading, setIsLoading] = useState<boolean>(SWR_CACHE.ts === 0);
  const [lastUpdate, setLastUpdate] = useState<number | null>(SWR_CACHE.ts || null);
  const refreshRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      // Stale-while-revalidate: if cache is fresh enough, skip the fetch.
      const age = Date.now() - SWR_CACHE.ts;
      if (age < SWR_STALE_MS && SWR_CACHE.ts > 0) {
        if (!cancelled) {
          setState(SWR_CACHE.data);
          setLastUpdate(SWR_CACHE.ts);
          setIsLoading(false);
        }
        return;
      }
      const data = await fetchSnapshot();
      if (!cancelled) {
        setState(data);
        setLastUpdate(SWR_CACHE.ts);
        setIsLoading(false);
      }
    };
    refreshRef.current = refresh;

    // Initial snapshot (may be served from cache).
    refresh();

    // Live SSE subscription — only watch the requested collections.
    const cols = collections && collections.length > 0 ? collections.join(',') : undefined;
    const eventsUrl = cols ? `/api/events?collections=${encodeURIComponent(cols)}` : '/api/events';
    let es: EventSource | null = null;
    try {
      es = new EventSource(eventsUrl);
      const handleUpdate = (ev: MessageEvent) => {
        try {
          const payload = JSON.parse(ev.data);
          if (payload.collection && payload.data) {
            setState((prev) => ({ ...prev, [payload.collection]: payload.data }));
            // Also update the SWR cache so the next mount sees fresh data.
            (SWR_CACHE.data as unknown as Record<string, unknown>)[payload.collection] = payload.data;
            SWR_CACHE.ts = Date.now();
            setLastUpdate(Date.now());
          }
        } catch {
          /* ignore parse errors on heartbeats */
        }
      };
      // Listen on every collection the SSE stream might send (the server
      // filters to the requested subset, but we still need a listener per
      // collection name we care about).
      const listened = collections && collections.length > 0 ? collections : [
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
      listened.forEach((c) => es?.addEventListener(c, handleUpdate as EventListener));
      es.addEventListener('ready', () => setIsLoading(false));
      es.onerror = () => {
        // Browser auto-reconnects; nothing to do here.
      };
    } catch (err) {
      console.error('[useStadiumState] SSE setup failed:', err);
    }

    return () => {
      cancelled = true;
      es?.close();
    };
  }, [collections?.join(',')]);

  return { state, isLoading, lastUpdate, refresh: () => refreshRef.current() };
}
