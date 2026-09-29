import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/core/session';
import { loadLevel } from '../src/content/levelLoader';
import { solve } from '../src/core/solver';
import { identifyLayers } from '../src/core/hidden';
import { isWon } from '../src/core/rules';
import { newPlayer, readPlayer, grantWin, unlocked } from '../src/meta/player';
import ar from '../src/i18n/ar.json';
import en from '../src/i18n/en.json';

describe('playable session', () => {
  it('keeps the first guide on cancel and invalid tap, clears it only on a pour', () => {
    const session = new GameSession(loadLevel(1)), guide = session.hintPair!;
    session.tap(guide[0]); session.tap(guide[0]);
    expect(session.selected).toBeNull(); expect(session.hintPair).toEqual(guide);
    session.tap(guide[1]); expect(session.hintPair).toEqual(guide);
    session.tap(guide[0]); const event = session.tap(guide[1]);
    expect(event.kind).toBe('pour'); expect(session.hintPair).toBeNull(); expect(session.moves).toBe(1);
  });
  it('undo restores stable IDs without reducing moves; restart resets moves without refunding helpers', () => {
    const session = new GameSession(loadLevel(2)), start = structuredClone(session.vessels), path = solve(session.state(), 60_000).path!;
    session.tap(path[0][0]); session.tap(path[0][1]);
    expect(session.vessels).not.toEqual(start);
    expect(session.undo()).toBe('ok'); expect(session.vessels).toEqual(start);
    expect(session.moves).toBe(1); expect(session.undoLeft).toBe(4);
    session.restart(); expect(session.moves).toBe(0); expect(session.undoLeft).toBe(4); expect(session.undo()).toBe('empty');
  });
  it('reveals every moved ID and never re-hides after undo', () => {
    const level = loadLevel(12), raw = [[0, 1, 1, 1], [0, 0, 0], [1]], ids = identifyLayers(raw);
    const session = new GameSession({ ...level, vessels: raw, layerVessels: ids.vessels, layerSpices: ids.spices, hidden: [0, 1, 2, 4, 5] });
    session.tap(0); session.tap(2);
    expect([...session.hidden]).toEqual([4, 5]);
    session.undo(); expect([...session.hidden]).toEqual([4, 5]);
    session.restart(); expect([...session.hidden]).toEqual([0, 1, 2, 4, 5]);
  });
  it('consumes hints free first, inventory next, and nothing on unsuccessful searches', () => {
    const session = new GameSession(loadLevel(3)), result = solve(session.state(), 60_000);
    expect(session.applyHint({ path: null, nodes: 0, unsolvable: false }, 2)).toMatchObject({ status: 'timeout', inventory: 2 });
    expect(session.hintFree).toBe(1);
    expect(session.applyHint(result, 2)).toMatchObject({ status: 'ok', source: 'free', inventory: 2 });
    expect(session.applyHint(result, 2)).toMatchObject({ status: 'ok', source: 'inventory', inventory: 1 });
    expect(session.applyHint({ path: null, nodes: 1, unsolvable: true }, 1)).toMatchObject({ status: 'unsolvable', inventory: 1 });
    expect(session.applyHint(result, 0)).toMatchObject({ status: 'ad', inventory: 0 });
    session.restart(); expect(session.hintFree).toBe(0); expect(session.usedHints).toBe(2);
  });
  it('guards exhausted undos and clears selection after illegal pours', () => {
    const session = new GameSession(loadLevel(2));
    session.tap(0); const invalid = session.tap(1);
    expect(invalid).toEqual({ kind: 'invalid', reason: 'full' }); expect(session.selected).toBeNull(); expect(session.moves).toBe(0);
    const move = solve(session.state(), 60_000).path![0]; session.tap(move[0]); session.tap(move[1]);
    session.undoLeft = 0; const before = structuredClone(session.vessels);
    expect(session.undo()).toBe('ad'); expect(session.vessels).toEqual(before);
  });
  it('plays a complete legal solution through taps and reports the win', () => {
    const session = new GameSession(loadLevel(1)), path = solve(session.state(), 60_000).path!;
    let last;
    for (const [a, b] of path) { session.tap(a); last = session.tap(b); }
    expect(last).toMatchObject({ kind: 'pour', won: true, stuck: false }); expect(isWon(session.state())).toBe(true);
    expect(session.moves).toBe(path.length);
  });
});

describe('minimal persistent progress', () => {
  it('grants one win once and opens helpers on schedule', () => {
    const player = newPlayer(); expect(unlocked(player, 'undo')).toBe(false);
    expect(grantWin(player, 1, 3, false)).toBe(25); expect(unlocked(player, 'undo')).toBe(true);
    expect(grantWin(player, 1, 3, false)).toBe(0); expect(player.coins).toBe(25);
    grantWin(player, 2, 2, false); expect(unlocked(player, 'hint')).toBe(true); expect(unlocked(player, 'shop')).toBe(false);
    grantWin(player, 3, 3, false); expect(unlocked(player, 'shop')).toBe(true); expect(unlocked(player, 'daily')).toBe(false);
    grantWin(player, 4, 3, false); expect(unlocked(player, 'daily')).toBe(true);
    expect(grantWin(player, 5, 3, true)).toBe(50);
  });
  it('round-trips name, currency, stars, language and onboarding; invalid saves reset safely', () => {
    const player = newPlayer(); player.name = 'البركة'; player.nameAnswered = true; player.locale = 'en'; grantWin(player, 1, 3, false);
    expect(readPlayer(JSON.stringify(player))).toEqual(player);
    for (const text of [null, 'invalid', '{}', 'null', JSON.stringify({ ...player, coins: -1 }), JSON.stringify({ ...player, name: '<script>' }), JSON.stringify({ ...player, stars: { 1: 4 } })]) expect(readPlayer(text)).toEqual(newPlayer());
  });
  it('keeps both languages complete with matching placeholders', () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
    for (const key of Object.keys(ar) as (keyof typeof ar)[]) expect(ar[key].match(/\{\w+\}/g)?.sort() ?? [], key).toEqual(en[key].match(/\{\w+\}/g)?.sort() ?? []);
  });
});
