import { File, Paths } from 'expo-file-system';

/**
 * The appearance preference is the one setting that has to resolve before the
 * first frame — an async read would paint parchment and then correct itself to
 * slate on every launch for a dark-mode user. `textSync`/`writeSync` keep it
 * off the async path; the payload is a single quoted word.
 *
 * Kept dumb on purpose: it stores and returns a raw string, and validation
 * lives with the type in `@/theme/preference`. `themePreference.web.ts`
 * replaces this file on web.
 */
const file = new File(Paths.document, 'lenvy-theme.json');

export function readStoredThemePreference(): string | null {
  try {
    if (!file.exists) return null;
    const value: unknown = JSON.parse(file.textSync());
    return typeof value === 'string' ? value : null;
  } catch {
    // A corrupt or unreadable file must never block launch.
    return null;
  }
}

export function writeStoredThemePreference(preference: string): void {
  try {
    if (!file.exists) file.create({ intermediates: true });
    file.writeSync(JSON.stringify(preference));
  } catch {
    // Persistence is best-effort; the in-memory choice still applies.
  }
}
