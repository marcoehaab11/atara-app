import { SHOP_NAME } from '../config';
export function cleanShopName(input: string): string {
  return input.normalize('NFC').trim().replace(/\s+/gu, ' ').replace(/^(?:عطارة|عطاره)(?:\s+|$)/u, '').trim();
}
export function validateShopName(input: string): { value: string; error: 'name.err.short' | 'name.err.long' | 'name.err.chars' | null } {
  const value = cleanShopName(input), length = [...value].length;
  if (length < SHOP_NAME.min) return { value, error: 'name.err.short' };
  if (length > SHOP_NAME.max) return { value, error: 'name.err.long' };
  const valid = [...value].every(char => char === ' ' || /\p{Nd}/u.test(char) || (/\p{L}/u.test(char) && /[\p{Script=Arabic}\p{Script=Latin}]/u.test(char)));
  return { value, error: valid ? null : 'name.err.chars' };
}
