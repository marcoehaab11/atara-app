import { Capacitor, registerPlugin } from '@capacitor/core';

interface PlayGamesNative {
  isAuthenticated(): Promise<{ authenticated: boolean }>;
  loadSnapshot(): Promise<{ data: string | null }>;
  saveSnapshot(options: { data: string }): Promise<void>;
  unlockAchievement(options: { key: string }): Promise<void>;
  showAchievements(): Promise<void>;
}

const nativePlugin = registerPlugin<PlayGamesNative>('PlayGames');
const isNative = Capacitor.isNativePlatform();
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let queuedSave: string | null = null;

/** PGS is optional: local play always works when the player is offline or not signed in. */
export async function loadPlayGamesSnapshot(): Promise<string | null> {
  if (!isNative) return null;
  try {
    if (!(await nativePlugin.isAuthenticated()).authenticated) return null;
    return (await nativePlugin.loadSnapshot()).data;
  } catch { return null; }
}

export function queuePlayGamesSave(data: string): void {
  if (!isNative) return;
  queuedSave = data;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const snapshot = queuedSave;
    queuedSave = null;
    if (snapshot !== null) void nativePlugin.saveSnapshot({ data: snapshot }).catch(() => undefined);
  }, 8_000);
}

export function unlockPlayGamesAchievement(key: string): void {
  if (isNative) void nativePlugin.unlockAchievement({ key }).catch(() => undefined);
}

export function showPlayGamesAchievements(): void {
  if (isNative) void nativePlugin.showAchievements().catch(() => undefined);
}
