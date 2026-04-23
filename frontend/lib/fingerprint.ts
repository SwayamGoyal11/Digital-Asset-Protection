/**
 * FingerprintJS wrapper.
 * Loads the free open-source FingerprintJS and returns a stable visitorId.
 */

import FingerprintJS from '@fingerprintjs/fingerprintjs';

let cachedVisitorId: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cachedVisitorId) return cachedVisitorId;

  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    cachedVisitorId = result.visitorId;
    return cachedVisitorId;
  } catch {
    // Fallback: generate a stable ID from browser attributes
    const fallback = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
    ].join('|');

    const hash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(fallback)
    );
    cachedVisitorId = Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 32);
    return cachedVisitorId;
  }
}
