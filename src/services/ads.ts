import { Capacitor } from '@capacitor/core';
import { MONETIZATION } from '../config';

const native = Capacitor.isNativePlatform();
let consentReady: Promise<boolean> | null = null;
let sdkReady: Promise<boolean> | null = null;

async function initializeNativeAds(): Promise<boolean> {
  if (!native) return false;
  sdkReady ??= (async () => {
    const { AdMob, MaxAdContentRating } = await import('@capacitor-community/admob');
    await AdMob.initialize({ maxAdContentRating: MaxAdContentRating.Teen });
    return true;
  })().catch(() => false);
  return sdkReady;
}

async function prepareNativeAds(): Promise<boolean> {
  if (!await initializeNativeAds()) return false;
  consentReady ??= (async () => {
    const { AdMob, AdmobConsentStatus } = await import('@capacitor-community/admob');
    let info = await AdMob.requestConsentInfo();
    if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) info = await AdMob.showConsentForm();
    return info.canRequestAds;
  })().catch(() => false);
  return consentReady;
}

/** Returns true only after the native plugin confirms its earned-reward callback. */
export async function showRewardedAd(): Promise<boolean> {
  if (!native) { await new Promise(resolve => window.setTimeout(resolve, 650)); return true; }
  if (!await prepareNativeAds()) return false;
  const { AdMob } = await import('@capacitor-community/admob');
  try {
    await AdMob.setApplicationMuted({ muted: true });
    await AdMob.prepareRewardVideoAd({ adId: MONETIZATION.testRewardedId, isTesting: true });
    const reward = await AdMob.showRewardVideoAd();
    return reward.amount > 0;
  } catch { return false; }
  finally { await AdMob.setApplicationMuted({ muted: false }).catch(() => undefined); }
}

export async function showInterstitialAd(): Promise<boolean> {
  if (!native || !await prepareNativeAds()) return false;
  const { AdMob } = await import('@capacitor-community/admob');
  try {
    await AdMob.setApplicationMuted({ muted: true });
    await AdMob.prepareInterstitial({ adId: MONETIZATION.testInterstitialId, isTesting: true });
    await AdMob.showInterstitial();
    return true;
  } catch { return false; }
  finally { await AdMob.setApplicationMuted({ muted: false }).catch(() => undefined); }
}

export async function showPrivacyOptions(): Promise<boolean> {
  if (!native || !await initializeNativeAds()) return false;
  const { AdMob } = await import('@capacitor-community/admob');
  try { await AdMob.showPrivacyOptionsForm(); consentReady = null; return true; } catch { return false; }
}

export const isNativeAdsPlatform = native;
