'use client';

import { useEffect, useRef, useState } from 'react';
import type {
  SeedDatabase,
} from '@/lib/db/seed-data';

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
 * instead of importing the server-only repository directly — that's what
 * fixes the per-tab state divergence bug called out in the audit.
 *
 * The hook is single-tab-idempotent: multiple components in the same tab
 * share one underlying SSE connection via a module-level singleton.
 */
export function useStadiumState(): UseStadiumStateResult {
  const [state, setState] = useState<SeedDatabase>(EMPTY_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const refreshRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const res = await fetch('/api/state', { cache: 'no-store' });
        const json = await res.json();
        if (!cancelled && json.success) {
          setState(json.data);
          setLastUpdate(Date.now());
        }
      } catch (err) {
        console.error('[useStadiumState] refresh failed:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    refreshRef.current = refresh;

    // Initial snapshot
    refresh();

    // Live SSE subscription
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/events');
      const handleUpdate = (ev: MessageEvent) => {
        try {
          const payload = JSON.parse(ev.data);
          if (payload.collection && payload.data) {
            setState((prev) => ({ ...prev, [payload.collection]: payload.data }));
            setLastUpdate(Date.now());
          }
        } catch {
          /* ignore parse errors on heartbeats */
        }
      };
      const COLLECTIONS = [
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
      COLLECTIONS.forEach((c) => es?.addEventListener(c, handleUpdate as EventListener));
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
  }, []);

  return { state, isLoading, lastUpdate, refresh: () => refreshRef.current() };
}
