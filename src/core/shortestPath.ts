import { PRECOMPUTE } from '../config';
import { canPour, isWon, pour } from './rules';
import { stateKey } from './solver';
import type { Move, State } from './types';

export interface SearchBudget {
  maxNodes: number;
  maxStates: number;
  timeMs: number;
  now?: () => number;
}
export interface ShortestResult {
  path: Move[] | null;
  nodes: number;
  states: number;
  reason: 'solved' | 'exhausted' | 'node-limit' | 'state-limit' | 'time-limit';
}

/** Every legal edge costs one pour. BFS proves optimality on first discovery.
 * Vessel permutations have identical futures; only their first representative
 * is queued. We store actual vessel indices on each parent edge for replay.
 * No heuristic move pruning is needed or used here.
 */
export function shortestPath(start: State, budget: SearchBudget = {
  maxNodes: PRECOMPUTE.searchNodes, maxStates: PRECOMPUTE.searchStates,
  timeMs: PRECOMPUTE.searchTimeMs,
}): ShortestResult {
  if (!Number.isSafeInteger(budget.maxNodes) || budget.maxNodes < 0 ||
      !Number.isSafeInteger(budget.maxStates) || budget.maxStates < 1 ||
      !Number.isFinite(budget.timeMs) || budget.timeMs < 0) throw new RangeError('Invalid search budget');
  if (isWon(start)) return { path: [], nodes: 0, states: 1, reason: 'solved' };
  const now = budget.now ?? (() => performance.now());
  const deadline = now() + budget.timeMs;
  const queue: { state: State; parent: number; move: Move | null }[] = [{ state: start, parent: -1, move: null }];
  const seen = new Set([stateKey(start)]);
  let head = 0, nodes = 0;
  const stopped = (reason: ShortestResult['reason']): ShortestResult => ({ path: null, nodes, states: queue.length, reason });
  while (head < queue.length) {
    if (now() >= deadline) return stopped('time-limit');
    if (nodes >= budget.maxNodes) return stopped('node-limit');
    const index = head++, frame = queue[index];
    nodes++;
    for (let a = 0; a < frame.state.length; a++) {
      if (now() >= deadline) return stopped('time-limit');
      for (let b = 0; b < frame.state.length; b++) {
        if (!canPour(frame.state, a, b)) continue;
        const state = pour(frame.state, a, b).state;
        const key = stateKey(state);
        if (seen.has(key)) continue;
        const move: Move = [a, b];
        if (isWon(state)) {
          const path: Move[] = [move];
          for (let i = index; queue[i].parent !== -1; i = queue[i].parent) path.push(queue[i].move!);
          path.reverse();
          return { path, nodes, states: queue.length, reason: 'solved' };
        }
        if (queue.length >= budget.maxStates) return stopped('state-limit');
        seen.add(key);
        queue.push({ state, parent: index, move });
      }
    }
  }
  return stopped('exhausted');
}
