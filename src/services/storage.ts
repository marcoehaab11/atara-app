import { readPlayer } from '../meta/player';
import type { Player } from '../meta/player';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
const KEY = 'attar-sort:player:v1';
export async function loadPlayer(): Promise<Player> {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let legacy: string | null = null;
  try { legacy = localStorage.getItem(KEY); } catch { /* Browser storage can be unavailable. */ }
  if (Capacitor.isNativePlatform()) {
    try {
      const stored = await Preferences.get({ key: KEY });
      if (stored.value !== null) return readPlayer(stored.value, reduced);
      if (legacy !== null) await Preferences.set({ key: KEY, value: legacy });
    } catch { /* Preserve the web save as a fallback. */ }
  }
  return readPlayer(legacy, reduced);
}
export function savePlayer(player: Player): boolean {
  const value = JSON.stringify(player);
  let saved = false;
  try { localStorage.setItem(KEY, value); saved = true; } catch { /* Browser storage can be unavailable. */ }
  if (Capacitor.isNativePlatform()) void Preferences.set({ key: KEY, value }).catch(() => undefined);
  return saved || Capacitor.isNativePlatform();
}
