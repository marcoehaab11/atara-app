import { describe, expect, it } from 'vitest';
import { shortestPath } from '../src/core/shortestPath';
import { canPour, isWon, pour } from '../src/core/rules';
import { verifyPath } from '../tools/precompute';
import type { State } from '../src/core/types';

// Independent reference: indexed states, no symmetry reduction or pruning.
function referenceLength(start: State): number | null {
  const queue = [{ state: start, depth: 0 }];
  const seen = new Set([JSON.stringify(start)]);
  for (let i = 0; i < queue.length; i++) {
    const { state, depth } = queue[i];
    if (isWon(state)) return depth;
    for (let a = 0; a < state.length; a++) for (let b = 0; b < state.length; b++) {
      if (!canPour(state, a, b)) continue;
      const next = pour(state, a, b).state, key = JSON.stringify(next);
      if (!seen.has(key)) { seen.add(key); queue.push({ state: next, depth: depth + 1 }); }
    }
  }
  return null;
}
const budget = { maxNodes: 20_000, maxStates: 50_000, timeMs: 1000, now: () => 0 };
describe('bounded shortest-path search', () => {
  it('agrees with an independent BFS for all 70 two-spice starting deals', () => {
    let checked = 0;
    for (let mask = 0; mask < 256; mask++) {
      const layers = Array.from({ length: 8 }, (_, i) => (mask >>> i) & 1);
      if (layers.filter(x => x === 1).length !== 4) continue;
      const start = [layers.slice(0, 4), layers.slice(4), [], []];
      const result = shortestPath(start, budget);
      expect(result.reason).toBe('solved');
      expect(result.path!.length).toBe(referenceLength(start));
      verifyPath(start, result.path!);
      checked++;
    }
    expect(checked).toBe(70);
  });
  it('returns explicit bounded outcomes without claiming optimality', () => {
    const start = [[0, 1, 0, 1], [1, 0, 1, 0], [], []];
    expect(shortestPath(start, { ...budget, maxNodes: 0 })).toMatchObject({ path: null, reason: 'node-limit', nodes: 0 });
    expect(shortestPath(start, { ...budget, maxStates: 1 })).toMatchObject({ path: null, reason: 'state-limit', states: 1 });
    expect(shortestPath(start, { ...budget, timeMs: 0 })).toMatchObject({ path: null, reason: 'time-limit' });
    let clock = 0;
    expect(shortestPath(start, { ...budget, timeMs: 2, now: () => clock++ })).toMatchObject({ path: null, reason: 'time-limit' });
  });
  it('handles exhausted, solved and invalid searches', () => {
    expect(shortestPath([[0, 1, 0, 1], [1, 0, 1, 0]], budget)).toMatchObject({ reason: 'exhausted', path: null });
    expect(shortestPath([[0, 0, 0, 0], []], budget)).toMatchObject({ reason: 'solved', path: [] });
    expect(() => shortestPath([], { ...budget, maxStates: 0 })).toThrow();
    expect(() => shortestPath([], { ...budget, timeMs: -1 })).toThrow();
  });
  it('rejects broken solution certificates instead of publishing them', () => {
    const start = [[0, 1, 0, 1], [1, 0, 1, 0], [], []];
    expect(() => verifyPath(start, [])).toThrow('does not solve');
    expect(() => verifyPath(start, [[0, 1]])).toThrow('Illegal pour');
    expect(() => verifyPath(start, [], () => false)).toThrow('initial order');
  });
});
