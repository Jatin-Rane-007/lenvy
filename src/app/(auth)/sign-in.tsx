import { useSignIn } from "@clerk/expo";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { AuthBrand } from "@components/auth/auth-brand";
import { AuthField } from "@components/auth/auth-field";
import { AuthSubmit } from "@components/auth/auth-submit";
import { Box, Screen, Text } from "@components/primitives";
import { signinSchema, type SigninSchema } from "@lib/schemas/auth";

export default function SignInScreen() {
  const { signIn, errors: clerkErrors, fetchStatus } = useSignIn();
  const isBusy = fetchStatus === "fetching";

  const { control, handleSubmit } = useForm<SigninSchema>({
    resolver: zodResolver(signinSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    const { error } = await signIn.password({
      identifier: email.trim(),
      password,
    });
    if (error) return; // field/global errors surface via `clerkErrors`

    if (signIn.status === "complete") {
      // The (auth) layout guard redirects home once the session is active.
      await signIn.finalize();
    }
  });

  const globalError = clerkErrors.global?.[0]?.message;

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
                  error={error?.message ?? clerkErrors.fields.password?.message}
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

            <AuthSubmit label="Sign in" loading={isBusy} onPress={onSubmit} />
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
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
