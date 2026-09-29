import { mulberry32 } from '../core/rng';
export type Effect = 'select' | 'pour' | 'hard' | 'soft' | 'invalid' | 'complete' | 'win' | 'coin' | 'cat';
const effects: Record<Effect, { notes: number[]; duration: number; noise: number }> = {
  cat: { notes: [640, 820, 710, 480], duration: .48, noise: .03 },
  select: { notes: [520], duration: .07, noise: 0 }, pour: { notes: [170], duration: .18, noise: .7 },
  hard: { notes: [1500], duration: .035, noise: .3 }, soft: { notes: [320], duration: .05, noise: .5 },
  invalid: { notes: [95], duration: .15, noise: .15 }, complete: { notes: [523, 784], duration: .26, noise: 0 },
  win: { notes: [523, 659, 784, 1047], duration: .55, noise: 0 }, coin: { notes: [988, 1319], duration: .19, noise: 0 },
};
export const EFFECTS = Object.keys(effects) as Effect[];
/** Original mono PCM effects, synthesized once at boot; no external recordings. */
export function synthesizeWav(effect: Effect): Uint8Array {
  const def = effects[effect], rate = 22050, count = Math.ceil(rate * def.duration);
  const bytes = new Uint8Array(44 + count * 2), data = new DataView(bytes.buffer);
  const ascii = (offset: number, value: string) => [...value].forEach((char, i) => data.setUint8(offset + i, char.charCodeAt(0)));
  ascii(0, 'RIFF'); data.setUint32(4, 36 + count * 2, true); ascii(8, 'WAVE'); ascii(12, 'fmt ');
  data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, 1, true);
  data.setUint32(24, rate, true); data.setUint32(28, rate * 2, true); data.setUint16(32, 2, true); data.setUint16(34, 16, true);
  ascii(36, 'data'); data.setUint32(40, count * 2, true);
  const random = mulberry32(EFFECTS.indexOf(effect) + 37);
  const noteLength = def.duration / def.notes.length;
  for (let i = 0; i < count; i++) {
    const time = i / rate, note = Math.min(def.notes.length - 1, Math.floor(time / noteLength)), local = time % noteLength;
    const envelope = Math.min(1, local / .004) * Math.exp(-6 * local / noteLength);
    const tone = Math.sin(2 * Math.PI * def.notes[note] * time), noise = random() * 2 - 1;
    data.setInt16(44 + i * 2, Math.round((tone * (1 - def.noise) + noise * def.noise) * envelope * 9000), true);
  }
  return bytes;
}
export function wavUrl(effect: Effect): string {
  const bytes = synthesizeWav(effect);
  let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:audio/wav;base64,${btoa(binary)}`;
}
