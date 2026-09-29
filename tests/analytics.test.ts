import { describe, expect, it } from 'vitest';
import { recentEvents, track } from '../src/services/analytics';

describe('analytics event privacy', () => {
  it('keeps only expected event fields and enum values, never free-form shop text', () => {
    track('shop_named', { skipped: false, len: 8, suggested: true, shop: 'Baraka', theme: 'Baraka' });
    const event = recentEvents().at(-1)!;
    expect(event.event).toBe('shop_named');
    expect(event.params).toEqual({ skipped: false, len: 8, suggested: true });
  });

  it('drops events outside the analytics spec', () => {
    const before = recentEvents().length;
    track('debug_reset', { level: 3 });
    expect(recentEvents()).toHaveLength(before);
  });
});
