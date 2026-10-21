import { useSignIn } from "@clerk/expo";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";

import { AuthBrand } from "@components/auth/auth-brand";
import { AuthField } from "@components/auth/auth-field";
import { AuthSubmit } from "@components/auth/auth-submit";
import { Box, Screen, Text } from "@components/primitives";
import {
  codeSchema,
  signinSchema,
  type CodeSchema,
  type SigninSchema,
} from "@lib/schemas/auth";

/** One-time-code second factors we can collect through the OTP input below. */
type OtpFactor = "email_code" | "phone_code";

export default function SignInScreen() {
  const { signIn, errors: clerkErrors, fetchStatus } = useSignIn();
  const isBusy = fetchStatus === "fetching";

  const [step, setStep] = useState<"credentials" | "verify">("credentials");
  const [factor, setFactor] = useState<OtpFactor>("email_code");
  const [authError, setAuthError] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<SigninSchema>({
    resolver: zodResolver(signinSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  const codeForm = useForm<CodeSchema>({
    resolver: zodResolver(codeSchema),
    mode: "onTouched",
    defaultValues: { code: "" },
  });

  const globalError = authError ?? clerkErrors.global?.[0]?.message;

  // Turn the sign-in into an active session. The (auth) layout guard
  // redirects home once `isSignedIn` flips, so no custom navigate is needed.
  const finalize = async () => {
    if (!signIn) return;
    const { error } = await signIn.finalize();
    if (error) {
      setAuthError(
        error.message ?? "Could not start your session. Please try again.",
      );
    }
  };

  // Pick an available OTP factor, dispatch the challenge code, and show the
  // verification step. Covers both needs_second_factor (user 2FA) and
  // needs_client_trust (Device Trust on a new device).
  const startSecondFactor = async () => {
    if (!signIn) return;

    const supported = signIn.supportedSecondFactors ?? [];
    const hasEmail = supported.some((f) => f.strategy === "email_code");
    const hasPhone = supported.some((f) => f.strategy === "phone_code");

    let chosen: OtpFactor;
    if (hasEmail) chosen = "email_code";
    else if (hasPhone) chosen = "phone_code";
    else {
      setAuthError(
        "This account's two-step setup needs an authenticator or backup code, which this app doesn't support yet. Sign in on the web to finish.",
      );
      return;
    }

    setFactor(chosen);
    const { error } =
      await signIn.mfa[
        chosen === "email_code" ? "sendEmailCode" : "sendPhoneCode"
      ]();
    if (error) {
      setAuthError(error.message ?? "Could not send the verification code.");
      return;
    }

    codeForm.reset({ code: "" });
    setStep("verify");
  };

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setAuthError(null);
    if (!signIn) return;

    const { error } = await signIn.password({
      identifier: email.trim(),
      password,
    });
    // field/global errors surface via `clerkErrors`
    if (error) return;

    if (signIn.status === "complete") {
      await finalize();
      return;
    }

    if (
      signIn.status === "needs_second_factor" ||
      signIn.status === "needs_client_trust"
    ) {
      await startSecondFactor();
      return;
    }

    setAuthError("Unexpected sign-in state. Please try again.");
  });

  const onVerify = codeForm.handleSubmit(async ({ code }) => {
    setAuthError(null);
    if (!signIn) return;

    const { error } = await signIn.mfa[
      factor === "email_code" ? "verifyEmailCode" : "verifyPhoneCode"
    ]({ code: code.trim() });
    // field/global errors surface via `clerkErrors`
    if (error) return;

    if (signIn.status === "complete") await finalize();
  });

  const onResend = async () => {
    if (!signIn) return;
    setAuthError(null);
    const { error } =
      await signIn.mfa[
        factor === "email_code" ? "sendEmailCode" : "sendPhoneCode"
      ]();
    if (error) {
      setAuthError(error.message ?? "Could not resend the verification code.");
    }
  };

  const startOver = async () => {
    if (!signIn) return;
    await signIn.reset();
    codeForm.reset({ code: "" });
    setAuthError(null);
    setStep("credentials");
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow items-center justify-center gap-8 px-8 py-12"
          keyboardShouldPersistTaps="handled"
        >
          {step === "credentials" ? (
            <>
              <AuthBrand
                title="Welcome back"
                subtitle="Sign in to keep tracking your wealth with Lenvy."
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
                <Controller
                  control={control}
                  name="email"
                  render={({
                    field: { value, onChange, onBlur },
                    fieldState: { error },
                  }) => (
                    <AuthField
                      label="Email"
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      error={
                        error?.message ?? clerkErrors.fields.identifier?.message
                      }
                      autoComplete="email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder="you@example.com"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="password"
                  render={({
                    field: { value, onChange, onBlur },
                    fieldState: { error },
                  }) => (
                    <AuthField
                      label="Password"
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      error={
                        error?.message ?? clerkErrors.fields.password?.message
                      }
                      secure
                      autoComplete="current-password"
                      placeholder="••••••••"
                      returnKeyType="go"
                      onSubmitEditing={onSubmit}
                    />
                  )}
                />

                {globalError ? (
                  <Text variant="caption" tone="negative" align="center">
                    {globalError}
                  </Text>
                ) : null}

                <AuthSubmit
                  label="Sign in"
                  loading={isBusy}
                  onPress={onSubmit}
                />
              </Box>

              <View className="flex-row items-center justify-center gap-2">
                <Text variant="body" tone="muted">
                  New here?
                </Text>
                <Link href="/sign-up" asChild>
                  <Text variant="bodyStrong" tone="accent">
                    Create an account
                  </Text>
                </Link>
              </View>
            </>
          ) : (
            <>
              <AuthBrand
                title="Verify it's you"
                subtitle={
                  factor === "email_code"
                    ? "We sent a verification code to your email."
                    : "We sent a verification code to your phone."
                }
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
                <Controller
                  control={codeForm.control}
                  name="code"
                  render={({
                    field: { value, onChange, onBlur },
                    fieldState: { error },
                  }) => (
                    <AuthField
                      label="Verification code"
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      error={error?.message ?? clerkErrors.fields.code?.message}
                      keyboardType="number-pad"
                      autoComplete="one-time-code"
                      autoFocus
                      placeholder="424242"
                      returnKeyType="go"
                      onSubmitEditing={onVerify}
                    />
                  )}
                />

                {globalError ? (
                  <Text variant="caption" tone="negative" align="center">
                    {globalError}
                  </Text>
                ) : null}

                <AuthSubmit
                  label="Verify"
                  loading={isBusy}
                  onPress={onVerify}
                />

                <View className="flex-row items-center justify-between">
                  <Pressable
                    onPress={onResend}
                    hitSlop={8}
                    accessibilityRole="button"
                  >
                    <Text variant="caption" tone="muted">
                      Resend code
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={startOver}
                    hitSlop={8}
                    accessibilityRole="button"
                  >
                    <Text variant="caption" tone="muted">
                      Use a different account
                    </Text>
                  </Pressable>
                </View>
              </Box>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
