import { useSignUp } from "@clerk/expo";
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
  signupSchema,
  type CodeSchema,
  type SignupSchema,
} from "@lib/schemas/auth";

export default function SignUpScreen() {
  const { signUp, errors: clerkErrors, fetchStatus } = useSignUp();
  const isBusy = fetchStatus === "fetching";
  const [step, setStep] = useState<"details" | "verify">("details");
  const [email, setEmail] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  const detailsForm = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      password: "",
    },
  });

  const codeForm = useForm<CodeSchema>({
    resolver: zodResolver(codeSchema),
    mode: "onTouched",
    defaultValues: { code: "" },
  });

  const globalError = authError ?? clerkErrors.global?.[0]?.message;

  const startOver = async () => {
    await signUp.reset();
    codeForm.reset({ code: "" });
    detailsForm.reset();
    setEmail("");
    setAuthError(null);
    setStep("details");
  };

  const onContinue = detailsForm.handleSubmit(
    async ({ email, username, password, firstName, lastName }) => {
      // Create the sign-up and attach the password in one step.
      const { error } = await signUp.password({
        emailAddress: email.trim(),
        username: username.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      if (error) return;

      setEmail(email.trim());

      // Some instances don't require email verification — go straight to a session.
      if (signUp.status === "complete") {
        await signUp.finalize();
        return;
      }

      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) return;

      setStep("verify");
    },
  );

  const onVerify = codeForm.handleSubmit(async ({ code }) => {
    setAuthError(null);
    const { error } = await signUp.verifications.verifyEmailCode({
      code: code.trim(),
    });
    // A code consumed on a previous tap means the email is already verified —
    // don't trap the user on this step, fall through and finish the flow.
    if (error && error.code !== "verification_already_verified") {
      return;
    }

    if (signUp.status === "complete") {
      // The (auth) layout guard redirects home once the session is active.
      const { error: finalizeError } = await signUp.finalize();
      if (finalizeError) {
        setAuthError(
          finalizeError.message ??
            "Could not start your session. Please try again.",
        );
      }
    }
  });

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
          {step === "details" ? (
            <>
              <AuthBrand
                title="Create your account"
                subtitle="Track your wealth in one calm place."
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
                  control={detailsForm.control}
                  name="firstName"
                  render={({
                    field: { value, onChange, onBlur },
                    fieldState: { error },
                  }) => (
                    <AuthField
                      label="First name"
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      error={
                        error?.message ?? clerkErrors.fields.firstName?.message
                      }
                      autoComplete="given-name"
                      autoCapitalize="words"
                      placeholder="Ada"
                    />
                  )}
                />

                <Controller
                  control={detailsForm.control}
                  name="lastName"
                  render={({
                    field: { value, onChange, onBlur },
                    fieldState: { error },
                  }) => (
                    <AuthField
                      label="Last name"
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      error={
                        error?.message ?? clerkErrors.fields.lastName?.message
                      }
                      autoComplete="family-name"
                      autoCapitalize="words"
                      placeholder="Lovelace"
                    />
                  )}
                />

                <Controller
                  control={detailsForm.control}
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
                        error?.message ??
                        clerkErrors.fields.emailAddress?.message
                      }
                      autoComplete="email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder="you@example.com"
                    />
                  )}
                />

                <Controller
                  control={detailsForm.control}
                  name="username"
                  render={({
                    field: { value, onChange, onBlur },
                    fieldState: { error },
                  }) => (
                    <AuthField
                      label="Username"
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      error={
                        error?.message ?? clerkErrors.fields.username?.message
                      }
                      autoComplete="username"
                      autoCapitalize="none"
                      placeholder="adalovelace"
                    />
                  )}
                />

                <Controller
                  control={detailsForm.control}
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
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      returnKeyType="go"
                      onSubmitEditing={onContinue}
                    />
                  )}
                />

                {globalError ? (
                  <Text variant="caption" tone="negative" align="center">
                    {globalError}
                  </Text>
                ) : null}

                <AuthSubmit
                  label="Continue"
                  loading={isBusy}
                  onPress={onContinue}
                />
              </Box>

              <Pressable className="flex-row items-center gap-2" hitSlop={8}>
                <Text variant="body" tone="muted">
                  Already have an account?
                </Text>
                <Link href="/sign-in" asChild>
                  <Text variant="bodyStrong" tone="accent">
                    Sign in
                  </Text>
                </Link>
              </Pressable>
            </>
          ) : (
            <>
              <AuthBrand
                title="Verify your email"
                subtitle={`We sent a 6-digit code to ${email}.`}
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
                  label="Verify email"
                  loading={isBusy}
                  onPress={onVerify}
                />

                <View className="flex-row items-center justify-between">
                  <Pressable
                    onPress={() => signUp.verifications.sendEmailCode()}
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
                      Use a different email
                    </Text>
                  </Pressable>
                </View>
              </Box>
            </>
          )}

          {/* Clerk bot protection mount point (required on any screen that can create a sign-up). */}
          <View
            nativeID="clerk-captcha"
            className="absolute h-px w-px opacity-0"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
