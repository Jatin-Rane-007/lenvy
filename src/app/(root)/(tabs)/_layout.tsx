import { Tabs } from "expo-router";

import { LenvyTabBar } from "@components/tab-bar";

/**
 * Five-tab bottom bar — locked by DESIGN.md "Navigation shape". Rendered by
 * our own LenvyTabBar: morphing accent pill on spring.gentle, SF Symbols on
 * iOS / Lucide on Android+Web, and the Add tab as a floating accent FAB.
 */
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <LenvyTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="transactions" options={{ title: "Transactions" }} />
      <Tabs.Screen name="add" options={{ title: "Add" }} />
      <Tabs.Screen name="assistant" options={{ title: "Assistant" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
