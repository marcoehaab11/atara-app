import { MONETIZATION } from '../config';
import type { Player } from './player';

export interface MonetizationProgress {
  starterOfferSeen: boolean;
  starterOfferExpiresAt: number | null;
  starterPurchased: boolean;
  removeAds: boolean;
  lastInterstitialAt: number;
  doubledLevels: number[];
}

export const freshMonetization = (): MonetizationProgress => ({
  starterOfferSeen: false, starterOfferExpiresAt: null, starterPurchased: false,
  removeAds: false, lastInterstitialAt: 0, doubledLevels: [],
});

export function readMonetization(value: unknown): MonetizationProgress {
  if (!value || typeof value !== 'object') return freshMonetization();
  const data = value as Partial<MonetizationProgress>;
  const stamp = data.starterOfferExpiresAt;
  return {
    starterOfferSeen: data.starterOfferSeen === true,
    starterOfferExpiresAt: Number.isSafeInteger(stamp) && (stamp as number) > 0 ? stamp! : null,
    starterPurchased: data.starterPurchased === true,
    removeAds: data.removeAds === true || data.starterPurchased === true,
    lastInterstitialAt: Number.isSafeInteger(data.lastInterstitialAt) && data.lastInterstitialAt! > 0 ? data.lastInterstitialAt! : 0,
    doubledLevels: Array.isArray(data.doubledLevels) ? [...new Set(data.doubledLevels.filter(n => Number.isSafeInteger(n) && n > 0 && n <= 1_000_000))] : [],
  };
}

export function beginStarterOffer(player: Player, completedLevel: number, now: number): boolean {
  const m = player.monetization;
  if (completedLevel !== 10 || m.removeAds || m.starterOfferSeen) return false;
  m.starterOfferSeen = true;
  m.starterOfferExpiresAt = now + MONETIZATION.starterWindowMs;
  return true;
}

export function starterOfferAvailable(player: Player, now: number): boolean {
  const expires = player.monetization.starterOfferExpiresAt;
  return !player.monetization.removeAds && expires !== null && now < expires;
}

/** Browser-only mock purchase; native purchase verification belongs to Phase 9. */
export function mockBuyStarterPack(player: Player, now: number): boolean {
  const m = player.monetization;
  if (!starterOfferAvailable(player, now) || m.starterPurchased) return false;
  m.starterPurchased = true;
  m.removeAds = true;
  player.hints += 10;
  player.coins += 200;
  return true;
}

export function shouldShowInterstitial(player: Player, completedLevel: number, now: number, rewardedThisWin = false): boolean {
  const previous = player.monetization.lastInterstitialAt;
  return !player.monetization.removeAds && !rewardedThisWin && completedLevel >= MONETIZATION.firstInterstitialLevel &&
    completedLevel % MONETIZATION.interstitialEveryLevels === 0 && (previous === 0 || (now >= previous && now - previous >= MONETIZATION.interstitialCooldownMs));
}

export function markInterstitialShown(player: Player, now: number): void {
  player.monetization.lastInterstitialAt = now;
}

export function markDoubleClaimed(player: Player, level: number): boolean {
  if (player.monetization.doubledLevels.includes(level)) return false;
  player.monetization.doubledLevels.push(level);
  return true;
}
