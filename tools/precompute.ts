import { generateLevel } from '../src/core/generator';
import { isWon, pour } from '../src/core/rules';
import { orderGuard } from '../src/core/orders';
import { solve } from '../src/core/solver';
import { shortestPath } from '../src/core/shortestPath';
import { optimalPar } from '../src/core/stars';
import { ORDERS, PRECOMPUTE } from '../src/config';
import { assertBalancedState, packType, validateLevelFile } from '../src/content/levelSchema';
import type { LevelFile, PackedLevel } from '../src/content/levelSchema';
import type { Move, State } from '../src/core/types';

export { PRECOMPUTE };
export function verifyPath(start: State, path: readonly Move[], guard?: (s: State) => boolean): void {
  let state = start;
  if (guard && !guard(state)) throw new Error('Invalid initial order state');
  for (const move of path) {
    state = pour(state, ...move).state;
    assertBalancedState(state);
    if (guard && !guard(state)) throw new Error('Order certificate violates completion order');
  }
  if (!isWon(state)) throw new Error('Certificate does not solve the level');
}

export function precomputeOne(level: number) {
  const start = performance.now();
  const generated = generateLevel(level);
  const generationMs = performance.now() - start;
  verifyPath(generated.vessels, generated.solution);
  if (generated.order) {
    const guard = orderGuard(generated.order);
    const constrained = solve(generated.vessels, ORDERS.limit, guard);
    if (!constrained.path) throw new Error(`Unverified order at ${level}`);
    verifyPath(generated.vessels, constrained.path, guard);
  }
  const searchStart = performance.now();
  const shortest = shortestPath(generated.vessels);
  const searchMs = performance.now() - searchStart;
  if (shortest.path) verifyPath(generated.vessels, shortest.path);
  const par = shortest.path ? optimalPar(shortest.path.length) : generated.solution.length;
  const row: PackedLevel = { l: level, t: packType(generated.type), n: generated.spiceCount,
    vs: generated.vessels, hid: generated.hidden, par, ord: generated.order, w: generated.world };
  return { row, stats: {
    level, type: generated.type, spices: generated.spiceCount, par,
    dfsLength: generated.solution.length, optimalLength: shortest.path?.length ?? null,
    parSource: shortest.path ? 'optimal-plus-buffer' : 'dfs',
    searchReason: shortest.reason, searchNodes: shortest.nodes, searchStates: shortest.states,
    generationNodes: generated.generationNodes, fallback: generated.fallback, hasOrder: generated.order !== null,
    generationMs, searchMs, totalMs: performance.now() - start,
  } };
}
export function validateOutput(input: unknown): asserts input is LevelFile {
  validateLevelFile(input, PRECOMPUTE.levels);
}
