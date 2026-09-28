import packed from './levels.json';
import { PRECOMPUTE } from '../config';
import { generateLevel } from '../core/generator';
import { unpackLevel, validateLevelFile } from './levelSchema';
import type { PlayableLevel } from './levelSchema';

export function createLevelLoader(input: unknown, count: number = PRECOMPUTE.levels) {
  validateLevelFile(input, count);
  // Own our copy: callers cannot change future loads by mutating the input or a result.
  const rows = structuredClone(input.levels);
  return (level: number): PlayableLevel => {
    if (!Number.isSafeInteger(level) || level < 1) throw new RangeError('Invalid level');
    if (level <= count) return unpackLevel(rows[level - 1]);
    const generated = generateLevel(level);
    return { ...generated, order: generated.order ? [...generated.order] : null, source: 'generated' };
  };
}

let loader: ReturnType<typeof createLevelLoader> | undefined;
export function loadLevel(level: number): PlayableLevel {
  loader ??= createLevelLoader(packed);
  return loader(level);
}
