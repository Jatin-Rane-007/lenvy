import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme";
import type { Account, AccountType } from "@/types/account";
import { Dip } from "@components/animated";
import { PlatformIcon } from "@components/icons";
import { Box, Button, Chip, Text } from "@components/primitives";
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_META,
} from "@constants/accountTypes";
import {
  useCreateAccount,
  useUpdateAccount,
} from "@hooks/mutations/useAccountMutation";

export type AccountFormSheetProps = {
  visible: boolean;
  /** The account being edited, or null when creating a new one. */
  account: Account | null;
  onClose: () => void;
  onSaved?: () => void;
};

/**
 * AccountFormSheet (Overlays tier). One name field and a four-way type
 * selector — the whole surface an account needs. Mirrors BudgetSheet: an L3
 * floating panel on an L4 scrim, `xl` top-only radius, a grabber, and a form
 * body keyed on `visible` so closing throws its state away.
 */
export function AccountFormSheet({
  visible,
  account,
  onClose,
  onSaved,
}: AccountFormSheetProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close account sheet"
        onPress={onClose}
        style={{ flex: 1, backgroundColor: t.colors.overlay }}
      >
        {/* adjustResize never fires inside a Modal window, so the avoiding view
            has to do the lifting itself: `padding` on iOS, `height` on Android,
            with the sheet pinned to the bottom via flex-end (an absolutely
            positioned child ignores the added padding in Yoga). */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          <Box
            surface="surfaceRaised"
            level="L3"
            pad={t.spacing[5]}
            gap={t.spacing[5]}
            onStartShouldSetResponder={() => true}
            style={{
              paddingBottom: t.spacing[5] + Math.max(insets.bottom, 12),
              borderTopLeftRadius: t.radii.xl,
              borderTopRightRadius: t.radii.xl,
            }}
          >
            {/* Grabber */}
            <View
              style={{
                alignSelf: "center",
                width: 40,
                height: 4,
                borderRadius: t.radii.full,
                backgroundColor: t.colors.hairlineStrong,
              }}
            />

            <Box gap={t.spacing[1]}>
              <Text variant="heading" tone="ink">
                {account ? "Edit account" : "New account"}
              </Text>
              <Text variant="caption" tone="muted">
                {account
                  ? "Rename it or move it to another type."
                  : "Give it a name and pick what kind of pot it is."}
              </Text>
            </Box>

            <AccountForm
              key={visible ? (account?.id ?? "new") : "closed"}
              account={account}
              onClose={onClose}
              onSaved={onSaved}
            />
          </Box>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

type AccountFormProps = {
  account: Account | null;
  onClose: () => void;
  onSaved?: () => void;
};

function AccountForm({ account, onClose, onSaved }: AccountFormProps) {
  const t = useTheme();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();

  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<AccountType>(account?.type ?? "CASH");
  const [error, setError] = useState<string | null>(null);

  const trimmed = name.trim();
  const canSave = trimmed.length > 0;
  const saving = createAccount.isPending || updateAccount.isPending;

  const save = async () => {
    if (!canSave) {
      setError("Give the account a name.");
      return;
    }
    setError(null);
    try {
      if (account) {
        await updateAccount.mutateAsync({
          accountId: account.id,
          payload: { name: trimmed, type },
        });
      } else {
        await createAccount.mutateAsync({ name: trimmed, type });
      }
      onSaved?.();
      onClose();
    } catch {
      setError("Could not save. Check your connection and try again.");
    }
  };

  return (
    <>
      {/* Name field — tight `md` input on the sunken surface */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: t.spacing[3],
          backgroundColor: t.colors.surfaceSunken,
          borderWidth: 1,
          borderColor: error ? t.colors.negative : t.colors.hairline,
          borderRadius: t.radii.md,
          paddingHorizontal: t.spacing[4],
        }}
      >
        <PlatformIcon
          ios="textformat"
          lucide="SquarePen"
          size={16}
          color={t.colors.inkSubtle}
        />
        <TextInput
          value={name}
          onChangeText={(v) => {
            setName(v);
            if (error) setError(null);
          }}
          onSubmitEditing={() => void save()}
          placeholder="Account name"
          placeholderTextColor={t.colors.inkSubtle}
          autoCapitalize="words"
          returnKeyType="done"
          maxLength={40}
          editable={!saving}
          style={{
            flex: 1,
            paddingVertical: t.spacing[3],
            color: t.colors.ink,
            fontFamily: t.fonts.inter,
            fontSize: t.typography.body.fontSize,
            lineHeight: t.typography.body.lineHeight,
          }}
        />
      </View>

      {/* Type selector — four chips, real glyphs, tinted on select */}
      <Box gap={t.spacing[2]}>
        <Text variant="micro" tone="subtle">
          TYPE
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: t.spacing[2],
          }}
        >
          {ACCOUNT_TYPES.map((key) => {
            const meta = ACCOUNT_TYPE_META[key];
            const selected = key === type;
            return (
              <Chip
                key={key}
                label={meta.short}
                selected={selected}
                variant="category"
                swatch={t.colors[meta.tint]}
                onPress={() => setType(key)}
                icon={
                  <PlatformIcon
                    ios={meta.ios}
                    lucide={meta.lucide}
                    size={14}
                    color={selected ? t.colors[meta.tint] : t.colors.inkMuted}
                  />
                }
              />
            );
          })}
        </View>
      </Box>

      {error ? (
        <Text variant="caption" tone="negative">
          {error}
        </Text>
      ) : null}

      <Box gap={t.spacing[2]}>
        <Button
          label={account ? "Save changes" : "Add account"}
          loading={saving}
          disabled={!canSave}
          fullWidth
          onPress={() => void save()}
        />
        <Dip onPress={saving ? undefined : onClose}>
          <Box
            surface="surface"
            level="L1"
            radius="md"
            padY={t.spacing[3]}
            style={{ alignItems: "center" }}
          >
            <Text variant="bodyStrong" tone="muted">
              Cancel
            </Text>
          </Box>
        </Dip>
      </Box>
    </>
  );
}
