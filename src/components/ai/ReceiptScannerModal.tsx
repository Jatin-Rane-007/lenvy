/**
 * AI-tier receipt scanner (DESIGN.md signature moment 4): a live camera with
 * four thin corner ticks framing the receipt, an AI badge, and a library
 * fallback. Replaces the plain image-picker path — the captured photo leaves
 * as base64 for Gemini extraction and as a uri for the in-form preview.
 *
 * The camera overlay sits on top of a video feed, not on the app canvas, so
 * its lines/badges use a fixed light-on-dark treatment (like a system camera
 * UI) while every app-colored element still comes from theme tokens.
 */
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import { Modal, Platform, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme";
import { PlatformIcon } from "@components/icons";
import { Badge, Box, Text } from "@components/primitives";

const ON_CAMERA = "rgba(255, 255, 255, 0.92)";
const ON_CAMERA_DIM = "rgba(255, 255, 255, 0.55)";
const ON_CAMERA_PANEL = "rgba(0, 0, 0, 0.55)";

export type ReceiptCapture = {
  base64: string;
  mimeType: string;
  uri: string | null;
};

export function ReceiptScannerModal({
  visible,
  onClose,
  onCaptured,
}: {
  visible: boolean;
  onClose: () => void;
  onCaptured: (capture: ReceiptCapture) => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const onWeb = Platform.OS === "web";

  useEffect(() => {
    if (visible && !onWeb && !permission?.granted && permission?.canAskAgain) {
      void requestPermission();
    }
  }, [visible, onWeb, permission?.granted, permission?.canAskAgain, requestPermission]);

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.6,
      });
      if (photo?.base64) {
        onCaptured({
          base64: photo.base64,
          mimeType: "image/jpeg",
          uri: photo.uri ?? null,
        });
      }
    } catch {
      // fall through — the parent surfaces the failure via a hint
      onClose();
    } finally {
      setCapturing(false);
    }
  };

  const handlePickFromLibrary = async () => {
    try {
      const library = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!library.granted) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        base64: true,
      });
      const asset = result.assets?.[0];
      if (!result.canceled && asset?.base64) {
        onCaptured({
          base64: asset.base64,
          mimeType: asset.mimeType ?? "image/jpeg",
          uri: asset.uri,
        });
      }
    } catch {
      onClose();
    }
  };

  const denied =
    !onWeb && permission != null && !permission.granted && !permission.canAskAgain;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        {onWeb ? (
          /* Web has no CameraView — the library is the honest path. */
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: t.spacing[6],
              gap: t.spacing[4],
            }}
          >
            <PlatformIcon
              ios="photo"
              lucide="ShoppingBag"
              size={40}
              color={ON_CAMERA_DIM}
            />
            <Text variant="subhead" style={{ color: ON_CAMERA }} align="center">
              Pick a receipt photo
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void handlePickFromLibrary()}
              style={{
                minHeight: 48,
                paddingHorizontal: t.spacing[6],
                borderRadius: t.radii.md,
                backgroundColor: t.colors.accent,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text variant="bodyStrong" style={{ color: t.colors.inkInverse }}>
                Choose photo
              </Text>
            </Pressable>
          </View>
        ) : (
          permission?.granted && (
            <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
          )
        )}

        {/* Scan frame — four thin corner ticks, the snap-in motif */}
        {!onWeb && !denied && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              inset: 0,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: t.spacing[7],
            }}
          >
            <View
              style={{
                width: "100%",
                aspectRatio: 3 / 4,
                position: "relative",
              }}
            >
              {(["topLeft", "topRight", "bottomLeft", "bottomRight"] as const).map(
                (corner) => (
                  <View
                    key={corner}
                    style={{
                      position: "absolute",
                      width: 30,
                      height: 30,
                      borderColor: ON_CAMERA,
                      ...(corner === "topLeft" && {
                        top: -1,
                        left: -1,
                        borderTopWidth: 2.5,
                        borderLeftWidth: 2.5,
                        borderTopLeftRadius: t.radii.lg,
                      }),
                      ...(corner === "topRight" && {
                        top: -1,
                        right: -1,
                        borderTopWidth: 2.5,
                        borderRightWidth: 2.5,
                        borderTopRightRadius: t.radii.lg,
                      }),
                      ...(corner === "bottomLeft" && {
                        bottom: -1,
                        left: -1,
                        borderBottomWidth: 2.5,
                        borderLeftWidth: 2.5,
                        borderBottomLeftRadius: t.radii.lg,
                      }),
                      ...(corner === "bottomRight" && {
                        bottom: -1,
                        right: -1,
                        borderBottomWidth: 2.5,
                        borderRightWidth: 2.5,
                        borderBottomRightRadius: t.radii.lg,
                      }),
                    }}
                  />
                ),
              )}
            </View>
          </View>
        )}

        {/* Top bar: close + hint */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            paddingTop: insets.top + t.spacing[2],
            paddingHorizontal: t.spacing[5],
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close scanner"
            onPress={onClose}
            hitSlop={8}
            style={{
              width: 40,
              height: 40,
              borderRadius: t.radii.full,
              backgroundColor: ON_CAMERA_PANEL,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PlatformIcon ios="xmark" lucide="X" size={16} color={ON_CAMERA} />
          </Pressable>
          {!denied && !onWeb && (
            <Box
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: t.spacing[2],
                paddingHorizontal: t.spacing[4],
                paddingVertical: t.spacing[2],
                borderRadius: t.radii.full,
                backgroundColor: ON_CAMERA_PANEL,
              }}
            >
              <Badge label="AI" tone="accent" size="md" />
              <Text variant="caption" style={{ color: ON_CAMERA }}>
                Align the receipt
              </Text>
            </Box>
          )}
          <View style={{ width: 40 }} />
        </View>

        {/* Bottom bar: library + shutter */}
        {!denied && !onWeb && (
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              paddingBottom: insets.bottom + t.spacing[6],
              paddingHorizontal: t.spacing[7],
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose receipt from library"
              onPress={() => void handlePickFromLibrary()}
              disabled={capturing}
              style={{
                width: 48,
                height: 48,
                borderRadius: t.radii.full,
                backgroundColor: ON_CAMERA_PANEL,
                alignItems: "center",
                justifyContent: "center",
                opacity: capturing ? 0.5 : 1,
              }}
            >
              <PlatformIcon ios="photo" lucide="Package" size={18} color={ON_CAMERA} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Capture receipt photo"
              onPress={() => void handleCapture()}
              disabled={capturing || !permission?.granted}
              style={{
                width: 72,
                height: 72,
                borderRadius: t.radii.full,
                backgroundColor: t.colors.accent,
                borderWidth: 3,
                borderColor: "rgba(255, 255, 255, 0.85)",
                alignItems: "center",
                justifyContent: "center",
                opacity: capturing || !permission?.granted ? 0.6 : 1,
                transform: [{ scale: capturing ? 0.94 : 1 }],
              }}
            >
              {capturing ? (
                <PlatformIcon ios="hourglass" lucide="RefreshCw" size={24} color={ON_CAMERA} />
              ) : (
                <PlatformIcon ios="camera.fill" lucide="ScanLine" size={24} color={ON_CAMERA} />
              )}
            </Pressable>

            <View style={{ width: 48 }} />
          </View>
        )}

        {/* Permission permanently denied */}
        {denied && (
          <View
            style={{
              position: "absolute",
              inset: 0,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0, 0, 0, 0.88)",
              paddingHorizontal: t.spacing[7],
              gap: t.spacing[3],
            }}
          >
            <PlatformIcon
              ios="camera.slash"
              lucide="ScanLine"
              size={32}
              color={ON_CAMERA_DIM}
            />
            <Text variant="body" style={{ color: ON_CAMERA_DIM }} align="center">
              Camera access is off. Enable it in Settings to scan receipts.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={{
                marginTop: t.spacing[3],
                minHeight: 44,
                paddingHorizontal: t.spacing[6],
                borderRadius: t.radii.md,
                borderWidth: 1,
                borderColor: ON_CAMERA_DIM,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text variant="bodyStrong" style={{ color: ON_CAMERA }}>
                Close
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}
