export type UserTier = 'free' | 'pro' | 'diamond';

export interface TierUsageData {
  tier: UserTier;
  dailyUsageCount: number;
  lastResetTimestamp: number; // ms timestamp of midnight reset
  licenseKey?: string;
  maxFreeDailyCredits: number;
}

const DEFAULT_FREE_CREDITS = 10;
const STORAGE_KEY = 'katalyst_user_tier_data';

export function getTierData(): TierUsageData {
  if (typeof window === 'undefined') {
    return {
      tier: 'free',
      dailyUsageCount: 0,
      lastResetTimestamp: Date.now(),
      maxFreeDailyCredits: DEFAULT_FREE_CREDITS
    };
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  let data: TierUsageData;

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = {
        tier: 'free',
        dailyUsageCount: 0,
        lastResetTimestamp: Date.now(),
        maxFreeDailyCredits: DEFAULT_FREE_CREDITS
      };
    }
  } else {
    data = {
      tier: 'free',
      dailyUsageCount: 0,
      lastResetTimestamp: Date.now(),
      maxFreeDailyCredits: DEFAULT_FREE_CREDITS
    };
  }

  // Check if reset is required (new day)
  const lastDate = new Date(data.lastResetTimestamp).toDateString();
  const currentDate = new Date().toDateString();

  if (lastDate !== currentDate) {
    data.dailyUsageCount = 0;
    data.lastResetTimestamp = Date.now();
    saveTierData(data);
  }

  // Set default Architect key for Johnnie Raymond Hammons Junior if not explicitly set to guest mode
  if (typeof window !== 'undefined') {
    if (!localStorage.getItem('architect_key') && !localStorage.getItem('is_guest_observer')) {
      localStorage.setItem('architect_key', 'ORIGIN_929');
    }
  }

  // Override tier if architect key is present in localStorage
  if (typeof window !== 'undefined' && localStorage.getItem('architect_key')) {
    data.tier = 'diamond';
  }

  return data;
}

export function saveTierData(data: TierUsageData): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('tier_data_updated'));
  }
}

export function incrementUsage(): { success: boolean; remaining: number; resetTimeFormatted: string } {
  const data = getTierData();
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const diffMs = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const resetTimeFormatted = `${hours}h ${minutes}m`;

  if (data.tier !== 'free') {
    return { success: true, remaining: 9999, resetTimeFormatted };
  }

  if (data.dailyUsageCount >= data.maxFreeDailyCredits) {
    return { success: false, remaining: 0, resetTimeFormatted };
  }

  data.dailyUsageCount += 1;
  saveTierData(data);
  const remaining = Math.max(0, data.maxFreeDailyCredits - data.dailyUsageCount);
  return { success: true, remaining, resetTimeFormatted };
}

export function activateLicenseKey(key: string): { success: boolean; message: string; tier: UserTier } {
  const cleanKey = key.trim().toUpperCase();
  const data = getTierData();

  if (cleanKey.includes('DIAMOND') || cleanKey.includes('HAMMONS') || cleanKey === 'ORIGIN_929' || cleanKey.includes('PREDICT')) {
    data.tier = 'diamond';
    data.licenseKey = cleanKey;
    saveTierData(data);
    return {
      success: true,
      message: 'Hammons Omnipoint Diamond Edition License Activated! Full Time Diamond Business Prediction Model Unlocked.',
      tier: 'diamond'
    };
  }

  if (cleanKey.includes('PRO') || cleanKey.includes('WRAPPER') || cleanKey.includes('BUILD')) {
    data.tier = 'pro';
    data.licenseKey = cleanKey;
    saveTierData(data);
    return {
      success: true,
      message: 'Architect Pro Tier Activated! System Wrapper & Build Features Unlocked.',
      tier: 'pro'
    };
  }

  return {
    success: false,
    message: 'Invalid or unrecognized License Key. Enter PRO_BUILDER, DIAMOND_PREDICT, or upgrade via Stripe Checkout.',
    tier: data.tier
  };
}

export function setTierDirectly(tier: UserTier): void {
  const data = getTierData();
  data.tier = tier;
  saveTierData(data);
}

export function getTimeUntilResetFormatted(): string {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const diffMs = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}
