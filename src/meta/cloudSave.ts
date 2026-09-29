import type { Player } from './player';

/** Choose one complete save; only decorations are unioned, never currencies or progress fields. */
export function mergeCloudPlayers(local: Player, cloud: Player): Player {
  const localStars = Object.values(local.stars).reduce((sum, value) => sum + value, 0);
  const cloudStars = Object.values(cloud.stars).reduce((sum, value) => sum + value, 0);
  const preferred = cloud.maxLevel > local.maxLevel || (cloud.maxLevel === local.maxLevel && cloudStars > localStars) ? cloud : local;
  return { ...preferred, owned: [...new Set([...local.owned, ...cloud.owned])] };
}
