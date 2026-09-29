import { describe, expect, it, vi } from 'vitest';
import { CompletionGate, flightFrames, flightStagger, landingScale, sampleFlight } from '../src/core/flight';
import { newPlayer, readPlayer } from '../src/meta/player';
import { EFFECTS, synthesizeWav } from '../src/services/synth';

describe('pour presentation', () => {
  it('starts at the tilted source and lands exactly on the final layout', () => {
    const frames = flightFrames({ x: 5, y: 30 }, { x: 200, y: 100 }, { x: 20, y: 10 }, { x: 200, y: 20 }, 17, 24, 9);
    expect(sampleFlight(frames, 0)).toEqual({ x: 5, y: 30, rotation: 41 });
    expect(sampleFlight(frames, 1)).toEqual({ x: 200, y: 100, rotation: 17 });
    expect(frames.map(f => f.at)).toEqual([0, .22, .55, .84, 1]);
    expect(frames[2].y).toBe(-30);
    expect(Math.abs(frames[1].x - 20)).toBeLessThanOrEqual(8);
    expect(flightStagger(24)).toBe(17.5);
    expect([landingScale(0), landingScale(.5), landingScale(1)]).toEqual([1.3, .92, 1]);
  });
  it('settles only once when skip, resize and natural completion compete', () => {
    const settle = vi.fn(), gate = new CompletionGate(settle);
    gate.finish(); gate.finish(); gate.finish(); expect(settle).toHaveBeenCalledTimes(1);
  });
  it('migrates old saves without losing progress and respects reduced motion defaults', () => {
    const { motion: _motion, sound: _sound, ...old } = newPlayer();
    void _motion; void _sound;
    old.level = 17; old.maxLevel = 17; old.coins = 420;
    expect(readPlayer(JSON.stringify(old), true)).toMatchObject({ level: 17, coins: 420, motion: false, sound: true });
    expect(readPlayer(null, true).motion).toBe(false);
    expect(readPlayer(JSON.stringify({ ...old, motion: true, sound: false }), true)).toMatchObject({ motion: true, sound: false });
  });
  it.each(EFFECTS)('generates a valid bounded deterministic PCM effect: %s', effect => {
    const bytes = synthesizeWav(effect), view = new DataView(bytes.buffer);
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe('RIFF');
    expect(view.getUint32(4, true)).toBe(bytes.length - 8);
    expect(view.getUint32(40, true)).toBe(bytes.length - 44);
    expect(view.getUint32(24, true)).toBe(22050);
    for (let i = 44; i < bytes.length; i += 2) expect(Math.abs(view.getInt16(i, true))).toBeLessThanOrEqual(9000);
    expect(synthesizeWav(effect)).toEqual(bytes);
  });
});
