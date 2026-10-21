import { useUser } from "@clerk/expo";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";

import { CurrencyPicker } from "@components/CurrencyPicker";
import { AuthBrand } from "@components/auth/auth-brand";
import { AuthSubmit } from "@components/auth/auth-submit";
import { PlatformIcon } from "@components/icons";
import { Box, Screen, Text } from "@components/primitives";
import { ALL_CURRENCIES, type Currency } from "@constants/currencies";
import { useSupabase } from "@/hooks/useSupabase";
import { onboardingSchema, type OnboardingFormValues } from "@lib/schemas/onboarding";
import { useUserStore } from "@/store/userStore";
import { useTheme } from "@/theme";

const INR_FIRST =
  ALL_CURRENCIES.find((c: Currency) => c.code === "INR") ?? ALL_CURRENCIES[0];

export default function OnboardingScreen() {
  const t = useTheme();
  const { user } = useUser();
  const authSupabase = useSupabase();
  const setCurrency = useUserStore((s) => s.setCurrency);
  const setNeedsOnboarding = useUserStore((s) => s.setNeedsOnboarding);

  const {
    control,
    handleSubmit,
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    mode: "onBlur",
    defaultValues: { startingBalance: "" },
  });

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(INR_FIRST);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [currencyPressed, setCurrencyPressed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async ({ startingBalance }: OnboardingFormValues) => {
    if (!user) return;
    const parsed = parseFloat(startingBalance.replace(/,/g, ""));
    setSaving(true);
    setError("");

    const { error: updateError } = await authSupabase
      .from("users")
      .update({ currency: selectedCurrency.code })
      .eq("clerk_id", user.id);

    if (updateError) {
      setSaving(false);
      setError("Something went wrong. Please try again.");
      return;
    }

    const { data: defaultAccount, error: accountFetchError } =
      await authSupabase
        .from("accounts")
        .select("id, balance")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .single();

    if (accountFetchError || !defaultAccount) {
      setSaving(false);
      setError("Something went wrong. Please try again.");
      return;
    }

    const { error: txError } = await authSupabase.from("transactions").insert({
      user_id: user.id,
      account_id: defaultAccount.id,
      type: "INCOME",
      amount: parsed,
      category: "other_income",
      description: "Starting balance",
      date: new Date().toISOString(),
      input_method: "MANUAL",
    });

    if (txError) {
      setSaving(false);
      setError("Something went wrong. Please try again.");
      return;
    }

    const { error: balanceError } = await authSupabase
      .from("accounts")
      .update({ balance: defaultAccount.balance + parsed })
      .eq("id", defaultAccount.id);

    setSaving(false);

    if (balanceError) {
      setError("Something went wrong. Please try again.");
      return;
    }

    setCurrency(selectedCurrency.code);
    setNeedsOnboarding(false);
    router.replace("/(root)/(tabs)");
  };

  const submit = () => {
    void handleSubmit(handleSave)();
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow items-center justify-center gap-8 px-5 py-12"
          keyboardShouldPersistTaps="handled"
        >
          <AuthBrand
            title="Let’s get you set up"
            subtitle="A couple of quick details to personalise your experience."
          />

          <Box
            surface="surfaceRaised"
            level="L2"
            radius="2xl"
            hairline
            padX={24}
            padY={32}
            gap={20}
            className="w-full"
            style={{ maxWidth: 440 }}
          >
            {/* Starting balance */}
            <View className="gap-2">
              <Text variant="micro" tone="muted" style={{ textTransform: "uppercase" }}>
                Starting balance
              </Text>
              <Controller
                control={control}
                name="startingBalance"
                render={({
                  field: { value, onChange, onBlur },
                  fieldState: { error: balanceError },
                }) => (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: t.colors.surfaceSunken,
                      borderWidth: 1,
                      borderColor: balanceError
                        ? t.colors.negative
                        : t.colors.hairline,
                      borderRadius: t.radii.lg,
                      paddingHorizontal: t.spacing[4] + 2,
                    }}
                  >
                    <Text
                      variant="body"
                      tone="muted"
                      style={{ marginRight: t.spacing[2] }}
                    >
                      {selectedCurrency.symbol}
                    </Text>
                    <TextInput
                      value={value}
                      onChangeText={(v) => {
                        setError("");
                        onChange(v);
                      }}
                      onBlur={onBlur}
                      placeholder="e.g. 50000"
                      placeholderTextColor={t.colors.inkSubtle}
                      keyboardType="numeric"
                      returnKeyType="done"
                      onSubmitEditing={submit}
                      cursorColor={t.colors.accent}
                      style={{
                        flex: 1,
                        paddingVertical: t.spacing[3] + 2,
                        color: t.colors.ink,
                        fontSize: 16,
                        lineHeight: 22,
                      }}
                    />
                  </View>
                )}
              />
            </View>

            {/* Currency */}
            <View className="gap-2">
              <Text variant="micro" tone="muted" style={{ textTransform: "uppercase" }}>
                Currency
              </Text>
              <Pressable
                onPress={() => setPickerOpen(true)}
                onPressIn={() => setCurrencyPressed(true)}
                onPressOut={() => setCurrencyPressed(false)}
                accessibilityRole="button"
                accessibilityLabel="Choose currency"
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: t.spacing[3],
                  minHeight: 64,
                  backgroundColor: t.colors.surfaceSunken,
                  borderWidth: 1,
                  borderColor: currencyPressed
                    ? t.colors.hairlineStrong
                    : t.colors.hairline,
                  borderRadius: t.radii.lg,
                  paddingLeft: t.spacing[3],
                  paddingRight: t.spacing[4],
                  paddingVertical: t.spacing[3],
                  opacity: currencyPressed ? 0.92 : 1,
                }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: t.colors.accentSoft,
                  }}
                >
                  <Text variant="subhead" tone="accent">
                    {selectedCurrency.symbol}
                  </Text>
                </View>
                <View style={{ flex: 1, gap: 1 }}>
                  <Text variant="bodyStrong" tone="ink">
                    {selectedCurrency.code}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {selectedCurrency.name}
                  </Text>
                </View>
                <PlatformIcon
                  ios="chevron.down"
                  lucide="ChevronDown"
                  size={18}
                  color={t.colors.inkSubtle}
                />
              </Pressable>
            </View>

            {error ? (
              <Text variant="caption" tone="negative" align="center">
                {error}
              </Text>
            ) : null}

            <AuthSubmit
              label="Get started"
              loading={saving}
              onPress={submit}
            />
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>

      <CurrencyPicker
        visible={pickerOpen}
        selectedCode={selectedCurrency.code}
        onSelect={(currency: Currency) => {
          setSelectedCurrency(currency);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </Screen>
  );
}
