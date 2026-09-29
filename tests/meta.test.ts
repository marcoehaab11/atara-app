import { describe, expect, it } from 'vitest';
import { newPlayer, readPlayer } from '../src/meta/player';
import { buyDecoration } from '../src/meta/shop';
import { activeTheme } from '../src/meta/themes';
import { GameSession } from '../src/core/session';
import { loadLevel } from '../src/content/levelLoader';
import { identifyLayers } from '../src/core/hidden';
import { settleOrder } from '../src/meta/orderReward';
import { orderStatus } from '../src/core/orders';
import { solve } from '../src/core/solver';

describe('shop and save migration', () => {
  it('enforces unlock, balance and one-time ownership', () => {
    const p = newPlayer(); p.coins = 500;
    expect(buyDecoration(p, 'chili')).toBe(false);
    p.maxLevel = 4;
    expect(buyDecoration(p, 'chili')).toBe(true); expect(p.coins).toBe(460);
    expect(buyDecoration(p, 'chili')).toBe(false); expect(p.coins).toBe(460);
    expect(buyDecoration(p, 'cat')).toBe(true); expect(p.coins).toBe(60);
    expect(buyDecoration(p, 'plant')).toBe(false); expect(p.owned).toEqual(['chili', 'cat']);
  });
  it('migrates a v1 save, preserves values and sanitizes optional metadata', () => {
    const old = { ...newPlayer(), version: 1, level: 21, maxLevel: 21, name: 'الخير', coins: 89, owned: undefined, session: undefined, orderRewards: undefined };
    expect(readPlayer(JSON.stringify(old))).toMatchObject({ version: 4, level: 21, coins: 89, name: 'الخير', owned: [], session: null });
    const p = readPlayer(JSON.stringify({ ...old, owned: ['cat', 'cat', 'unknown'], theme: 'bad', orderRewards: [-1, 7, 7, 100] }));
    expect(p.owned).toEqual(['cat']); expect(p.theme).toBe('auto'); expect(p.orderRewards).toEqual([7]);
    expect(readPlayer(JSON.stringify(p))).toEqual(p);
  });
  it('restores in-progress layers, undo history and helper counts without aliasing', () => {
    const level = loadLevel(12), session = new GameSession(level), path = solve(session.state(), 60000).path!;
    session.tap(path[0][0]); session.tap(path[0][1]);
    session.applyHint(solve(session.state(), 60000), 0);
    const saved = session.snapshot(), restored = new GameSession(level);
    expect(restored.restore(saved)).toBe(true); expect(restored.snapshot()).toEqual(saved);
    expect(restored.undo()).toBe('ok'); expect(restored.vessels).toEqual(level.layerVessels); expect(saved.history.length).toBe(1);
    expect(restored.moves).toBe(1); expect(restored.hintFree).toBe(0);
    for (const bad of [null, {}, { ...saved, level: 13 }, { ...saved, vessels: [[0, 0]] }, { ...saved, hidden: [999] }, { ...saved, moves: -1 }, { ...saved, hintFree: 9 }]) expect(new GameSession(level).restore(bad)).toBe(false);
  });
});

describe('orders', () => {
  const orderedSession = (hard = false) => {
    const vessels = [[0, 0, 0, 0], [1, 1, 1, 1], [2, 2, 2], [2]], ids = identifyLayers(vessels);
    return new GameSession({ ...loadLevel(7), level: hard ? 10 : 7, type: hard ? 'hard' : 'normal', vessels, layerVessels: ids.vessels, layerSpices: ids.spices, order: [0, 1], hidden: [] });
  };
  it('grants 40 once, remains delivered across restart/reload and doubles hard rewards', () => {
    const p = newPlayer(); p.level = 7; p.maxLevel = 7; const s = orderedSession();
    expect(settleOrder(p, s)).toEqual({ status: 'delivered', reward: 40 });
    s.restart(); expect(settleOrder(readPlayer(JSON.stringify(p)), s).reward).toBe(0);
    expect(p.coins).toBe(40); p.level = 10; p.maxLevel = 10;
    expect(settleOrder(p, orderedSession(true)).reward).toBe(80);
  });
  it('does not reward a missed order when the remaining spices eventually complete', () => {
    expect(orderStatus([[2, 2, 2, 2]], [0, 1], false)).toBe('missed');
    expect(orderStatus([[0, 0, 0, 0], [1, 1, 1, 1], [2, 2, 2, 2]], [0, 1], false)).toBe('missed');
    expect(orderStatus([[2, 2], [2, 2]], [0, 1], false)).toBe('waiting');
    expect(orderStatus([[2, 2, 2, 2]], [0, 1], true)).toBe('delivered');
  });
});

describe('Egypt seasonal calendar', () => {
  it('uses inclusive local dates, manual overrides, and normal outside listed years', () => {
    expect(activeTheme('auto', new Date(2026, 1, 19))).toBe('ramadan');
    expect(activeTheme('auto', new Date(2026, 2, 19, 23, 59))).toBe('ramadan');
    expect(activeTheme('auto', new Date(2026, 2, 20))).toBe('eid');
    expect(activeTheme('auto', new Date(2027, 4, 3))).toBe('spring');
    expect(activeTheme('auto', new Date(2027, 4, 4))).toBe('normal');
    expect(activeTheme('normal', new Date(2026, 1, 19))).toBe('normal');
    expect(activeTheme('ramadan', new Date(2026, 8, 29))).toBe('ramadan');
    expect(activeTheme('auto', new Date(2030, 1, 19))).toBe('normal');
  });
});
