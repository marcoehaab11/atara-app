import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newPlayer } from '../src/meta/player';
import { loadPlayer, savePlayer } from '../src/services/storage';

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));

describe('welcome screen launch detection', () => {
  const values = new Map<string, string>();
  beforeEach(() => {
    values.clear();
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) });
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('enters the game directly on first launch, then shows the welcome screen when a save exists', async () => {
    const first = await loadPlayer();
    expect(first.returning).toBe(false);
    expect(first.player.level).toBe(1);
    const progress = newPlayer(); progress.level = 3; progress.maxLevel = 3;
    expect(savePlayer(progress)).toBe(true);
    const next = await loadPlayer();
    expect(next.returning).toBe(true);
    expect(next.player.level).toBe(3);
  });
});
