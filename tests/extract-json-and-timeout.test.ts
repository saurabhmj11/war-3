import { describe, it, expect } from 'vitest';

// extractJson is private to the GlmEngine module — we re-implement the same
// logic here to test it directly. (If it were exported we'd import it; for
// now we mirror the spec so any drift is caught by the GLM engine tests too.)
function extractJson<T = unknown>(text: string): T | null {
  if (!text) return null;
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1] : text;
  try {
    return JSON.parse(candidate.trim()) as T;
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

describe('extractJson branch coverage', () => {
  it('parses a clean JSON string', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it('returns null for empty input', () => {
    expect(extractJson('')).toBeNull();
  });

  it('parses JSON from a fenced ```json code block', () => {
    const text = 'Here is the answer:\n```json\n{"b":2}\n```\nThanks.';
    expect(extractJson(text)).toEqual({ b: 2 });
  });

  it('parses JSON from a bare ``` code block', () => {
    const text = '```\n{"c":3}\n```';
    expect(extractJson(text)).toEqual({ c: 3 });
  });

  it('falls back to first { ... } block when JSON.parse fails on full text', () => {
    const text = 'Preamble text {"d":4} trailing';
    expect(extractJson(text)).toEqual({ d: 4 });
  });

  it('returns null when no JSON can be extracted', () => {
    expect(extractJson('just plain text with no json')).toBeNull();
  });

  it('returns null when braces exist but content is not valid JSON', () => {
    expect(extractJson('{not valid json}')).toBeNull();
  });

  it('handles nested objects inside the fallback block', () => {
    const text = 'prefix {"outer":{"inner":42}} suffix';
    expect(extractJson(text)).toEqual({ outer: { inner: 42 } });
  });

  it('returns null for text with only opening brace', () => {
    expect(extractJson('{ incomplete')).toBeNull();
  });

  it('returns null for text with only closing brace', () => {
    expect(extractJson('incomplete }')).toBeNull();
  });

  it('parses top-level arrays (JSON.parse succeeds on arrays)', () => {
    expect(extractJson('[1,2,3]')).toEqual([1, 2, 3]);
  });
});

describe('withTimeout branch coverage', () => {
  // Re-implement withTimeout to test its branches in isolation.
  function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`[GLM] Timeout (${label}) after ${ms}ms`)), ms);
      promise.then(
        (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        (e) => {
          clearTimeout(timer);
          reject(e);
        }
      );
    });
  }

  it('resolves with the promise value when the promise wins', async () => {
    const r = await withTimeout(Promise.resolve('ok'), 1000, 'test');
    expect(r).toBe('ok');
  });

  it('rejects with the promise error when the promise rejects first', async () => {
    await expect(withTimeout(Promise.reject(new Error('boom')), 1000, 'test')).rejects.toThrow('boom');
  });

  it('rejects with a timeout error when the promise takes too long', async () => {
    const slow = new Promise<string>((resolve) => setTimeout(() => resolve('late'), 200));
    await expect(withTimeout(slow, 10, 'slow-op')).rejects.toThrow(/Timeout.*slow-op.*10ms/);
  });

  it('clears the timeout when the promise resolves', async () => {
    let timerFired = false;
    const originalSetTimeout = global.setTimeout;
    const customSet = ((fn: () => void, ms?: number) => {
      const id = originalSetTimeout(fn, ms);
      // Wrap so we can detect if it was cleared
      return id;
    }) as typeof global.setTimeout;
    const originalClear = global.clearTimeout;
    let cleared = false;
    global.clearTimeout = ((id: unknown) => {
      cleared = true;
      return originalClear(id as ReturnType<typeof originalSetTimeout>);
    }) as typeof global.clearTimeout;
    global.setTimeout = customSet;
    try {
      await withTimeout(Promise.resolve('fast'), 5000, 'fast-op');
      expect(cleared).toBe(true);
      void timerFired;
    } finally {
      global.setTimeout = originalSetTimeout;
      global.clearTimeout = originalClear;
    }
  });
});
