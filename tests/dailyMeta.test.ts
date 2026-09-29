import { describe, expect, it } from 'vitest';
import { newPlayer, readPlayer } from '../src/meta/player';
import { claimDaily, completeDaily, dailyStatus, observeClock, dayGap } from '../src/meta/daily';
import { dailySeed, generateDaily } from '../src/core/daily';
import { isWon, pour } from '../src/core/rules';
import { dayCount } from '../src/ui/dailyHub';

const player = () => { const p = newPlayer(); p.level = 5; p.maxLevel = 5; return p; };
const date = (day: number, hour = 12) => new Date(2026, 8, day, hour);
describe('daily calendar rewards', () => {
  it('grants the seven-day schedule once, awards one tray and cycles on day eight', () => {
    const p = player();
    for (let day = 1; day <= 7; day++) {
      expect(claimDaily(p, date(day))?.day).toBe(day);
      expect(claimDaily(p, date(day))).toBeNull();
    }
    expect(p.coins).toBe(220); expect(p.hints).toBe(6); expect(p.owned).toEqual(['tray']);
    expect(claimDaily(p, date(8))?.day).toBe(1);
    for (let day = 9; day <= 14; day++) claimDaily(p, date(day));
    expect(p.coins).toBe(440); expect(p.hints).toBe(12); expect(p.owned).toEqual(['tray']);
  });
  it('resets after a missed day and stays locked before level five', () => {
    expect(claimDaily(newPlayer(), date(1))).toBeNull();
    const p = player(); claimDaily(p, date(1)); claimDaily(p, date(2));
    expect(claimDaily(p, date(4))?.day).toBe(1); expect(p.coins).toBe(40);
  });
});
describe('challenge streak and clock', () => {
  it('increments consecutive completions, caps coins, keeps best and does not advance normal levels', () => {
    const p = player();
    for (let day = 1; day <= 8; day++) {
      expect(completeDaily(p, dailySeed(date(day)), date(day))).toEqual({ reward: 50 + 10 * Math.min(day, 7), streak: day, best: day });
      expect(completeDaily(p, dailySeed(date(day)), date(day))).toBeNull();
    }
    expect(p.level).toBe(5); expect(p.stars).toEqual({}); expect(p.daily.completions).toBe(8);
    expect(dailyStatus(p, date(9)).streak).toBe(8); expect(dailyStatus(p, date(10)).streak).toBe(0);
    expect(completeDaily(p, dailySeed(date(10)), date(10))).toEqual({ reward: 60, streak: 1, best: 8 });
  });
  it('blocks both rewards on clock rollback, including after save/reload, then recovers', () => {
    let p = player(); observeClock(p.daily, date(2, 18)); p = readPlayer(JSON.stringify(p));
    const before = p.coins;
    expect(claimDaily(p, date(2, 17))).toBeNull(); expect(completeDaily(p, dailySeed(date(2)), date(2, 17))).toBeNull();
    expect(p.coins).toBe(before); expect(p.daily.lastSeen).toBe(date(2, 18).getTime());
    expect(claimDaily(p, date(2, 19))).not.toBeNull(); expect(completeDaily(p, dailySeed(date(2)), date(2, 19))?.streak).toBe(1);
  });
  it('rejects an old challenge finishing after midnight and handles date boundaries', () => {
    const p = player();
    expect(completeDaily(p, dailySeed(date(1)), date(2))).toBeNull(); expect(p.coins).toBe(0);
    expect(dayGap(20270101, 20261231)).toBe(1); expect(dayGap(20240301, 20240228)).toBe(2);
    expect(dayGap(20260424, 20260423)).toBe(1);
  });
  it('migrates previous saves without inventing daily claims', () => {
    const old = { ...player(), version: 2, daily: undefined, music: undefined, coins: 77 };
    const migrated = readPlayer(JSON.stringify(old));
    expect(migrated.version).toBe(4); expect(migrated.coins).toBe(77); expect(migrated.daily.lastClaim).toBeNull();
    claimDaily(migrated, date(1)); expect(readPlayer(JSON.stringify(migrated))).toEqual(migrated);
  });
  it('formats Arabic day counts and English plurals', () => {
    expect([1, 2, 3, 11].map(n => dayCount('ar', n))).toEqual(['يوم', 'يومين', '3 أيام', '11 يوم']);
    expect(dayCount('en', 1)).toBe('1 day'); expect(dayCount('en', 2)).toBe('2 days');
  });
  it('generates a deterministic solvable daily with 7–9 spices, no order and weekday world', () => {
    const a = generateDaily(date(29)), b = generateDaily(date(29));
    expect(a.vessels).toEqual(b.vessels); expect(a.hidden).toEqual(b.hidden); expect(a.order).toBeNull();
    expect(a.spiceCount).toBeGreaterThanOrEqual(7); expect(a.spiceCount).toBeLessThanOrEqual(9); expect(a.world).toBe(date(29).getDay() % 3);
    let state = a.vessels; for (const [from, to] of a.solution) state = pour(state, from, to).state;
    expect(isWon(state)).toBe(true);
  });
});
