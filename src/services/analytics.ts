import { Capacitor } from '@capacitor/core';

const native = Capacitor.isNativePlatform();
const eventNames = new Set([
  'app_open', 'shop_named', 'shop_renamed', 'level_start', 'level_complete', 'level_restart', 'stuck_shown',
  'hint_used', 'rewarded_offer', 'rewarded_complete', 'interstitial_shown', 'shop_purchase', 'iap_purchase',
  'theme_change', 'order_complete', 'order_fail', 'daily_reward_claim', 'daily_challenge_start',
  'daily_challenge_complete', 'starter_offer_shown', 'review_requested', 'reminder_permission', 'reminder_opened',
]);
const permitted = new Set([
  'level', 'returning', 'skipped', 'len', 'suggested', 'type', 'order', 'moves', 'par', 'stars', 'hints',
  'undos', 'mode', 'src', 'item', 'price', 'sku', 'theme', 'reward', 'day', 'date', 'streak', 'placement', 'result',
]);
const stringParams: Record<string, readonly string[]> = {
  type: ['tutorial', 'rest', 'normal', 'hard'], order: ['none', 'done', 'missed'], src: ['free', 'inventory', 'ad'],
  item: ['plant', 'scale', 'tray', 'radio', 'cat', 'lantern', 'chili', 'sign'],
  sku: ['remove_ads', 'hints_10', 'starter_pack'],
  theme: ['auto', 'normal', 'ramadan', 'eid', 'spring'],
  placement: ['undo', 'hint', 'extra_jar', 'double_coins'], result: ['granted', 'denied'],
};
const booleanParams = new Set(['returning', 'skipped', 'suggested']);
const recent: { event: string; params: Record<string, string | number | boolean> }[] = [];
let firebaseAnalytics: typeof import('@capacitor-firebase/analytics').FirebaseAnalytics | null = null;
let nativeConsentReady = false;
const pendingNative: { event: string; params: Record<string, string | number | boolean> }[] = [];

export const recentEvents = () => recent.slice();

/** Initialize Firebase with analytics storage denied until UMP has updated consent mode. */
export async function initializeNativeAnalytics(): Promise<boolean> {
  if (!native) return false;
  try {
    const plugin = await import('@capacitor-firebase/analytics');
    await plugin.FirebaseAnalytics.setConsent({ type: plugin.ConsentType.AnalyticsStorage, status: plugin.ConsentStatus.Denied });
    firebaseAnalytics = plugin.FirebaseAnalytics;
    return true;
  } catch {
    return false;
  }
}

export function setNativeAnalyticsConsentReady(ready: boolean) {
  nativeConsentReady = ready && firebaseAnalytics !== null;
  if (!nativeConsentReady) { pendingNative.length = 0; return; }
  for (const item of pendingNative.splice(0)) logNative(item.event, item.params);
}

function logNative(event: string, params: Record<string, string | number | boolean>) {
  if (firebaseAnalytics) void firebaseAnalytics.logEvent({ name: event, params }).catch(() => undefined);
}

export function track(event: string, params: Record<string, string | number | boolean> = {}): void {
  if (!eventNames.has(event)) return;
  const sanitized = Object.fromEntries(Object.entries(params).filter(([key, value]) => {
    if (!permitted.has(key)) return false;
    if (typeof value === 'string') return stringParams[key]?.includes(value) ?? false;
    if (typeof value === 'boolean') return booleanParams.has(key);
    return Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000;
  }));
  if (import.meta.env.DEV) {
    recent.push({ event, params: sanitized });
    if (recent.length > 20) recent.shift();
    console.info('[Attar analytics]', event, sanitized);
  }
  if (!native) return;
  if (nativeConsentReady) logNative(event, sanitized);
  else {
    pendingNative.push({ event, params: sanitized });
    if (pendingNative.length > 20) pendingNative.shift();
  }
}
