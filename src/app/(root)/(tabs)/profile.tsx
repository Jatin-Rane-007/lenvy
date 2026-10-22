import { useAuth, useUser } from "@clerk/expo";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, View } from "react-native";

import { useTheme } from "@/theme";
import type { ColorRole } from "@/theme";
import type { Account } from "@/types/account";
import { Dip, Enter } from "@components/animated";
import { PlatformIcon, type LucideIconName } from "@components/icons";
import { Skeleton } from "@components/feedback/Skeleton";
import {
  Avatar,
  Badge,
  Box,
  Divider,
  Screen,
  Text,
  TintedGlyph,
} from "@components/primitives";
import { AccountFormSheet } from "@components/overlays/AccountFormSheet";
import { AppearanceControl } from "@components/form/AppearanceControl";
import { CurrencyPicker } from "@components/CurrencyPicker";
import { ACCOUNT_TYPE_META } from "@constants/accountTypes";
import type { Currency } from "@constants/currencies";
import {
  useDeleteAccount,
  useSetDefaultAccount,
} from "@hooks/mutations/useAccountMutation";
import { useAccountsQuery } from "@hooks/queries/useAccountsQuery";
import { useSupabase } from "@hooks/useSupabase";
import { formatPrice } from "@lib/utils";
import { useUserStore } from "@store/userStore";

/**
 * Profile — identity comes from Clerk and is editable (tap the avatar to swap
 * your photo); the card carries the live net across all accounts so "how am I
 * doing?" is answerable here too. Account rows open the editor on tap and a
 * manage menu on long-press (set default / delete). Below that: change the
 * ledger currency and appearance, and sign out as a grouped destructive row.
 * Rows carry tinted icon circles and dip on press, matching the capture rows
 * on Add. Anything not shipping stays honest with a "Soon" badge.
 */
export default function ProfileScreen() {
  const t = useTheme();
  const { user } = useUser();
  const { signOut } = useAuth();
  const supabase = useSupabase();

  const currency = useUserStore((state) => state.currency);
  const setCurrency = useUserStore((state) => state.setCurrency);

  const {
    data: accounts = [],
    isLoading: accountsLoading,
    isRefetching: accountsRefetching,
    isError: accountsError,
    refetch: refetchAccounts,
  } = useAccountsQuery();
  const setDefault = useSetDefaultAccount();
  const removeAccount = useDeleteAccount();

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const name = user?.fullName ?? "Your profile";
  const email =
    user?.primaryEmailAddress?.emailAddress ?? "No email on this account";

  const netWorth = useMemo(
    () => accounts.reduce((sum, account) => sum + account.balance, 0),
    [accounts],
  );

  const netLabel = accountsError
    ? "Net unavailable"
    : accounts.length === 0
      ? "No accounts yet"
      : `Net across ${accounts.length} account${accounts.length === 1 ? "" : "s"}`;

  const openCreate = () => {
    setEditingAccount(null);
    setSheetOpen(true);
  };

  const openEdit = (account: Account) => {
    setEditingAccount(account);
    setSheetOpen(true);
  };

  const handlePickAvatar = async () => {
    if (!user || uploadingAvatar) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Allow photo library access to set a profile picture.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const filename = asset.uri.split("/").pop() || "avatar.jpg";
    const ext = /\.(\w+)$/.exec(filename);
    const type = ext ? `image/${ext[1]}` : "image/jpeg";

    setUploadingAvatar(true);
    try {
      // Clerk's web types only list Blob | File; on native it also accepts a
      // RN image descriptor, so cast the object to that union.
      await user.setProfileImage({
        file: { uri: asset.uri, name: filename, type } as unknown as File,
      });
    } catch {
      Alert.alert("Error", "Couldn't upload your photo. Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCurrencySelect = async (selected: Currency) => {
    setCurrencyOpen(false);
    if (!user) return;
    try {
      const { error } = await supabase
        .from("users")
        .update({ currency: selected.code })
        .eq("clerk_id", user.id);
      if (error) throw error;
      setCurrency(selected.code);
    } catch {
      Alert.alert("Error", "Couldn't update your currency.");
    }
  };

  const confirmDelete = (account: Account) => {
    Alert.alert(
      "Delete account",
      `Delete ${account.name}? Any transactions recorded on it will be removed too. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            removeAccount.mutate(
              { accountId: account.id, force: true },
              {
                onError: () =>
                  Alert.alert("Error", "Couldn't delete the account."),
              },
            ),
        },
      ],
    );
  };

  const handleManageAccount = (account: Account) => {
    const options = [
      { text: "Edit", onPress: () => openEdit(account) },
      {
        text: "Delete",
        style: "destructive" as const,
        onPress: () => confirmDelete(account),
      },
      { text: "Cancel", style: "cancel" as const },
    ];
    if (!account.is_default) {
      options.splice(1, 0, {
        text: "Set as default",
        onPress: () =>
          setDefault.mutate(account.id, {
            onError: () => Alert.alert("Error", "Couldn't change the default."),
          }),
      });
    }
    Alert.alert(account.name, "Manage this account", options);
  };

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => void signOut(),
      },
    ]);
  };

  return (
    <Screen edges={["top"]}>
      <ScrollView
        style={{ flex: 1, backgroundColor: t.colors.canvas }}
        contentContainerStyle={{
          padding: t.spacing[5],
          paddingBottom: t.spacing[11],
          gap: t.spacing[7],
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={accountsRefetching}
            onRefresh={() => void refetchAccounts()}
            tintColor={t.colors.accent}
            colors={[t.colors.accent]}
          />
        }
      >
        {/* Identity — Clerk profile, avatar editable, live net across the ledger */}
        <Enter>
          <Box surface="surface" level="L1" radius="xl" pad={t.spacing[5]} gap={t.spacing[4]}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: t.spacing[4],
              }}
            >
              <Dip
                onPress={() => void handlePickAvatar()}
                accessibilityLabel="Change profile photo"
              >
                <View style={{ position: "relative" }}>
                  <Avatar name={name} uri={user?.imageUrl} size="lg" />
                  <View
                    style={{
                      position: "absolute",
                      right: -4,
                      bottom: -4,
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: t.colors.accent,
                      borderWidth: 2,
                      borderColor: t.colors.surface,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {uploadingAvatar ? (
                      <ActivityIndicator size="small" color={t.colors.accentInk} />
                    ) : (
                      <PlatformIcon
                        ios="camera.fill"
                        lucide="Plus"
                        size={12}
                        color={t.colors.accentInk}
                      />
                    )}
                  </View>
                </View>
              </Dip>
              <Box style={{ flex: 1, gap: 2 }}>
                <Text variant="subhead" tone="ink" numberOfLines={1}>
                  {name}
                </Text>
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  {email}
                </Text>
              </Box>
            </View>

            <Divider />

            {/* The one number this screen owns: the whole balance sheet, audited. */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: t.spacing[4],
              }}
            >
              <Text variant="caption" tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>
                {netLabel}
              </Text>
              {accountsLoading ? (
                <Skeleton height={26} width={104} radius={t.radii.xs} />
              ) : accountsError ? null : (
                <Text
                  variant="numericL"
                  tone={netWorth < 0 ? "negative" : "ink"}
                  numberOfLines={1}
                >
                  {formatPrice(netWorth, currency)}
                </Text>
              )}
            </View>
          </Box>
        </Enter>

        {/* Accounts — live ledger accounts */}
        <Enter delay={80} style={{ gap: t.spacing[2] }}>
          <SectionLabel>Accounts</SectionLabel>
          <Box
            surface="surface"
            level="L1"
            radius="lg"
            style={{ overflow: "hidden" }}
          >
            {accountsLoading ? (
              <Box pad={t.spacing[4]} gap={t.spacing[3]}>
                <Skeleton height={40} />
                <Skeleton height={40} />
              </Box>
            ) : accountsError ? (
              <Box pad={t.spacing[5]} style={{ alignItems: "center" }}>
                <Text variant="caption" tone="muted">
                  Couldn&apos;t load your accounts.
                </Text>
              </Box>
            ) : (
              <>
                {accounts.map((account, i) => (
                  <View key={account.id}>
                    {i > 0 ? <Divider /> : null}
                    <AccountRow
                      account={account}
                      currency={currency}
                      onPress={() => openEdit(account)}
                      onLongPress={() => handleManageAccount(account)}
                    />
                  </View>
                ))}
                {accounts.length > 0 ? <Divider /> : null}
                <AddAccountRow onPress={openCreate} />
              </>
            )}
          </Box>
        </Enter>

        {/* Preferences — appearance and currency are live; biometric is honest
            about shipping later */}
        <Enter delay={160} style={{ gap: t.spacing[2] }}>
          <SectionLabel>Preferences</SectionLabel>
          <Box
            surface="surface"
            level="L1"
            radius="lg"
            style={{ overflow: "hidden" }}
          >
            <View style={{ padding: t.spacing[4] }}>
              <AppearanceControl />
            </View>
            <Divider />
            <SettingRow
              ios="globe"
              lucide="Landmark"
              tint="info"
              label="Currency"
              value={currency}
              onPress={() => setCurrencyOpen(true)}
            />
            <Divider />
            <SettingRow
              ios="lock.shield"
              lucide="Shield"
              tint="caution"
              label="Biometric lock"
              badge="Soon"
            />
          </Box>
        </Enter>

        {/* Session — destructive action lives in the grouped list, iOS-style */}
        <Enter delay={240} style={{ gap: t.spacing[2] }}>
          <SectionLabel>Session</SectionLabel>
          <Box
            surface="surface"
            level="L1"
            radius="lg"
            style={{ overflow: "hidden" }}
          >
            <Dip onPress={handleSignOut} accessibilityHint="Confirm before signing out">
              <Box
                pad={t.spacing[4]}
                style={{ flexDirection: "row", alignItems: "center", gap: t.spacing[4] }}
              >
                <TintedGlyph
                  ios="rectangle.portrait.and.arrow.right"
                  lucide="LogOut"
                  tint="negative"
                />
                <Box style={{ flex: 1 }}>
                  <Text variant="body" tone="negative">
                    Sign out
                  </Text>
                </Box>
              </Box>
            </Dip>
          </Box>
        </Enter>

        <Enter delay={300}>
          <Box style={{ alignItems: "center", gap: 2 }}>
            <Text variant="caption" tone="subtle" align="center">
              Every number has a purpose.
            </Text>
            {Constants.expoConfig?.version ? (
              <Text variant="micro" tone="subtle" align="center">
                {`LENVY · V${Constants.expoConfig.version}`}
              </Text>
            ) : null}
          </Box>
        </Enter>
      </ScrollView>

      {user ? (
        <AccountFormSheet
          visible={sheetOpen}
          account={editingAccount}
          onClose={() => setSheetOpen(false)}
        />
      ) : null}

      <CurrencyPicker
        visible={currencyOpen}
        selectedCode={currency}
        onSelect={handleCurrencySelect}
        onClose={() => setCurrencyOpen(false)}
      />
    </Screen>
  );
}

/** Functional group label above a set of rows — a table header, not an eyebrow. */
function SectionLabel({ children }: { children: string }) {
  const t = useTheme();
  return (
    <Text variant="micro" tone="subtle" style={{ paddingLeft: t.spacing[1] }}>
      {children.toUpperCase()}
    </Text>
  );
}

/** Generic settings row: tinted glyph, label, value/badge, chevron. */
function SettingRow({
  ios,
  lucide,
  tint,
  label,
  value,
  badge,
  onPress,
}: {
  ios: string;
  lucide: LucideIconName;
  tint: ColorRole;
  label: string;
  value?: string;
  badge?: string;
  onPress?: () => void;
}) {
  const t = useTheme();
  const Row = (
    <Box
      pad={t.spacing[4]}
      style={{ flexDirection: "row", alignItems: "center", gap: t.spacing[4] }}
    >
      <TintedGlyph ios={ios} lucide={lucide} tint={tint} />
      <Box style={{ flex: 1 }}>
        <Text variant="body" tone="ink">
          {label}
        </Text>
      </Box>
      {value ? (
        <Text variant="numericM" tone="muted">
          {value}
        </Text>
      ) : null}
      {badge ? <Badge label={badge} tone="muted" /> : null}
      {onPress ? (
        <PlatformIcon
          ios="chevron.right"
          lucide="ChevronRight"
          size={16}
          color={t.colors.inkSubtle}
        />
      ) : null}
    </Box>
  );

  if (!onPress) return Row;
  return <Dip onPress={onPress}>{Row}</Dip>;
}

/** One live account: glyph, name (+ default tag), balance. Tap to edit, hold to manage. */
function AccountRow({
  account,
  currency,
  onPress,
  onLongPress,
}: {
  account: Account;
  currency: string;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const t = useTheme();
  const meta = ACCOUNT_TYPE_META[account.type];
  return (
    <Dip
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityLabel={account.name}
      accessibilityHint="Tap to edit, press and hold to manage"
    >
      <Box
        pad={t.spacing[4]}
        style={{ flexDirection: "row", alignItems: "center", gap: t.spacing[4] }}
      >
        <TintedGlyph ios={meta.ios} lucide={meta.lucide} tint={meta.tint} />
        <Box style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text variant="body" tone="ink" numberOfLines={1} style={{ flexShrink: 1 }}>
              {account.name}
            </Text>
            {account.is_default ? <Badge label="Default" tone="accent" /> : null}
          </View>
          <Text variant="micro" tone="subtle">
            {meta.label.toUpperCase()}
          </Text>
        </Box>
        <Text
          variant="numericM"
          tone={account.balance < 0 ? "negative" : "ink"}
        >
          {formatPrice(account.balance, currency)}
        </Text>
      </Box>
    </Dip>
  );
}

/** Trailing "Add account" affordance inside the accounts group. */
function AddAccountRow({ onPress }: { onPress: () => void }) {
  const t = useTheme();
  return (
    <Dip onPress={onPress}>
      <Box
        pad={t.spacing[4]}
        style={{ flexDirection: "row", alignItems: "center", gap: t.spacing[4] }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: t.colors.hairlineStrong,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PlatformIcon
            ios="plus"
            lucide="Plus"
            size={18}
            color={t.colors.accent}
          />
        </View>
        <Box style={{ flex: 1 }}>
          <Text variant="body" tone="accent">
            Add account
          </Text>
        </Box>
        <PlatformIcon
          ios="chevron.right"
          lucide="ChevronRight"
          size={16}
          color={t.colors.inkSubtle}
        />
      </Box>
    </Dip>
  );
}
