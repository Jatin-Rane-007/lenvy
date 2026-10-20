import { useAuth } from "@clerk/expo";
import { Redirect, Stack } from "expo-router";

export default function RootGroupLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  // Clerk is restoring the session from the token cache.
  if (!isLoaded) return null;

  // Gate the whole app behind authentication.
  if (!isSignedIn) return <Redirect href="/sign-in" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
