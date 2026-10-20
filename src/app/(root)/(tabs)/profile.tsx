import { useAuth, useUser } from "@clerk/expo";
import { ScrollView, View } from "react-native";

import { useTheme } from "@/theme";
import type { ColorTokens } from "@/theme/semantic";
import { Dip, Enter } from "@components/animated";
import { PlatformIcon, type LucideIconName } from "@components/icons";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Screen,
  Text,
} from "@components/primitives";

/**
 * Profile — identity comes from Clerk; the ledger settings rows (currency,
 * accounts, budget, export) are the surfaces the feature passes will fill.
 * Sign out is live now. Rows carry tinted icon circles and dip on press,
 * matching the capture rows on Add.
 */
export default function ProfileScreen() {
  const t = useTheme();
  const { user } = useUser();
  const { signOut } = useAuth();

  const name = user?.fullName ?? "Your profile";
  const email =
    user?.primaryEmailAddress?.emailAddress ?? "No email on this account";

  const rows: {
    key: string;
    label: string;
    value: string;
    ios: string;
    lucide: LucideIconName;
    tint: keyof ColorTokens;
  }[] = [
    {
      key: "currency",
      label: "Currency",
      value: "Set in onboarding",
      ios: "globe",
      lucide: "Landmark",
      tint: "info",
    },
    {
      key: "accounts",
      label: "Accounts",
      value: "None yet",
      ios: "creditcard",
      lucide: "Wallet",
      tint: "accent",
    },
    {
      key: "budget",
      label: "Monthly budget",
      value: "Not set",
      ios: "gauge.medium",
      lucide: "Gauge",
      tint: "caution",
    },
    {
      key: "export",
      label: "Export CSV",
      value: "Recent transactions",
      ios: "square.and.arrow.up",
      lucide: "Download",
      tint: "positive",
    },
  ];

  return (
    <Screen edges={["top"]}>
      <ScrollView
        style={{ flex: 1, backgroundColor: t.colors.canvas }}
        contentContainerStyle={{
          padding: t.spacing[5],
          paddingBottom: t.spacing[11],
        }}
      >
        <Box style={{ paddingTop: t.spacing[2], gap: t.spacing[7] }}>
          {/* Identity header */}
          <Enter>
            <Box
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: t.spacing[4],
              }}
            >
              <Avatar name={name} uri={user?.imageUrl} size="lg" />
              <Box style={{ flex: 1, gap: 2 }}>
                <Text variant="subhead" tone="ink" numberOfLines={1}>
                  {name}
                </Text>
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  {email}
                </Text>
              </Box>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: `${t.colors.info}1F`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PlatformIcon
                  ios="person.crop.circle.fill"
                  lucide="User"
                  size={20}
                  color={t.colors.info}
                />
              </View>
            </Box>
          </Enter>

          {/* Ledger settings rows — Soon badges, honest placeholders */}
          <Box gap={t.spacing[3]}>
            {rows.map((row, i) => (
              <Enter key={row.key} delay={80 + i * 70}>
                <Dip onPress={() => {}}>
                  <Box
                    surface="surface"
                    level="L1"
                    radius="md"
                    pad={t.spacing[4]}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: t.spacing[4],
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: `${t.colors[row.tint]}1F`,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <PlatformIcon
                        ios={row.ios}
                        lucide={row.lucide}
                        size={19}
                        color={t.colors[row.tint]}
                      />
                    </View>
                    <Box style={{ flex: 1, gap: 2 }}>
                      <Text variant="body" tone="ink">
                        {row.label}
                      </Text>
                      <Text variant="micro" tone="subtle">
                        {row.value}
                      </Text>
                    </Box>
                    <Badge label="Soon" tone="muted" />
                    <PlatformIcon
                      ios="chevron.right"
                      lucide="ChevronRight"
                      size={16}
                      color={t.colors.inkSubtle}
                    />
                  </Box>
                </Dip>
              </Enter>
            ))}
          </Box>

          {/* Session */}
          <Enter delay={400} style={{ gap: t.spacing[3] }}>
            <Divider />
            <Button
              label="Sign out"
              variant="secondary"
              fullWidth
              onPress={() => void signOut()}
            />
          </Enter>

          <Enter delay={480}>
            <Text variant="caption" tone="subtle" align="center">
              Every number has a purpose.
            </Text>
          </Enter>
        </Box>
      </ScrollView>
    </Screen>
  );
}
