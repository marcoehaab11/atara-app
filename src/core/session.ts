import { HELPERS } from '../config';
import type { PlayableLevel } from '../content/levelSchema';
import { canPour, hasUsefulMove, isComplete, isWon, topRun } from './rules';
import { revealLayers } from './hidden';
import { solve } from './solver';
import type { SolveResult } from './solver';
import type { Move, State } from './types';
import { CAP } from '../config';

export type TapResult = { kind: 'select' | 'cancel' } | { kind: 'invalid'; reason: 'empty' | 'closed' | 'full' | 'mismatch' } |
  { kind: 'pour'; moved: number[]; source: number; target: number; complete: boolean; won: boolean; stuck: boolean };
const copy = (s: State) => s.map(v => [...v]);

/** Holds stable layer IDs. Spice-only states are derived for rule/solver calls. */
export class GameSession {
  readonly level: PlayableLevel;
  vessels: number[][];
  initial: number[][];
  hidden: Set<number>;
  history: number[][][] = [];
  selected: number | null = null;
  hintPair: Move | null = null;
  guided = false;
  moves = 0;
  undoLeft = HELPERS.freeUndos;
  hintFree = HELPERS.freeHints;
  usedUndos = 0;
  usedHints = 0;
  invalidTaps = 0;
  extraJarUsed = false;

  constructor(level: PlayableLevel) {
    this.level = level;
    this.vessels = copy(level.layerVessels);
    this.initial = copy(level.layerVessels);
    this.hidden = new Set(level.hidden);
    if (level.level === 1) {
      this.hintPair = solve(this.state(), HELPERS.hintLimit).path?.[0] ?? null;
      this.guided = this.hintPair !== null;
    }
  }
  state(): number[][] { return this.vessels.map(v => v.map(id => this.level.layerSpices[id])); }
  snapshot() {
    return { level: this.level.level, vessels: copy(this.vessels), hidden: [...this.hidden], history: this.history.map(copy),
      moves: this.moves, undoLeft: this.undoLeft, hintFree: this.hintFree, usedUndos: this.usedUndos, usedHints: this.usedHints, invalidTaps: this.invalidTaps, extraJarUsed: this.extraJarUsed };
  }
  restore(input: unknown): boolean {
    if (!input || typeof input !== 'object') return false;
    const data = input as ReturnType<GameSession['snapshot']>;
    const extraJarUsed = (data as { extraJarUsed?: unknown }).extraJarUsed === true;
    const vesselCount = this.initial.length + (extraJarUsed ? 1 : 0);
    const validBoard = (value: unknown, count = vesselCount): value is number[][] => {
      if (!Array.isArray(value) || value.length !== count || !value.every(v => Array.isArray(v) && v.length <= CAP)) return false;
      const ids = value.flat().sort((a, b) => a - b);
      return ids.length === this.level.layerSpices.length && ids.every((id, i) => id === i);
    };
    if (data.level !== this.level.level || !validBoard(data.vessels) || !Array.isArray(data.history) || data.history.length > 10000 || !data.history.every(v => validBoard(v) || (extraJarUsed && validBoard(v, vesselCount - 1))) ||
      !Array.isArray(data.hidden) || !data.hidden.every(id => this.level.hidden.includes(id)) ||
      !['moves', 'undoLeft', 'hintFree', 'usedUndos', 'usedHints', 'invalidTaps'].every(key => { const n = data[key as keyof typeof data]; return typeof n === 'number' && Number.isSafeInteger(n) && n >= 0; }) ||
      data.undoLeft > 1000 || data.hintFree > HELPERS.freeHints) return false;
    this.initial = copy(this.level.layerVessels);
    if (extraJarUsed) this.initial.push([]);
    this.vessels = copy(data.vessels); this.hidden = revealLayers(new Set(data.hidden), this.vessels);
    this.history = data.history.map(v => v.length === vesselCount ? copy(v) : [...copy(v), []]); this.extraJarUsed = extraJarUsed;
    this.moves = data.moves; this.undoLeft = data.undoLeft; this.hintFree = data.hintFree;
    this.usedUndos = data.usedUndos; this.usedHints = data.usedHints; this.invalidTaps = data.invalidTaps;
    this.guided = this.level.level === 1 && this.moves === 0;
    this.hintPair = this.guided ? solve(this.state(), HELPERS.hintLimit).path?.[0] ?? null : null;
    return true;
  }
  tap(index: number): TapResult {
    if (!this.vessels[index]) throw new RangeError('Invalid vessel');
    if (!this.guided) this.hintPair = null;
    const state = this.state();
    if (this.selected === index) { this.selected = null; return { kind: 'cancel' }; }
    if (this.selected === null) {
      if (!state[index].length) return this.invalid('empty');
      if (isComplete(state[index])) return this.invalid('closed');
      this.selected = index;
      return { kind: 'select' };
    }
    const source = this.selected;
    this.selected = null;
    if (!canPour(state, source, index)) return this.invalid(state[index].length >= CAP ? 'full' : 'mismatch');
    const count = Math.min(topRun(state[source]).count, CAP - state[index].length);
    this.history.push(copy(this.vessels));
    const moved: number[] = [];
    for (let i = 0; i < count; i++) { const id = this.vessels[source].pop()!; this.vessels[index].push(id); moved.push(id); }
    this.hidden = revealLayers(this.hidden, this.vessels, moved);
    this.moves++;
    this.guided = false;
    this.hintPair = null;
    const after = this.state(), won = isWon(after);
    return { kind: 'pour', moved, source, target: index, complete: isComplete(after[index]), won, stuck: !won && !hasUsefulMove(after) };
  }
  private invalid(reason: 'empty' | 'closed' | 'full' | 'mismatch'): TapResult {
    this.invalidTaps++;
    return { kind: 'invalid', reason };
  }
  undo(): 'ok' | 'empty' | 'ad' {
    if (!this.history.length) return 'empty';
    if (this.undoLeft <= 0) return 'ad';
    this.vessels = this.history.pop()!;
    this.hidden = revealLayers(this.hidden, this.vessels);
    this.undoLeft--; this.usedUndos++;
    this.selected = null; this.hintPair = null;
    // Undo never refunds moves or helper allowances.
    return 'ok';
  }
  grantUndos(count = 5): void { this.undoLeft = Math.min(1000, this.undoLeft + count); }
  addExtraJar(): boolean {
    if (this.extraJarUsed) return false;
    this.extraJarUsed = true; this.initial.push([]); this.vessels.push([]);
    this.history = this.history.map(snapshot => [...snapshot, []]);
    return true;
  }
  restart(): void {
    this.vessels = copy(this.initial);
    this.hidden = new Set(this.level.hidden);
    this.history = []; this.moves = 0; this.selected = null;
    this.guided = this.level.level === 1;
    this.hintPair = this.guided ? solve(this.state(), HELPERS.hintLimit).path?.[0] ?? null : null;
  }
  applyHint(result: SolveResult, inventory: number): { status: 'ok' | 'ad' | 'unsolvable' | 'timeout'; inventory: number; source?: 'free' | 'inventory' } {
    if (this.hintFree <= 0 && inventory <= 0) return { status: 'ad', inventory };
    if (!result.path?.length) return { status: result.unsolvable ? 'unsolvable' : 'timeout', inventory };
    const move = result.path[0];
    if (!canPour(this.state(), ...move)) return { status: 'timeout', inventory };
    const source = this.hintFree > 0 ? 'free' : 'inventory';
    if (source === 'free') this.hintFree--; else inventory--;
    this.usedHints++; this.hintPair = move; this.selected = null;
    return { status: 'ok', inventory, source };
  }
}
