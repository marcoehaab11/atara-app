import { describe, expect, it } from 'vitest';
import { newPlayer } from '../src/meta/player';
import { mergeCloudPlayers } from '../src/meta/cloudSave';

describe('mergeCloudPlayers', () => {
  it('keeps the higher-level complete save and unions decorations without adding currencies', () => {
    const local = newPlayer();
    Object.assign(local, { maxLevel: 20, level: 20, coins: 70, owned: ['plant' as const] });
    const cloud = newPlayer();
    Object.assign(cloud, { maxLevel: 30, level: 30, coins: 40, owned: ['cat' as const] });

    const merged = mergeCloudPlayers(local, cloud);
    expect(merged.maxLevel).toBe(30);
    expect(merged.coins).toBe(40);
    expect(merged.owned).toEqual(['plant', 'cat']);
  });

  it('breaks equal-level ties by total stars and otherwise keeps local settings', () => {
    const local = newPlayer();
    Object.assign(local, { maxLevel: 10, level: 8, locale: 'en' as const, stars: { '1': 3 } });
    const cloud = newPlayer();
    Object.assign(cloud, { maxLevel: 10, level: 10, locale: 'ar' as const, stars: { '1': 3, '2': 2 } });
    expect(mergeCloudPlayers(local, cloud).locale).toBe('ar');
    cloud.stars = { '1': 1 };
    expect(mergeCloudPlayers(local, cloud).locale).toBe('en');
  });
});
