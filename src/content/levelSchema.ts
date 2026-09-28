import { CAP, EMPTY_VESSELS, GENERATION, ORDERS } from '../config';
import { levelInfo } from '../core/difficulty';
import { hiddenFraction, identifyLayers, selectHidden } from '../core/hidden';
import { isComplete } from '../core/rules';
import type { LevelType, Order, State } from '../core/types';

export type PackedType = 'tut' | 'normal' | 'hard' | 'rest';
export interface PackedLevel {
  l: number; t: PackedType; n: number; vs: number[][]; hid: number[];
  par: number; ord: Order | null; w: number;
}
export interface LevelFile { v: 1; levels: PackedLevel[] }
export const packType = (type: LevelType): PackedType => type === 'tutorial' ? 'tut' : type;
export const unpackType = (type: PackedType): LevelType => type === 'tut' ? 'tutorial' : type;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function integers(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(x => Number.isSafeInteger(x));
}
/** Validate data once when creating a loader; never repeat it on every lookup. */
export function validateLevelFile(input: unknown, expectedCount: number): asserts input is LevelFile {
  if (!Number.isSafeInteger(expectedCount) || expectedCount < 1) throw new RangeError('Invalid level count');
  if (!record(input) || input.v !== 1 || !Array.isArray(input.levels) || input.levels.length !== expectedCount) throw new Error('Invalid level file header');
  input.levels.forEach((row: unknown, index: number) => {
    const fail = () => { throw new Error(`Invalid level record ${index + 1}`); };
    if (!record(row) || row.l !== index + 1) return fail();
    const info = levelInfo(index + 1);
    if (row.t !== packType(info.type) || row.n !== info.spices || row.w !== info.world || !Number.isSafeInteger(row.par) || (row.par as number) < 1) return fail();
    if (!Array.isArray(row.vs) || !row.vs.every(v => integers(v) && (v.length === 0 || v.length === CAP) && v.every(x => x >= 0 && x < GENERATION.maxSpices))) return fail();
    const vessels = row.vs as number[][];
    const emptyCount = vessels.filter(v => v.length === 0).length;
    if ((emptyCount !== EMPTY_VESSELS && emptyCount !== GENERATION.fallbackEmpties) || vessels.length !== info.spices + emptyCount || vessels.some(isComplete)) return fail();
    const counts = new Map<number, number>();
    vessels.flat().forEach(x => counts.set(x, (counts.get(x) ?? 0) + 1));
    if (counts.size !== info.spices || [...counts.values()].some(x => x !== CAP)) return fail();
    if (!integers(row.hid)) return fail();
    const layers = identifyLayers(vessels);
    const hidden = [...selectHidden(layers.vessels, index + 1, hiddenFraction(index + 1, info.type))];
    if (JSON.stringify(row.hid) !== JSON.stringify(hidden)) return fail();
    if (row.ord !== null && (!integers(row.ord) || row.ord.length !== 2 || row.ord[0] === row.ord[1] || !row.ord.every(x => counts.has(x)) || index + 1 < ORDERS.start || !['normal', 'hard'].includes(info.type))) return fail();
  });
}

export interface PlayableLevel {
  level: number; seed: number; type: LevelType; spiceCount: number;
  vessels: number[][]; layerVessels: number[][]; layerSpices: number[];
  hidden: number[]; par: number; order: Order | null; world: number;
  source: 'precomputed' | 'generated';
}
export function unpackLevel(row: PackedLevel): PlayableLevel {
  const vessels = row.vs.map(v => [...v]);
  const layers = identifyLayers(vessels);
  return { level: row.l, seed: row.l, type: unpackType(row.t), spiceCount: row.n,
    vessels, layerVessels: layers.vessels, layerSpices: layers.spices,
    hidden: [...row.hid], par: row.par, order: row.ord ? [...row.ord] : null,
    world: row.w, source: 'precomputed' };
}
/** Replay a certificate, failing closed rather than shipping an unverified level. */
export function assertBalancedState(state: State): void {
  if (state.some(v => v.length > CAP)) throw new Error('Vessel overflow');
  const flat = state.flat();
  for (const spice of new Set(flat)) if (flat.filter(x => x === spice).length !== CAP) throw new Error('Unbalanced spice');
}
