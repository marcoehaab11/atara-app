import { describe, expect, it } from 'vitest';
import { canPour, hasUsefulMove, isComplete, isWon, pour, topRun } from '../src/core/rules';
import { solve, stateKey } from '../src/core/solver';
import { levelInfo } from '../src/core/difficulty';
import { identifyLayers, hiddenFraction, revealLayers, selectHidden } from '../src/core/hidden';
import { cleanShopName, validateShopName } from '../src/core/shopName';
import { dailyParameters, dailySeed } from '../src/core/daily';
import { pileLayout } from '../src/core/piles';
import { orderGuard, orderStatus, chooseOrder } from '../src/core/orders';
import { mulberry32, shuffle } from '../src/core/rng';
import { starsForMoves, optimalPar } from '../src/core/stars';
import type { State } from '../src/core/types';

describe('pour rules', () => {
  it('moves the contiguous top run, capped by target space, without mutating input', () => {
    const start = [[0, 1, 1], [2, 1, 1], []];
    expect(pour(start, 0, 1)).toEqual({ state: [[0, 1], [2, 1, 1, 1], []], moved: 1 });
    expect(pour(start, 0, 2)).toEqual({ state: [[0], [2, 1, 1], [1, 1]], moved: 2 });
    expect(start).toEqual([[0, 1, 1], [2, 1, 1], []]);
  });
  it('rejects mismatches, same vessel, empty or sealed sources, full targets and invalid indices', () => {
    const s = [[0, 1], [2], [], [1, 1, 1, 1]];
    for (const [a, b] of [[0, 1], [0, 0], [2, 0], [3, 2], [0, 3], [-1, 2], [0, 9], [0.5, 2]]) {
      expect(canPour(s, a, b)).toBe(false);
      expect(() => pour(s, a, b)).toThrow();
    }
  });
  it('recognizes complete and winning boards, not partial uniform jars', () => {
    expect(isComplete([0, 0, 0])).toBe(false);
    expect(isWon([[0, 0, 0, 0], [], [1, 1, 1, 1]])).toBe(true);
    expect(isWon([[0, 0], []])).toBe(false);
    expect(topRun([])).toEqual({ spice: undefined, count: 0 });
    expect(hasUsefulMove([[0, 0], []])).toBe(false);
    expect(hasUsefulMove([[0, 1], []])).toBe(true);
  });
});

describe('solver', () => {
  const start = [[0, 1, 0, 1], [1, 0, 1, 0], [], []];
  it('returns a legal winning path', () => {
    const result = solve(start, 15_000);
    expect(result.path).not.toBeNull();
    const end = result.path!.reduce<State>((s, m) => pour(s, ...m).state, start);
    expect(isWon(end)).toBe(true);
  });
  it('distinguishes timeout from proven impossible and already won', () => {
    expect(solve(start, 0)).toEqual({ path: null, nodes: 0, unsolvable: false });
    expect(solve([[0, 1, 0, 1], [1, 0, 1, 0]], 100).unsolvable).toBe(true);
    expect(solve([[0, 0, 0, 0], []], 0).path).toEqual([]);
    expect(() => solve(start, -1)).toThrow();
  });
  it('uses vessel symmetry and respects constrained order searches', () => {
    expect(stateKey(start)).toBe(stateKey([...start].reverse()));
    const s = [[0, 1, 0, 1], [1, 0, 1, 0], [2, 3, 2, 3], [3, 2, 3, 2], [], []];
    const order = chooseOrder(s, 7);
    expect(order).not.toBeNull();
    const guard = orderGuard(order!);
    const result = solve(s, 15_000, guard);
    expect(result.path).not.toBeNull();
    let state: State = s;
    for (const move of result.path!) { state = pour(state, ...move).state; expect(guard(state)).toBe(true); }
    expect(isWon(state)).toBe(true);
    expect(solve([[2, 2, 2, 2]], 100, orderGuard([0, 1])).unsolvable).toBe(true);
  });
});

describe('difficulty and randomness', () => {
  it.each([[1, 'tutorial', 2], [2, 'tutorial', 3], [3, 'normal', 4], [5, 'hard', 5], [6, 'rest', 4], [10, 'hard', 7], [21, 'rest', 9], [100, 'hard', 10]])('level %i has expected type/count', (l, type, spices) => {
    expect(levelInfo(l as number)).toMatchObject({ type, spices });
  });
  it('cycles worlds and validates levels', () => {
    expect(levelInfo(21)).toMatchObject({ world: 1, chapter: 2 });
    expect(levelInfo(61)).toMatchObject({ world: 0, chapter: 4 });
    expect(() => levelInfo(0)).toThrow();
  });
  it('matches the known Mulberry32 sequence and wraps seeds to int32', () => {
    const r = mulberry32(1);
    expect(r()).toBe(0.6270739405881613);
    expect(r()).toBe(0.002735721180215478);
    expect(mulberry32(1 + 2 ** 32)()).toBe(mulberry32(1)());
    expect(shuffle([0, 1, 2, 3], mulberry32(11)).sort()).toEqual([0, 1, 2, 3]);
  });
});

describe('hidden identities and orders', () => {
  it('reveals moved layers and newly exposed tops; undo keeps discoveries, restart restores hiding', () => {
    const ids = identifyLayers([[0, 1, 1, 1], [0, 0, 0], []]);
    expect(ids.spices).toEqual([0, 1, 1, 1, 0, 0, 0]);
    const initial = selectHidden(ids.vessels, 12, 1);
    expect([...initial]).toEqual([0, 1, 2, 4, 5]);
    const revealed = revealLayers(initial, [[0], [4, 5, 6], [3, 2, 1]], [3, 2, 1]);
    expect([...revealed]).toEqual([4, 5]);
    expect([...revealLayers(revealed, ids.vessels)]).toEqual([4, 5]);
    expect([...revealLayers(initial, ids.vessels)]).toEqual([0, 1, 2, 4, 5]);
  });
  it('applies hidden start, rest exclusions and hard fraction', () => {
    expect(hiddenFraction(11, 'normal')).toBe(0);
    expect(hiddenFraction(12, 'normal')).toBe(0.4);
    expect(hiddenFraction(16, 'rest')).toBe(0);
    expect(hiddenFraction(15, 'hard')).toBe(1);
    expect(hiddenFraction(100, 'normal')).toBe(0.9);
  });
  it('recomputes missed orders after undo but keeps granted rewards sticky', () => {
    expect(orderStatus([[2, 2, 2, 2]], [0, 1], false)).toBe('missed');
    expect(orderStatus([[2, 2, 2], [2]], [0, 1], false)).toBe('waiting');
    expect(orderStatus([], [0, 1], true)).toBe('delivered');
    expect(orderStatus([[0, 0, 0, 0], [1, 1, 1, 1]], [0, 1], false)).toBe('delivered');
  });
});

describe('daily seed, piles, names and stars', () => {
  it('uses local calendar date at both ends of the day, including leap/year boundaries', () => {
    expect(dailySeed(new Date(2026, 8, 28, 0, 1))).toBe(20260928);
    expect(dailySeed(new Date(2026, 8, 28, 23, 59))).toBe(20260928);
    expect(dailySeed(new Date(2024, 1, 29))).toBe(20240229);
    expect(dailySeed(new Date(2027, 0, 1))).toBe(20270101);
    expect(dailyParameters(new Date(2026, 8, 28, 0))).toEqual(dailyParameters(new Date(2026, 8, 28, 23)));
    expect(() => dailySeed(new Date(NaN))).toThrow();
  });
  it('keeps pile layouts stable when a layer moves and scales size without changing positions', () => {
    const a = pileLayout(7, 30, 2, 20), b = pileLayout(7, 30, 2, 40);
    expect(a).toHaveLength(8);
    expect(a).toEqual(pileLayout(7, 30, 2, 20));
    expect(a).not.toEqual(pileLayout(8, 30, 2, 20));
    a.forEach((p, i) => { expect(b[i]).toEqual({ ...p, size: p.size * 2 }); expect(Math.abs(p.rotation)).toBeLessThanOrEqual(90); });
  });
  it('cleans Arabic prefixes and spaces without stripping part of another word', () => {
    expect(cleanShopName('  عطاره   أبو   الدهب  ')).toBe('أبو الدهب');
    expect(cleanShopName('عطارةالخير')).toBe('عطارةالخير');
    expect(validateShopName('عطارة البركة').error).toBeNull();
    expect(validateShopName('Café 123').error).toBeNull();
  });
  it.each([['ا', 'short'], ['ا'.repeat(19), 'long'], ['محل🔥', 'chars'], ['Hello!', 'chars'], ['中文', 'chars'], ['محل\u200f', 'chars']])('rejects invalid name %s', (name, error) => {
    expect(validateShopName(name).error).toBe(`name.err.${error}`);
  });
  it('awards stars at exact boundaries', () => {
    expect(starsForMoves(10, 10)).toBe(3);
    expect(starsForMoves(14, 10)).toBe(2);
    expect(starsForMoves(15, 10)).toBe(1);
    expect(optimalPar(10)).toBe(12);
  });
});
