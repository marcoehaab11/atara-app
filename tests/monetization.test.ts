import { describe, expect, it } from 'vitest';
import { newPlayer, readPlayer } from '../src/meta/player';
import { beginStarterOffer, markDoubleClaimed, markInterstitialShown, mockBuyStarterPack, readMonetization, shouldShowInterstitial, starterOfferAvailable } from '../src/meta/monetization';
import { GameSession } from '../src/core/session';
import { loadLevel } from '../src/content/levelLoader';

describe('monetization mock rules', () => {
  it('opens the starter offer once after level 10 and retains a real 48-hour window', () => {
    const player = newPlayer(), now = Date.UTC(2026, 0, 1);
    expect(beginStarterOffer(player, 9, now)).toBe(false);
    expect(beginStarterOffer(player, 10, now)).toBe(true);
    expect(beginStarterOffer(player, 10, now + 1)).toBe(false);
    expect(starterOfferAvailable(player, now + 47 * 60 * 60 * 1000)).toBe(true);
    expect(starterOfferAvailable(player, now + 48 * 60 * 60 * 1000)).toBe(false);
    expect(player.monetization.starterOfferExpiresAt).toBe(now + 48 * 60 * 60 * 1000);
  });

  it('grants browser starter contents one time and migrates earlier saves', () => {
    const player = newPlayer(); player.coins = 8; player.hints = 2;
    beginStarterOffer(player, 10, 1000);
    expect(mockBuyStarterPack(player, 2000)).toBe(true);
    expect(mockBuyStarterPack(player, 2000)).toBe(false);
    expect(player).toMatchObject({ coins: 208, hints: 12, monetization: { removeAds: true, starterPurchased: true } });
    const old = { ...player, version: 3, monetization: undefined };
    expect(readPlayer(JSON.stringify(old))).toMatchObject({ version: 4, monetization: readMonetization(null) });
  });

  it('applies interstitial cadence, clock rollback and rewarded-win exclusions', () => {
    const player = newPlayer(), start = Date.UTC(2026, 0, 1);
    expect(shouldShowInterstitial(player, 3, start)).toBe(false);
    expect(shouldShowInterstitial(player, 6, start)).toBe(true);
    markInterstitialShown(player, start);
    expect(shouldShowInterstitial(player, 9, start + 89_999)).toBe(false);
    expect(shouldShowInterstitial(player, 9, start - 1)).toBe(false);
    expect(shouldShowInterstitial(player, 9, start + 90_000, true)).toBe(false);
    expect(shouldShowInterstitial(player, 9, start + 90_000)).toBe(true);
    player.monetization.removeAds = true;
    expect(shouldShowInterstitial(player, 12, start + 200_000)).toBe(false);
  });

  it('prevents duplicate coin doubling and restores an extra jar with undo history', () => {
    const player = newPlayer();
    expect(markDoubleClaimed(player, 10)).toBe(true);
    expect(markDoubleClaimed(player, 10)).toBe(false);
    const session = new GameSession(loadLevel(8));
    session.tap(0); session.tap(session.state().findIndex((v, i) => i !== 0 && !v.length));
    expect(session.addExtraJar()).toBe(true);
    expect(session.addExtraJar()).toBe(false);
    const saved = session.snapshot(), restored = new GameSession(loadLevel(8));
    expect(restored.restore(saved)).toBe(true);
    expect(restored.snapshot()).toEqual(saved);
    expect(restored.vessels.at(-1)).toEqual([]);
  });
});
