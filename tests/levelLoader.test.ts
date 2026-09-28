import { describe, expect, it } from 'vitest';
import packed from '../src/content/levels.json';
import stats from '../docs/LEVEL_STATS.json';
import { createLevelLoader, loadLevel } from '../src/content/levelLoader';
import { validateLevelFile } from '../src/content/levelSchema';
import { generateLevel } from '../src/core/generator';
import { solve } from '../src/core/solver';
import { orderGuard } from '../src/core/orders';
import { verifyPath } from '../tools/precompute';
import { levelInfo } from '../src/core/difficulty';
import { hiddenFraction, selectHidden } from '../src/core/hidden';
import { optimalPar } from '../src/core/stars';

describe('precomputed level loader', () => {
  it('stores exactly the proven-optimal buffered par or the recorded DFS fallback', () => {
    expect(stats.records).toHaveLength(1000);
    for (const row of packed.levels) {
      const entry = stats.records[row.l - 1];
      expect(entry.level).toBe(row.l);
      expect(row.par).toBe(entry.optimalLength === null ? entry.dfsLength : optimalPar(entry.optimalLength));
      expect(entry.parSource).toBe(entry.optimalLength === null ? 'dfs' : 'optimal-plus-buffer');
      expect(entry.hasOrder).toBe(row.ord !== null);
    }
  });
  it('validates and loads all 1000 consecutive records and reconstructs layer identities', () => {
    expect(() => validateLevelFile(packed, 1000)).not.toThrow();
    const load = createLevelLoader(packed);
    for (let i = 1; i <= 1000; i++) {
      const actual = load(i), info = levelInfo(i), stored = packed.levels[i - 1];
      expect(actual).toMatchObject({ level: i, seed: i, type: info.type, spiceCount: info.spices, world: info.world, source: 'precomputed', par: stored.par });
      expect(actual.vessels).toEqual(stored.vs);
      expect(actual.order).toEqual(stored.ord);
      expect(actual.layerVessels.map(v => v.map(id => actual.layerSpices[id]))).toEqual(actual.vessels);
      expect(actual.hidden).toEqual([...selectHidden(actual.layerVessels, i, hiddenFraction(i, info.type))]);
    }
  });
  it('isolates cached content from mutable input and returned boards', () => {
    const input = structuredClone(packed), load = createLevelLoader(input);
    const before = load(1), mutated = load(1);
    mutated.vessels[0][0] = 99;
    mutated.layerVessels[0][0] = 99;
    mutated.layerSpices[0] = 99;
    mutated.hidden.push(99);
    input.levels[0].par = 999;
    input.levels[0].vs[0][0] = 99;
    expect(load(1)).toEqual(before);
    const withOrder = packed.levels.find(x => x.ord !== null)!;
    const first = load(withOrder.l), next = load(withOrder.l);
    expect(first.order).not.toBe(next.order);
  });
  it('generates level 1001 at runtime with the same algorithm and DFS par', () => {
    const runtime = loadLevel(1001), generated = generateLevel(1001);
    expect(runtime).toMatchObject({ source: 'generated', vessels: generated.vessels, par: generated.solution.length, hidden: generated.hidden, order: generated.order });
    verifyPath(runtime.vessels, generated.solution);
  }, 30_000);
  it.each([0, -1, 1.2, NaN, Infinity])('rejects invalid requested level %s', level => {
    expect(() => loadLevel(level)).toThrow('Invalid level');
  });
  it.each(['version', 'count', 'sequence', 'type', 'spices', 'layers', 'closed', 'hidden', 'par', 'order', 'world'])('rejects corrupted %s data', field => {
    const data = structuredClone(packed);
    switch (field) {
      case 'version': data.v = 2; break;
      case 'count': data.levels.pop(); break;
      case 'sequence': data.levels[0].l = 2; break;
      case 'type': data.levels[0].t = 'hard'; break;
      case 'spices': data.levels[0].vs[0][0] = 20; break;
      case 'layers': data.levels[0].vs[0].pop(); break;
      case 'closed': data.levels[0].vs[0] = [1, 1, 1, 1]; break;
      case 'hidden': data.levels[0].hid = [0]; break;
      case 'par': data.levels[0].par = 0; break;
      case 'order': data.levels[0].ord = [0, 1]; break;
      case 'world': data.levels[0].w = 1; break;
    }
    expect(() => createLevelLoader(data)).toThrow();
  });
  it('loads saved representative boards equal to seeded generation and replays their solutions', () => {
    for (const i of [1, 2, 7, 12, 21, 100, 499, 500, 501, 999, 1000]) {
      const actual = loadLevel(i), generated = generateLevel(i);
      expect(actual.vessels).toEqual(generated.vessels);
      expect(actual.hidden).toEqual(generated.hidden);
      expect(actual.order).toEqual(generated.order);
      verifyPath(actual.vessels, generated.solution);
      if (actual.order) {
        const guard = orderGuard(actual.order), result = solve(actual.vessels, 15_000, guard);
        expect(result.path).not.toBeNull();
        verifyPath(actual.vessels, result.path!, guard);
      }
    }
  }, 60_000);
});
