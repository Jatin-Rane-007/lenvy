import { create } from 'zustand';

import { isThemePreference, type ThemePreference } from '@/theme/preference';
import {
  readStoredThemePreference,
  writeStoredThemePreference,
} from '@lib/storage/themePreference';

/**
 * Read at module scope, not in an effect: the first frame has to know the
 * answer, otherwise a pinned dark theme would paint light and then correct
 * itself. Both storage backends (file on native, localStorage on web) are
 * synchronous, so there is no hydration flag to track.
 */
function initialPreference(): ThemePreference {
  const stored = readStoredThemePreference();
  return isThemePreference(stored) ? stored : 'system';
}

interface ThemeStore {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  preference: initialPreference(),
  setPreference: (preference) => {
    set({ preference });
    writeStoredThemePreference(preference);
  },
}));
