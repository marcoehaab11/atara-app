export const APP_ID = 'com.marcoehab.attarsort';
export const CAP = 4;
export const EMPTY_VESSELS = 2;
export const GENERATION = {
  maxSpices: 10, rampStart: 4, rampEvery: 3,
  candidates: { tutorial: 3, rest: 3, normal: 5, hard: 9 },
  attemptMultiplier: 5, nodeBudget: 220_000, candidateLimit: 15_000,
  fallbackAttempts: 20, fallbackLimit: 60_000, fallbackEmpties: 3,
  normalPercentile: 0.7, pathWeight: 3,
} as const;
export const HIDDEN = { start: 12, base: 0.4, step: 0.03, max: 0.9 };
export const ORDERS = { start: 7, limit: 15_000, pairs: 3, rewardPerSpice: 20 };
export const STARS = { optimalBuffer: 0.15, twoStarExtra: 0.35 };
export const SHOP_NAME = { min: 2, max: 18, timing: 'first_launch' as 'first_launch' | 'after_level_1' } as const;
export const DAILY = { minSpices: 7, spiceRange: 3, hiddenFraction: 0.6 };
export const PRECOMPUTE = {
  levels: 1000, searchNodes: 4000, searchStates: 16000, searchTimeMs: 100,
} as const;
export const HELPERS = { freeUndos: 5, freeHints: 1, hintLimit: 60_000 };
export const UNLOCKS = { undo: 2, restart: 2, hint: 3, extra: 3, coins: 3, shop: 4, double: 4, daily: 5 } as const;
export const ECONOMY = { winBase: 10, perStar: 5, hardMultiplier: 2 };
export const SHOP_PRICES = { chili: 40, plant: 70, lantern: 110, scale: 160, radio: 220, sign: 300, cat: 400 } as const;
// Egypt calendar dates; 2027 lunar dates are tentative. Review annually.
// Sources and celebration windows: docs/SEASON_DATES.md.
export const THEME_DATES: readonly { start: string; end: string; theme: 'ramadan' | 'eid' | 'spring' }[] = [
  { start: '2026-02-19', end: '2026-03-19', theme: 'ramadan' },
  { start: '2026-03-20', end: '2026-03-22', theme: 'eid' },
  { start: '2026-04-13', end: '2026-04-13', theme: 'spring' },
  { start: '2026-05-27', end: '2026-05-30', theme: 'eid' },
  { start: '2027-02-09', end: '2027-03-09', theme: 'ramadan' },
  { start: '2027-03-10', end: '2027-03-12', theme: 'eid' },
  { start: '2027-05-03', end: '2027-05-03', theme: 'spring' },
  { start: '2027-05-17', end: '2027-05-20', theme: 'eid' },
];
export const MOTION = {
  tiltDegrees: 24, leadMs: 200, flightMs: 520, staggerMaxMs: 40, staggerTotalMs: 420,
  apexHeight: 40, jitter: 8, spinMin: 140, spinRange: 140,
  bounceMs: 240, dropMs: 300, dropStaggerMs: 45, dropHeight: 70, poolSize: 32,
  landingSoundGapMs: 22,
} as const;
