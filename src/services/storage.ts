import { readPlayer } from '../meta/player';
import type { Player } from '../meta/player';
const KEY = 'attar-sort:player:v1';
export function loadPlayer(): Player {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  try { return readPlayer(localStorage.getItem(KEY), reduced); } catch { return readPlayer(null, reduced); }
}
export function savePlayer(player: Player): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(player)); return true; } catch { return false; }
}
