import '@/global.css';
import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { DarkTheme, DefaultTheme, Slot, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@components/animated-icon';
import { ThemeProvider as LenvyThemeProvider, useLenvyFonts } from '@/theme';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

if (!publishableKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Add your key to .env.local.\nRun: 1) clerk auth login  2) clerk link  3) clerk env pull — then restart the dev server.',
  );
}

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(root)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useLenvyFonts();

  // Surface font failures loudly; a silent fallback to system fonts would
  // hide a broken build.
  if (fontError) throw fontError;

  const navTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <SafeAreaProvider>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <LenvyThemeProvider>
          <ThemeProvider value={navTheme}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            {fontsLoaded ? (
              <>
                <AnimatedSplashOverlay />
                <Slot />
              </>
            ) : null}
          </ThemeProvider>
        </LenvyThemeProvider>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}
