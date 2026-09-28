import { SPICES } from '../content/spices';
import { mulberry32 } from './rng';

export function pileLayout(layerId: number, seed: number, spice: number, layerHeight: number) {
  const data = SPICES[spice];
  if (!data || layerHeight <= 0) throw new RangeError('Invalid pile');
  const r = mulberry32(layerId * 97 + seed * 131 + 5);
  return Array.from({ length: data.count }, (_, i) => ({
    xPercent: (i + 0.5) / data.count * 100 + (r() - 0.5) * 10,
    yPercent: data.count >= 6 ? (i % 2 ? 30 : 70) + (r() - 0.5) * 14 : 50 + (r() - 0.5) * 26,
    rotation: (r() - 0.5) * 2 * data.rotation,
    size: layerHeight * data.scale * (0.88 + r() * 0.24),
  }));
}
