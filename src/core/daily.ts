import { DAILY } from '../config';
import { generateLevel } from './generator';
import { mulberry32 } from './rng';

/** Deliberately uses local calendar fields, not UTC ISO strings. */
export function dailySeed(date: Date): number {
  if (!Number.isFinite(date.getTime())) throw new RangeError('Invalid date');
  return date.getFullYear() * 10_000 + (date.getMonth() + 1) * 100 + date.getDate();
}
export function dailyParameters(date: Date) {
  const seed = dailySeed(date), r = mulberry32(seed);
  return { seed, spices: DAILY.minSpices + Math.floor(r() * DAILY.spiceRange), hidden: r() < 0.5 ? DAILY.hiddenFraction : 0, world: date.getDay() % 3 };
}
export function generateDaily(date: Date) {
  return generateLevel(1, { ...dailyParameters(date), type: 'normal', orders: false });
}
