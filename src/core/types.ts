/** Spice IDs in each vessel, bottom to top. */
export type State = readonly (readonly number[])[];
export type Move = readonly [number, number];
export type LevelType = 'tutorial' | 'normal' | 'hard' | 'rest';
export type Order = readonly [number, number];
