import { Platform } from 'react-native';

import type { Scheme } from './preference';

/**
 * Web only. `global.css` keys its dark palette off `html[data-theme='dark']`
 * instead of a `prefers-color-scheme` query, so an explicit in-app pin beats
 * the OS. `color-scheme` is set alongside it to keep browser-native chrome
 * (scrollbars, overscroll, form controls) in the same scheme.
 *
 * No-op on native, where nothing reads the attribute.
 */
export function applyWebScheme(scheme: Scheme): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.theme = scheme;
  root.style.colorScheme = scheme;
}
