/**
 * Web build of the appearance preference store. `localStorage` is synchronous
 * by spec, so the first render already knows the answer — same contract as the
 * native file, no hydration gate on either platform.
 */
const KEY = 'lenvy.theme';

export function readStoredThemePreference(): string | null {
  try {
    return globalThis.localStorage?.getItem(KEY) ?? null;
  } catch {
    // Safari private mode throws on access rather than returning null.
    return null;
  }
}

export function writeStoredThemePreference(preference: string): void {
  try {
    globalThis.localStorage?.setItem(KEY, preference);
  } catch {
    // Persistence is best-effort; the in-memory choice still applies.
  }
}
