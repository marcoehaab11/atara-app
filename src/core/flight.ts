import { MOTION } from '../config';
import { mulberry32 } from './rng';

export interface Point { x: number; y: number }
export interface FlightFrame extends Point { rotation: number; at: number }
export const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
export function rotatePoint(point: Point, origin: Point, degrees: number): Point {
  const r = degrees * Math.PI / 180;
  return { x: origin.x + point.x * Math.cos(r) - point.y * Math.sin(r), y: origin.y + point.x * Math.sin(r) + point.y * Math.cos(r) };
}
export function flightFrames(start: Point, end: Point, sourceMouth: Point, targetMouth: Point, rotation: number, tilt: number, seed: number): FlightFrame[] {
  const random = mulberry32(seed), spin = (random() < .5 ? -1 : 1) * (MOTION.spinMin + random() * MOTION.spinRange), jitter = (random() * 2 - 1) * MOTION.jitter;
  return [
    { ...start, rotation: rotation + tilt, at: 0 },
    { x: sourceMouth.x + jitter, y: sourceMouth.y - 8, rotation: rotation + tilt + spin * .3, at: .22 },
    { x: (sourceMouth.x + targetMouth.x) / 2 + jitter, y: Math.min(sourceMouth.y, targetMouth.y) - MOTION.apexHeight, rotation: rotation + tilt + spin * .65, at: .55 },
    { x: targetMouth.x + jitter * .4, y: targetMouth.y - 6, rotation: rotation + spin * .15, at: .84 },
    { ...end, rotation, at: 1 },
  ];
}
export function sampleFlight(frames: readonly FlightFrame[], progress: number): Omit<FlightFrame, 'at'> {
  const t = easeInOut(Math.max(0, Math.min(1, progress)));
  let index = 1;
  while (index < frames.length - 1 && frames[index].at < t) index++;
  const a = frames[index - 1], b = frames[index], mix = (t - a.at) / (b.at - a.at);
  return { x: a.x + (b.x - a.x) * mix, y: a.y + (b.y - a.y) * mix, rotation: a.rotation + (b.rotation - a.rotation) * mix };
}
export const flightStagger = (pieces: number) => Math.min(MOTION.staggerMaxMs, MOTION.staggerTotalMs / Math.max(1, pieces));
export function landingScale(progress: number): number {
  const t = Math.max(0, Math.min(1, progress));
  return t < .5 ? 1.3 + (.92 - 1.3) * t * 2 : .92 + .08 * (t - .5) * 2;
}

/** An idempotent completion gate used for natural finish, tap-skip and resize. */
export class CompletionGate {
  private done = false;
  constructor(private readonly settle: () => void) {}
  finish(): void { if (!this.done) { this.done = true; this.settle(); } }
}
