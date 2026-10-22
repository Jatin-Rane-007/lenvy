/**
 * Appearance preference — three states, not two. `system` defers to the OS;
 * the two pins let someone keep Lenvy dark while the phone is light, which is
 * the only reason this control exists. `resolveScheme` is the single place
 * the preference and the OS are collapsed into a scheme; nothing else should
 * branch on both.
 */

export type Scheme = 'light' | 'dark';

export type ThemePreference = 'system' | Scheme;

export type ThemePreferenceOption = {
  key: ThemePreference;
  label: string;
};

/** Short enough to fit three slots at 44 pt on a 360 dp phone. */
export const themePreferenceOptions: readonly ThemePreferenceOption[] = [
  { key: 'system', label: 'System' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
];

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function resolveScheme(
  preference: ThemePreference,
  systemScheme: string | null | undefined,
): Scheme {
  if (preference !== 'system') return preference;
  return systemScheme === 'dark' ? 'dark' : 'light';
}
