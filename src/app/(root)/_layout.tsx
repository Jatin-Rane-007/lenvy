import { useUserSync } from "@/hooks/useUserSync";
import { useUserStore } from "@/store/userStore";
import { useTheme } from "@/theme";
import { useAuth } from "@clerk/expo";
import { Redirect, Stack, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function RootGroupLayout() {
  const t = useTheme();
  const { isSignedIn, isLoaded } = useAuth();
  const needsOnboarding = useUserStore((state) => state.needsOnboarding);
  const pathname = usePathname();
  const [minLoadDone, setMinLoadDone] = useState(false);

  useUserSync();

  useEffect(() => {
    const t = setTimeout(() => setMinLoadDone(true), 1500);
    return () => clearTimeout(t);
  }, []);

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/sign-in" />;
  if (!minLoadDone || needsOnboarding === null)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: t.colors.canvas,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={t.colors.accent} />
      </View>
    );
  if (needsOnboarding && pathname !== "/onboarding")
    return <Redirect href="/onboarding" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
