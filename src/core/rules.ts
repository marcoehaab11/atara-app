import { CAP } from '../config';
import type { State } from './types';

export function topRun(v: readonly number[]) {
  const spice = v.at(-1);
  let count = 0;
  for (let i = v.length - 1; i >= 0 && v[i] === spice; i--) count++;
  return { spice, count };
}
export const isComplete = (v: readonly number[]) => v.length === CAP && v.every(x => x === v[0]);
export const isWon = (s: State) => s.every(v => v.length === 0 || isComplete(v));

export function canPour(s: State, a: number, b: number): boolean {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a === b) return false;
  const A = s[a], B = s[b];
  if (!A || !B || !A.length || isComplete(A) || B.length >= CAP) return false;
  return !B.length || B.at(-1) === A.at(-1);
}
export function pour(s: State, a: number, b: number) {
  if (!canPour(s, a, b)) throw new RangeError('Illegal pour');
  const moved = Math.min(topRun(s[a]).count, CAP - s[b].length);
  const state = s.map(v => [...v]);
  for (let i = 0; i < moved; i++) state[b].push(state[a].pop()!);
  return { state, moved };
}
export function isUsefulMove(s: State, a: number, b: number): boolean {
  return canPour(s, a, b) && !(s[b].length === 0 && topRun(s[a]).count === s[a].length);
}
export function hasUsefulMove(s: State): boolean {
  return s.some((_, a) => s.some((_, b) => isUsefulMove(s, a, b)));
}
