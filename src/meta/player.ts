import { ECONOMY, UNLOCKS } from '../config';
import { validateShopName } from '../core/shopName';
import type { Locale } from '../i18n';
import { decorations } from './shop';
import type { Decoration } from './shop';
import { themes } from './themes';
import type { ThemeChoice } from './themes';
import { freshDaily, readDaily } from './daily';
import type { DailyProgress } from './daily';
import { freshMonetization, readMonetization } from './monetization';
import type { MonetizationProgress } from './monetization';
export interface Player {
  version: 4; level: number; maxLevel: number; coins: number; hints: number;
  stars: Record<string, number>; name: string | null; nameAnswered: boolean;
  locale: Locale; announced: number[]; motion: boolean; sound: boolean;
  owned: Decoration[]; orderRewards: number[]; theme: ThemeChoice; haptics: boolean;
  session: unknown;
  daily: DailyProgress; music: boolean; monetization: MonetizationProgress;
}
export const newPlayer = (reducedMotion = false): Player => ({ version: 4, level: 1, maxLevel: 1, coins: 0, hints: 0, stars: {}, name: null, nameAnswered: false, locale: 'ar', announced: [], motion: !reducedMotion, sound: true, owned: [], orderRewards: [], theme: 'auto', haptics: true, session: null, daily: freshDaily(), music: true, monetization: freshMonetization() });
const natural = (x: unknown): x is number => Number.isSafeInteger(x) && (x as number) >= 0;
export function readPlayer(text: string | null, reducedMotion = false): Player {
  if (!text) return newPlayer(reducedMotion);
  try {
    const data = JSON.parse(text) as Omit<Partial<Player>, 'version'> & { version?: number };
    if (![1, 2, 3, 4].includes(data.version ?? 0) || !natural(data.level) || data.level < 1 || !natural(data.maxLevel) || data.maxLevel < data.level ||
      !natural(data.coins) || !natural(data.hints) || !['ar', 'en'].includes(data.locale ?? '') ||
      typeof data.nameAnswered !== 'boolean' || (data.name !== null && (typeof data.name !== 'string' || validateShopName(data.name).error !== null)) ||
      !Array.isArray(data.announced) || !data.announced.every(x => natural(x) && x >= 2 && x <= 5) ||
      !data.stars || typeof data.stars !== 'object' || Array.isArray(data.stars) ||
      !Object.entries(data.stars).every(([k, v]) => /^[1-9]\d*$/.test(k) && natural(v) && v >= 1 && v <= 3)) return newPlayer(reducedMotion);
    return { ...data, version: 4, daily: readDaily(data.daily), music: typeof data.music === 'boolean' ? data.music : true, monetization: readMonetization(data.monetization),
      motion: typeof data.motion === 'boolean' ? data.motion : !reducedMotion, sound: typeof data.sound === 'boolean' ? data.sound : true,
      owned: Array.isArray(data.owned) ? [...new Set(data.owned.filter(x => decorations.includes(x)))] : [],
      orderRewards: Array.isArray(data.orderRewards) ? [...new Set(data.orderRewards.filter(x => natural(x) && x >= 7 && x <= data.maxLevel!))] : [],
      theme: themes.includes(data.theme!) ? data.theme : 'auto', haptics: typeof data.haptics === 'boolean' ? data.haptics : true,
      session: data.session ?? null,
    } as Player;
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
