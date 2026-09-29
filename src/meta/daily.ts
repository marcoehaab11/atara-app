import { DAILY_ECONOMY, DAILY_REWARDS, UNLOCKS } from '../config';
import { dailySeed } from '../core/daily';
import type { Player } from './player';
export interface DailyProgress {
  lastSeen: number; lastClaim: number | null; claimDay: number;
  lastComplete: number | null; streak: number; best: number; completions: number;
  hubShown: number | null; run: { date: number; snapshot: unknown } | null;
}
export const freshDaily = (): DailyProgress => ({ lastSeen: 0, lastClaim: null, claimDay: 0, lastComplete: null, streak: 0, best: 0, completions: 0, hubShown: null, run: null });
export function calendarDate(key: number): Date {
  return new Date(Math.floor(key / 10000), Math.floor(key / 100) % 100 - 1, key % 100);
}
const validKey = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 20000101 && value <= 99991231 && dailySeed(calendarDate(value)) === value;
/** Calendar difference, independent of DST's 23/25-hour local days. */
export function dayGap(later: number, earlier: number): number {
  const ordinal = (key: number) => Date.UTC(Math.floor(key / 10000), Math.floor(key / 100) % 100 - 1, key % 100) / 86400000;
  return ordinal(later) - ordinal(earlier);
}
export function readDaily(input: unknown): DailyProgress {
  if (!input || typeof input !== 'object') return freshDaily();
  const d = input as DailyProgress;
  if (!['lastSeen', 'claimDay', 'streak', 'best', 'completions'].every(key => { const value = d[key as keyof DailyProgress]; return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0; }) ||
    d.claimDay > 7 || d.best < d.streak || d.completions < d.streak ||
    ![d.lastClaim, d.lastComplete, d.hubShown].every(key => key === null || validKey(key)) ||
    (d.lastClaim === null) !== (d.claimDay === 0) || (d.lastComplete === null) !== (d.streak === 0)) return freshDaily();
  return { lastSeen: d.lastSeen, lastClaim: d.lastClaim, claimDay: d.claimDay, lastComplete: d.lastComplete,
    streak: d.streak, best: d.best, completions: d.completions, hubShown: d.hubShown,
    run: d.run && validKey(d.run.date) ? { date: d.run.date, snapshot: d.run.snapshot ?? null } : null };
}
export function observeClock(daily: DailyProgress, now: Date): boolean {
  const time = now.getTime();
  if (!Number.isFinite(time) || time < daily.lastSeen) return false;
  daily.lastSeen = time; return true;
}
export function dailyStatus(player: Player, now: Date) {
  const d = player.daily, today = dailySeed(now), clockOK = now.getTime() >= d.lastSeen;
  const claimed = d.lastClaim === today, completed = d.lastComplete === today;
  const nextDay = claimed ? d.claimDay : d.lastClaim !== null && dayGap(today, d.lastClaim) === 1 ? d.claimDay % 7 + 1 : 1;
  const streak = d.lastComplete !== null && dayGap(today, d.lastComplete) >= 0 && dayGap(today, d.lastComplete) <= 1 ? d.streak : 0;
  return { today, clockOK, claimed, completed, nextDay, streak, available: player.maxLevel >= UNLOCKS.daily && clockOK };
}
export function claimDaily(player: Player, now: Date) {
  const status = dailyStatus(player, now); observeClock(player.daily, now);
  if (!status.available || status.claimed) return null;
  const reward = DAILY_REWARDS[status.nextDay - 1], tray = status.nextDay === 7 && !player.owned.includes('tray');
  player.coins += reward.coins; player.hints += reward.hints;
  if (tray) player.owned.push('tray');
  player.daily.lastClaim = status.today; player.daily.claimDay = status.nextDay;
  return { ...reward, tray, day: status.nextDay };
}
export function completeDaily(player: Player, date: number, now: Date) {
  const status = dailyStatus(player, now); observeClock(player.daily, now);
  if (!status.available || status.completed || date !== status.today) return null;
  const d = player.daily;
  d.streak = d.lastComplete !== null && dayGap(date, d.lastComplete) === 1 ? d.streak + 1 : 1;
  d.best = Math.max(d.best, d.streak); d.lastComplete = date; d.completions++;
  const reward = DAILY_ECONOMY.base + DAILY_ECONOMY.perDay * Math.min(d.streak, DAILY_ECONOMY.streakCap);
  player.coins += reward; d.run = null;
  return { reward, streak: d.streak, best: d.best };
}
