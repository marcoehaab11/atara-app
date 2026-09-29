const permitted = new Set(['level', 'returning', 'skipped', 'len', 'suggested', 'type', 'order', 'moves', 'par', 'stars', 'hints', 'undos', 'mode', 'src']);
export function track(event: string, params: Record<string, string | number | boolean> = {}): void {
  const sanitized = Object.fromEntries(Object.entries(params).filter(([key]) => permitted.has(key)));
  // Web mock only. No SDK, network call, shop name or other personal text.
  if (import.meta.env.DEV) console.info('[Attar analytics]', event, sanitized);
}
