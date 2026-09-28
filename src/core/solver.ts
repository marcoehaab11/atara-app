import { CAP } from '../config';
import { isComplete, isWon, pour, topRun } from './rules';
import type { Move, State } from './types';

export interface SolveResult { path: Move[] | null; nodes: number; unsolvable: boolean }
export const stateKey = (s: State) => s.map(v => v.join(',')).sort().join('|');

/** Symmetry pruning is valid for guards invariant under vessel permutation (orders). */
function rankedMoves(s: State): Move[] {
  const firstEmpty = s.findIndex(v => !v.length);
  const moves: { score: number; move: Move }[] = [];
  for (let a = 0; a < s.length; a++) {
    const A = s[a];
    if (!A.length || isComplete(A)) continue;
    const t = topRun(A);
    for (let b = 0; b < s.length; b++) {
      const B = s[b];
      if (a === b || B.length >= CAP) continue;
      if (!B.length) {
        if (t.count !== A.length && b === firstEmpty) moves.push({ score: 1, move: [a, b] });
        continue;
      }
      if (B.at(-1) !== t.spice) continue;
      const m = Math.min(t.count, CAP - B.length);
      const score = 3 + (m === t.count ? 2 : 0) + (B.length + m === CAP && B.every(x => x === t.spice) ? 3 : 0);
      moves.push({ score, move: [a, b] });
    }
  }
  return moves.sort((a, b) => b.score - a.score).map(x => x.move);
}

/** Iterative DFS preserves the reference ordering without recursive stack overflow. */
export function solve(start: State, limit: number, guard?: (s: State) => boolean): SolveResult {
  if (!Number.isSafeInteger(limit) || limit < 0) throw new RangeError('Invalid node limit');
  if (guard && !guard(start)) return { path: null, nodes: 0, unsolvable: true };
  if (isWon(start)) return { path: [], nodes: 0, unsolvable: false };
  const seen = new Set<string>();
  const path: Move[] = [];
  const stack: { state: State; moves: Move[]; next: number }[] = [];
  let nodes = 0;
  const enter = (state: State): 'win' | 'abort' | 'seen' | 'entered' => {
    if (isWon(state)) return 'win';
    if (nodes >= limit) return 'abort';
    nodes++;
    const key = stateKey(state);
    if (seen.has(key)) return 'seen';
    seen.add(key);
    stack.push({ state, moves: rankedMoves(state), next: 0 });
    return 'entered';
  };
  if (enter(start) === 'abort') return { path: null, nodes, unsolvable: false };
  while (stack.length) {
    const frame = stack[stack.length - 1];
    if (frame.next >= frame.moves.length) {
      stack.pop();
      if (path.length) path.pop();
      continue;
    }
    const move = frame.moves[frame.next++];
    const state = pour(frame.state, ...move).state;
    if (guard && !guard(state)) continue;
    path.push(move);
    const result = enter(state);
    if (result === 'win') return { path: [...path], nodes, unsolvable: false };
    if (result === 'abort') return { path: null, nodes, unsolvable: false };
    if (result === 'seen') path.pop();
  }
  return { path: null, nodes, unsolvable: true };
}
