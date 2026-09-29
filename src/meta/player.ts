import { ECONOMY, UNLOCKS } from '../config';
import { validateShopName } from '../core/shopName';
import type { Locale } from '../i18n';
export interface Player {
  version: 1; level: number; maxLevel: number; coins: number; hints: number;
  stars: Record<string, number>; name: string | null; nameAnswered: boolean;
  locale: Locale; announced: number[]; motion: boolean; sound: boolean;
}
export const newPlayer = (reducedMotion = false): Player => ({ version: 1, level: 1, maxLevel: 1, coins: 0, hints: 0, stars: {}, name: null, nameAnswered: false, locale: 'ar', announced: [], motion: !reducedMotion, sound: true });
const natural = (x: unknown): x is number => Number.isSafeInteger(x) && (x as number) >= 0;
export function readPlayer(text: string | null, reducedMotion = false): Player {
  if (!text) return newPlayer(reducedMotion);
  try {
    const data = JSON.parse(text) as Partial<Player>;
    if (data.version !== 1 || !natural(data.level) || data.level < 1 || !natural(data.maxLevel) || data.maxLevel < data.level ||
      !natural(data.coins) || !natural(data.hints) || !['ar', 'en'].includes(data.locale ?? '') ||
      typeof data.nameAnswered !== 'boolean' || (data.name !== null && (typeof data.name !== 'string' || validateShopName(data.name).error !== null)) ||
      !Array.isArray(data.announced) || !data.announced.every(x => natural(x) && x >= 2 && x <= 5) ||
      !data.stars || typeof data.stars !== 'object' || Array.isArray(data.stars) ||
      !Object.entries(data.stars).every(([k, v]) => /^[1-9]\d*$/.test(k) && natural(v) && v >= 1 && v <= 3)) return newPlayer(reducedMotion);
    return { ...data, motion: typeof data.motion === 'boolean' ? data.motion : !reducedMotion, sound: typeof data.sound === 'boolean' ? data.sound : true } as Player;
  } catch { return newPlayer(reducedMotion); }
}
export const unlocked = (player: Player, feature: keyof typeof UNLOCKS) => player.maxLevel >= UNLOCKS[feature];
export function grantWin(player: Player, level: number, stars: 1 | 2 | 3, hard: boolean): number {
  if (level !== player.level) return 0;
  const reward = (ECONOMY.winBase + ECONOMY.perStar * stars) * (hard ? ECONOMY.hardMultiplier : 1);
  player.coins += reward;
  player.stars[level] = Math.max(player.stars[level] ?? 0, stars);
  player.level++;
  player.maxLevel = Math.max(player.maxLevel, player.level);
  return reward;
}
