/**
 * AI-tier voice stage (DESIGN.md signature moment 3 + L4 "voice stage"
 * overlay): the evergreen→info orb breathes while expo-audio records, then
 * the clip goes to Gemini as base64 and comes back an ExtractedTransaction
 * the form pre-fills for review. "Type instead" hands off to the inline
 * transcript stage (local parser) when there's no mic, no network or no key.
 */
import { File } from "expo-file-system";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Modal, Platform, Pressable, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme";
import type { ExtractedTransaction } from "@/types/transaction";
import { useReduceMotion } from "@components/animated";
import { PlatformIcon } from "@components/icons";
import { Badge, Box, Text } from "@components/primitives";
import { extractTransactionFromVoice } from "@lib/services/extractTransaction";

type Status = "idle" | "recording" | "processing" | "error";

function PulseRing({ active }: { active: boolean }) {
  const t = useTheme();
  const progress = useSharedValue(0);
  const reduce = useReduceMotion();

  useEffect(() => {
    if (!active || reduce) {
      progress.value = 0;
      return;
    }
    progress.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1, { duration: 1600, easing: Easing.out(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [active, reduce, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: (1 - progress.value) * 0.5,
    transform: [{ scale: 1 + progress.value * 0.9 }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: 96,
          height: 96,
          borderRadius: t.radii.full,
          borderWidth: 1.5,
          borderColor: t.colors.accent,
        },
        style,
      ]}
    />
  );
}

function ProcessingRing() {
  const t = useTheme();
  const rotation = useSharedValue(0);
  const reduce = useReduceMotion();

  useEffect(() => {
    if (reduce) {
      rotation.value = 0;
      return;
    }
    rotation.value = withRepeat(
      withTiming(360, { duration: 1100, easing: Easing.linear }),
      -1,
      false,
    );
  }, [reduce, rotation]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[{ width: 96, height: 96, position: "absolute" }, style]}>
      <LinearGradient
        colors={[t.colors.accent, t.colors.info, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 96,
          height: 96,
          borderRadius: t.radii.full,
          padding: 3,
        }}
      >
        <View
          style={{
            flex: 1,
            borderRadius: t.radii.full,
            backgroundColor: t.colors.surfaceRaised,
          }}
        />
      </LinearGradient>
    </Animated.View>
  );
}

export function VoiceRecorderModal({
  visible,
  onClose,
  onExtracted,
  onFallback,
}: {
  visible: boolean;
  onClose: () => void;
  onExtracted: (result: ExtractedTransaction) => void;
  /** Opens the inline transcript stage instead of recording. */
  onFallback?: () => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [status, setStatus] = useState<Status>("idle");
  const [seconds, setSeconds] = useState(0);
  const orbScale = useSharedValue(1);

  // Every dismissal goes through handleClose, so the stage resets there
  // instead of in a visibility-watching effect (React-Compiler-clean).
  const handleClose = () => {
    setStatus("idle");
    setSeconds(0);
    onClose();
  };

  useEffect(() => {
    if (!visible || Platform.OS === "web") return;
    let cancelled = false;
    (async () => {
      const { granted } = await requestRecordingPermissionsAsync();
      if (cancelled) return;
      if (!granted) {
        setStatus("error");
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  useEffect(() => {
    if (status !== "recording") return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (status === "recording") {
      orbScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      orbScale.value = withTiming(1, { duration: 200 });
    }
  }, [status, orbScale]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
  }));

  const startRecording = async () => {
    setSeconds(0);
    await recorder.prepareToRecordAsync();
    recorder.record();
    setStatus("recording");
  };

  const stopRecording = async () => {
    setStatus("processing");
    await recorder.stop();
    try {
      const uri = recorder.uri;
      if (!uri) throw new Error("No recording captured");
      const base64 = await new File(uri).base64();
      const result = await extractTransactionFromVoice(base64, "audio/m4a");
      onExtracted(result);
      handleClose();
    } catch {
      setStatus("error");
    }
  };

  const headline =
    status === "recording"
      ? "Listening…"
      : status === "processing"
        ? "Understanding that…"
        : status === "error"
          ? "Couldn't process that"
          : "Tell me about a transaction";
  const subline =
    status === "recording"
      ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
      : status === "processing"
        ? "Transcribing and extracting the details"
        : status === "error"
          ? "Check your microphone permission and connectivity, or type it instead."
          : "\u201CI spent 400 on groceries yesterday\u201D";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: t.colors.overlay }}>
        <Box
          surface="surfaceRaised"
          level="L4"
          padX={t.spacing[6]}
          style={{
            alignItems: "center",
            overflow: "hidden",
            borderTopLeftRadius: t.radii["2xl"],
            borderTopRightRadius: t.radii["2xl"],
            paddingTop: t.spacing[7],
            paddingBottom: insets.bottom + t.spacing[7],
            gap: t.spacing[3],
          }}
        >
          {/* Grabber */}
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: t.colors.hairlineStrong,
              marginBottom: t.spacing[5],
            }}
          />

          {status === "error" ? (
            <>
              <PlatformIcon
                ios="exclamationmark.circle"
                lucide="RefreshCw"
                size={32}
                color={t.colors.negative}
              />
              <Text variant="subhead" tone="ink" align="center">
                {headline}
              </Text>
              <Text variant="caption" tone="muted" align="center" style={{ paddingHorizontal: t.spacing[4] }}>
                {subline}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  gap: t.spacing[3],
                  marginTop: t.spacing[5],
                  width: "100%",
                }}
              >
                {onFallback ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={onFallback}
                    style={{
                      flex: 1,
                      minHeight: 48,
                      borderRadius: t.radii.md,
                      borderWidth: 1,
                      borderColor: t.colors.hairlineStrong,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text variant="bodyStrong" tone="accent">
                      Type instead
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  onPress={handleClose}
                  style={{
                    flex: 1,
                    minHeight: 48,
                    borderRadius: t.radii.md,
                    backgroundColor: t.colors.accent,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text variant="bodyStrong" style={{ color: t.colors.inkInverse }}>
                    Close
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", gap: t.spacing[2] }}>
                <Badge label="AI" tone="accent" />
                <Text variant="micro" tone="accent">
                  VOICE LOG
                </Text>
              </View>
              <Text variant="subhead" tone="ink" align="center">
                {headline}
              </Text>
              <Text
                variant={status === "recording" ? "numericM" : "caption"}
                tone={status === "recording" ? "ink" : "muted"}
                align="center"
                style={{ marginBottom: t.spacing[6] }}
              >
                {subline}
              </Text>

              <View
                style={{
                  width: 96,
                  height: 96,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: t.spacing[6],
                }}
              >
                {(status === "idle" || status === "recording") && (
                  <>
                    <PulseRing active />
                    <PulseRing active />
                  </>
                )}
                {status === "processing" && <ProcessingRing />}

                <Animated.View style={orbStyle}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      status === "recording" ? "Stop recording" : "Start recording"
                    }
                    disabled={status === "processing" || Platform.OS === "web"}
                    onPress={status === "recording" ? () => void stopRecording() : () => void startRecording()}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: t.radii.full,
                      overflow: "hidden",
                      opacity: status === "processing" ? 0.6 : 1,
                    }}
                  >
                    <LinearGradient
                      colors={[t.colors.accent, t.colors.info]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        width: 72,
                        height: 72,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <PlatformIcon
                        ios={status === "recording" ? "stop.fill" : "mic.fill"}
                        lucide={status === "recording" ? "X" : "Mic"}
                        size={26}
                        color={t.colors.inkInverse}
                      />
                    </LinearGradient>
                  </Pressable>
                </Animated.View>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: t.spacing[5] }}>
                {onFallback ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={onFallback}
                    disabled={status === "processing"}
                    hitSlop={8}
                  >
                    <Text variant="caption" tone="subtle">
                      Type instead
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  onPress={handleClose}
                  disabled={status === "processing"}
                  hitSlop={8}
                >
                  <Text variant="caption" tone="subtle">
                    Cancel
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </Box>
      </View>
    </Modal>
  );
}
