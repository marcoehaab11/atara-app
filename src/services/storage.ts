import { readPlayer } from '../meta/player';
import type { Player } from '../meta/player';
const KEY = 'attar-sort:player:v1';
export function loadPlayer(): Player {
  try { return readPlayer(localStorage.getItem(KEY)); } catch { return readPlayer(null); }
}
export function savePlayer(player: Player): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(player)); return true; } catch { return false; }
}
