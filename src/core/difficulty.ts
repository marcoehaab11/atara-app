import { GENERATION } from '../config';
import type { LevelType } from './types';

export function levelInfo(level: number) {
  if (!Number.isSafeInteger(level) || level < 1) throw new RangeError('Invalid level');
  const type: LevelType = level <= 2 ? 'tutorial' : level % 5 === 0 ? 'hard' : level >= 6 && level % 5 === 1 ? 'rest' : 'normal';
  let spices = level === 1 ? 2 : level === 2 ? 3 : Math.min(GENERATION.maxSpices, GENERATION.rampStart + Math.floor((level - 3) / GENERATION.rampEvery));
  if (type === 'hard') spices = Math.min(GENERATION.maxSpices, spices + 1);
  if (type === 'rest') spices = Math.max(3, spices - 1);
  return { type, spices, world: Math.floor((level - 1) / 20) % 3, chapter: Math.floor((level - 1) / 20) + 1 };
}
export function difficultyScore(nodes: number, pathLength: number): number {
  return nodes + GENERATION.pathWeight * pathLength;
}
