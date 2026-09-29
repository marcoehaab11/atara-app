import { SHOP_PRICES } from '../config';
import type { Player } from './player';
export type ShopItem = keyof typeof SHOP_PRICES;
export type Decoration = ShopItem | 'tray';
export const decorations: Decoration[] = [...Object.keys(SHOP_PRICES) as ShopItem[], 'tray'];
export function buyDecoration(player: Player, item: ShopItem): boolean {
  if (player.maxLevel < 4 || player.owned.includes(item) || player.coins < SHOP_PRICES[item]) return false;
  player.coins -= SHOP_PRICES[item]; player.owned.push(item); return true;
}
