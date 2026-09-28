import { CAP, EMPTY_VESSELS, GENERATION, ORDERS } from '../config';
import { difficultyScore, levelInfo } from './difficulty';
import { hiddenFraction, identifyLayers, selectHidden } from './hidden';
import { chooseOrder } from './orders';
import { mulberry32, shuffle } from './rng';
import { isComplete } from './rules';
import { solve } from './solver';
import type { LevelType, Move, Order, State } from './types';

export function deal(n: number, random: () => number, empties = EMPTY_VESSELS): number[][] {
  if (!Number.isInteger(n) || n < 2 || n > GENERATION.maxSpices) throw new RangeError('Invalid spice count');
  const ids = shuffle(Array.from({ length: GENERATION.maxSpices }, (_, i) => i), random).slice(0, n);
  const pool = shuffle(ids.flatMap(id => Array<number>(CAP).fill(id)), random);
  return [...Array.from({ length: n }, (_, i) => pool.slice(i * CAP, (i + 1) * CAP)), ...Array.from({ length: empties }, () => [])];
}
export function adjacency(state: State): number {
  return state.reduce((total, v) => total + v.slice(1).filter((x, i) => x === v[i]).length, 0);
}
export interface GeneratedLevel {
  level: number; seed: number; type: LevelType; spiceCount: number;
  vessels: number[][]; layerVessels: number[][]; layerSpices: number[];
  hidden: number[]; solution: Move[]; par: number; order: Order | null;
  world: number; fallback: boolean; generationNodes: number;
}
export interface GenerationOptions { seed?: number; type?: LevelType; spices?: number; hidden?: number; orders?: boolean; world?: number }

export function generateLevel(level: number, options: GenerationOptions = {}): GeneratedLevel {
  const info = levelInfo(level);
  const seed = options.seed ?? level, type = options.type ?? info.type, n = options.spices ?? info.spices;
  if (!Number.isFinite(seed)) throw new RangeError('Invalid seed');
  const candidates: { vessels: number[][]; path: Move[]; score: number }[] = [];
  const K = GENERATION.candidates[type];
  let nodes = 0, fallback = false;
  for (let attempt = 0; attempt < K * GENERATION.attemptMultiplier && candidates.length < K && nodes < GENERATION.nodeBudget; attempt++) {
    const vessels = deal(n, mulberry32(seed * 7919 + attempt * 104729 + 13));
    if (vessels.some(isComplete) || adjacency(vessels) > Math.max(1, Math.floor(n / 2))) continue;
    const result = solve(vessels, Math.min(GENERATION.candidateLimit, GENERATION.nodeBudget - nodes));
    nodes += result.nodes;
    if (result.path) candidates.push({ vessels, path: result.path, score: difficultyScore(result.nodes, result.path.length) });
  }
  if (!candidates.length) {
    fallback = true;
    for (let attempt = 0; attempt < GENERATION.fallbackAttempts; attempt++) {
      const vessels = deal(n, mulberry32(seed * 131 + attempt), GENERATION.fallbackEmpties);
      // Closed starting vessels bypass order/intro semantics, so never emit them.
      if (vessels.some(isComplete)) continue;
      const result = solve(vessels, GENERATION.fallbackLimit);
      nodes += result.nodes;
      if (result.path) { candidates.push({ vessels, path: result.path, score: difficultyScore(result.nodes, result.path.length) }); break; }
    }
  }
  if (!candidates.length) throw new Error(`Generation exhausted for level ${level}, seed ${seed}`);
  candidates.sort((a, b) => a.score - b.score);
  const index = type === 'hard' ? candidates.length - 1 : type === 'normal' ? Math.floor((candidates.length - 1) * GENERATION.normalPercentile) : 0;
  const chosen = candidates[index];
  const layers = identifyLayers(chosen.vessels);
  const allowOrder = options.orders !== false && level >= ORDERS.start && (type === 'normal' || type === 'hard');
  return {
    level, seed, type, spiceCount: n, vessels: chosen.vessels, layerVessels: layers.vessels,
    layerSpices: layers.spices, hidden: [...selectHidden(layers.vessels, seed, options.hidden ?? hiddenFraction(level, type))],
    solution: chosen.path, par: chosen.path.length, order: allowOrder ? chooseOrder(chosen.vessels, seed) : null,
    world: options.world ?? info.world, fallback, generationNodes: nodes,
  };
}
