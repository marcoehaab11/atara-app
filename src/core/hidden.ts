import { HIDDEN } from '../config';
import { mulberry32 } from './rng';
import type { LevelType, State } from './types';

export function identifyLayers(state: State) {
  const spices: number[] = [];
  const vessels = state.map(v => v.map(spice => { const id = spices.length; spices.push(spice); return id; }));
  return { vessels, spices };
}
export function hiddenFraction(level: number, type: LevelType): number {
  if (level < HIDDEN.start || type === 'rest') return 0;
  return type === 'hard' ? 1 : Math.min(HIDDEN.max, HIDDEN.base + (level - HIDDEN.start) * HIDDEN.step);
}
/** Input contains layer IDs, not spice IDs. Consume one draw per nonempty eligible vessel. */
export function selectHidden(layerVessels: State, seed: number, fraction: number): Set<number> {
  const r = mulberry32(seed * 31 + 7);
  const hidden = new Set<number>();
  for (const vessel of layerVessels) {
    if (vessel.length > 1 && r() < fraction) vessel.slice(0, -1).forEach(id => hidden.add(id));
  }
  return hidden;
}
/** Pass the current hidden set after undo; pass the original set on restart. */
export function revealLayers(hidden: ReadonlySet<number>, vessels: State, moved: readonly number[] = []): Set<number> {
  const next = new Set(hidden);
  moved.forEach(id => next.delete(id));
  vessels.forEach(v => { const id = v.at(-1); if (id !== undefined) next.delete(id); });
  return next;
}
