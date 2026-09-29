/** Original debug-only plucked-string sketch. Final licensed oud music is Phase 10. */
export function placeholderOudUrl(): string {
  const rate = 22050, seconds = 12, samples = rate * seconds;
  const bytes = new Uint8Array(44 + samples * 2), view = new DataView(bytes.buffer);
  const write = (offset: number, value: string) => [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
  write(0, 'RIFF'); view.setUint32(4, bytes.length - 8, true); write(8, 'WAVE'); write(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  write(36, 'data'); view.setUint32(40, samples * 2, true);
  const notes = [146.83, 174.61, 196, 220, 196, 174.61, 164.81, 146.83, 130.81, 146.83, 174.61, 164.81];
  for (let i = 0; i < samples; i++) {
    const time = i / rate, beat = Math.floor(time), age = time - beat;
    const envelope = Math.min(1, age / .008) * Math.exp(-5 * age);
    let value = 0;
    for (let harmonic = 1; harmonic <= 5; harmonic++) value += Math.sin(2 * Math.PI * notes[beat] * harmonic * age) / harmonic ** 1.5;
    view.setInt16(44 + i * 2, Math.round(value * envelope * 7000), true);
  }
  let raw = ''; for (const byte of bytes) raw += String.fromCharCode(byte);
  return `data:audio/wav;base64,${btoa(raw)}`;
}
