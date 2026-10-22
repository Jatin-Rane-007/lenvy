import "@/global.css";
import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect, useMemo } from "react";
import { Appearance, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AnimatedSplashOverlay } from "@components/animated-icon";
import { queryClient } from "@lib/query/client";
import { useThemeStore } from "@store/themeStore";
import { ThemeProvider as LenvyThemeProvider, useLenvyFonts, useTheme } from "@/theme";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

if (!publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Add your key to .env.local.\nRun: 1) clerk auth login  2) clerk link  3) clerk env pull — then restart the dev server.",
  );
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const preference = useThemeStore((state) => state.preference);
  const [fontsLoaded, fontError] = useLenvyFonts();

  // Surface font failures loudly; a silent fallback to system fonts would
  // hide a broken build.
  if (fontError) throw fontError;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
          <QueryClientProvider client={queryClient}>
            <LenvyThemeProvider preference={preference}>
              <AppShell fontsLoaded={fontsLoaded} />
            </LenvyThemeProvider>
          </QueryClientProvider>
        </ClerkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Everything below the theme provider. Split out so the navigator, the status
 * bar, and the native window all read the same resolved scheme instead of
 * each calling `useColorScheme()` and drifting apart when the user pins one.
 */
function AppShell({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { preference, scheme, colors } = useTheme();

  // Native chrome drawn outside our tree — iOS alerts, the keyboard, system
  // pickers — follows the resolved scheme. `unspecified` hands control back to
  // the OS so a `system` user keeps following it.
  useEffect(() => {
    try {
      Appearance.setColorScheme(preference === "system" ? "unspecified" : preference);
    } catch {
      // Not available on every platform; the JS palette has already switched.
    }
  }, [preference]);

  // The window sits behind our screens during transitions and under every
  // translucent surface. Keep it on the active canvas rather than the light
  // value baked into app.json.
  useEffect(() => {
    if (Platform.OS === "web") return;
    SystemUI.setBackgroundColorAsync(colors.canvas).catch(() => {});
  }, [colors.canvas]);

  // Navigator chrome inherits the palette so screen transitions never flash a
  // white card between two dark screens.
  const navTheme = useMemo(() => {
    const base = scheme === "dark" ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: colors.canvas,
        card: colors.surface,
        text: colors.ink,
        border: colors.hairline,
        primary: colors.accent,
      },
    };
  }, [scheme, colors]);

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      {fontsLoaded ? (
        <>
          <AnimatedSplashOverlay />
          <Stack screenOptions={{ headerShown: false }} />
        </>
      ) : null}
    </ThemeProvider>
  );
}
