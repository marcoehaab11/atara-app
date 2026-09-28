import { describe, expect, it } from 'vitest';
import { generateLevel, deal } from '../src/core/generator';
import { generateDaily } from '../src/core/daily';
import { mulberry32 } from '../src/core/rng';
import { canPour, isComplete, isWon, pour } from '../src/core/rules';
import { solve } from '../src/core/solver';
import { orderGuard } from '../src/core/orders';
import type { State } from '../src/core/types';

describe('level generation', () => {
  it('deals exactly four of each spice and appends empties once', () => {
    const s = deal(4, mulberry32(1));
    expect(s).toHaveLength(6);
    expect(s.filter(v => !v.length)).toHaveLength(2);
    for (const id of new Set(s.flat())) expect(s.flat().filter(x => x === id)).toHaveLength(4);
  });
  it('reproduces all generated metadata for the same seed', () => {
    expect(generateLevel(12)).toEqual(generateLevel(12));
  }, 30_000);
  it('generates a repeatable daily with no orders', () => {
    const day = new Date(2026, 8, 28);
    const level = generateDaily(day);
    expect(level).toEqual(generateDaily(day));
    expect(level.order).toBeNull();
    expect(level.spiceCount).toBeGreaterThanOrEqual(7);
    expect(level.spiceCount).toBeLessThanOrEqual(9);
  }, 30_000);
  it('first 100 levels have legal winning paths, balanced spices, feasible orders and valid hidden IDs', () => {
    for (let l = 1; l <= 100; l++) {
      const level = generateLevel(l);
      expect(level.vessels, `level ${l}`).toHaveLength(level.spiceCount + (level.fallback ? 3 : 2));
      expect(level.vessels.some(isComplete)).toBe(false);
      for (const spice of new Set(level.vessels.flat())) expect(level.vessels.flat().filter(x => x === spice)).toHaveLength(4);
      let state: State = level.vessels;
      for (const move of level.solution) { expect(canPour(state, ...move), `level ${l}`).toBe(true); state = pour(state, ...move).state; }
      expect(isWon(state), `level ${l}`).toBe(true);
      expect(level.par).toBe(level.solution.length);
      expect(new Set(level.layerVessels.flat()).size).toBe(level.spiceCount * 4);
      for (const id of level.hidden) { expect(level.layerSpices[id]).toBeDefined(); expect(level.layerVessels.some(v => v.at(-1) === id)).toBe(false); }
      if (l < 12 || level.type === 'rest') expect(level.hidden).toEqual([]);
      if (level.order) {
        const guard = orderGuard(level.order), result = solve(level.vessels, 15_000, guard);
        expect(result.path, `order ${l}`).not.toBeNull();
        let ordered: State = level.vessels;
        for (const move of result.path!) { ordered = pour(ordered, ...move).state; expect(guard(ordered)).toBe(true); }
        expect(isWon(ordered)).toBe(true);
      }
    }
  }, 180_000);
});
