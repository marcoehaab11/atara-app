import { STARS } from '../config';
export function starsForMoves(moves: number, par: number): 1 | 2 | 3 {
  return moves <= par ? 3 : moves <= par + Math.ceil(STARS.twoStarExtra * par) ? 2 : 1;
}
export const optimalPar = (shortest: number) => shortest + Math.ceil(STARS.optimalBuffer * shortest);
