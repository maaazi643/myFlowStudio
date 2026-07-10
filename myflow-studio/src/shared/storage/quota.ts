/**
 * Guardrails for the two storage tiers. chrome.storage.local is meant for
 * small settings/metadata only — this lets callers warn well before the
 * quota is actually hit, rather than failing on a write.
 */

const WARNING_THRESHOLD = 0.8;

export async function getChromeStorageUsageRatio(): Promise<number> {
  const bytesInUse = await chrome.storage.local.getBytesInUse();
  const quota = chrome.storage.local.QUOTA_BYTES;
  return quota > 0 ? bytesInUse / quota : 0;
}

export async function isChromeStorageNearQuota(): Promise<boolean> {
  return (await getChromeStorageUsageRatio()) >= WARNING_THRESHOLD;
}

/** IndexedDB has no fixed quota API — this reflects the browser's own estimate. */
export async function getIndexedDbUsageRatio(): Promise<number> {
  const { usage, quota } = await navigator.storage.estimate();
  if (!quota) {
    return 0;
  }
  return (usage ?? 0) / quota;
}
