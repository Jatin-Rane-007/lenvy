import {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';

/**
 * Family names registered here match `fontFamilies` in tokens.ts. Each
 * weight registers under its own alias so RN honours the correct face on
 * both iOS and Android without needing variable-font plumbing.
 */
export const lenvyFontMap = {
  Fraunces: Fraunces_400Regular,
  'Fraunces-Medium': Fraunces_500Medium,
  'Fraunces-SemiBold': Fraunces_600SemiBold,
  'Fraunces-Bold': Fraunces_700Bold,
  Inter: Inter_400Regular,
  'Inter-Medium': Inter_500Medium,
  'Inter-SemiBold': Inter_600SemiBold,
  'Inter-Bold': Inter_700Bold,
  'JetBrainsMono-Medium': JetBrainsMono_500Medium,
} as const;

export function useLenvyFonts() {
  return useFonts(lenvyFontMap);
}
