import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, type ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  clamp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { PlatformIcon } from "@components/icons";
import { Text } from "@components/primitives";
import { springs, useTheme } from "@/theme";

/** Width of the revealed trash lane — comfortably over the 44 pt minimum. */
const ACTION_WIDTH = 88;
/** Drag distance past which the lane commits to open. */
const TRIGGER = ACTION_WIDTH * 0.45;

export type SwipeDeleteRowProps = {
  children: ReactNode;
  /** Fired when the trash button is tapped (lane closes first). */
  onDelete: () => void;
  /** PRODUCT.md gesture parity: holding the row triggers the same action. */
  onLongPressDelete?: () => void;
  /** Row description for screen readers, e.g. " groceries · ₹400". */
  accessibilityLabel: string;
  style?: ViewStyle;
};

/**
 * SwipeDeleteRow (Data tier). The iOS/Android ledger idiom: drag the row
 * left and a trash lane surfaces underneath it. The glyph scales up with
 * drag progress — one authored moment — and the row snaps open or shut on
 * DESIGN.md's `springs.snap` with a light haptic when the lane commits.
 * The lane lives in the accessibility tree and long-press stays wired as
 * the parity fallback, so this is never a swipe-only action.
 */
export function SwipeDeleteRow({
  children,
  onDelete,
  onLongPressDelete,
  accessibilityLabel,
  style,
}: SwipeDeleteRowProps) {
  const t = useTheme();
  const [revealed, setRevealed] = useState(false);
  const [trashPressed, setTrashPressed] = useState(false);

  const translation = useSharedValue(0);
  const base = useSharedValue(0);

  const open = () => {
    setRevealed(true);
    translation.value = withSpring(-ACTION_WIDTH, springs.snap);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
      () => {},
    );
  };

  const close = () => {
    setRevealed(false);
    translation.value = withSpring(0, springs.snap);
  };

  const handleTrash = () => {
    close();
    onDelete();
  };

  const pan = Gesture.Pan()
    // Vertical scrolls and the list's own gestures win first; a horizontal
    // drag past 14 pt claims the row.
    .activeOffsetX([-14, 14])
    .failOffsetY([-14, 14])
    .onBegin(() => {
      base.value = translation.value;
    })
    .onUpdate((e) => {
      translation.value = clamp(
        -ACTION_WIDTH,
        0,
        base.value + e.translationX,
      );
    })
    .onEnd((e) => {
      if (e.translationX < -TRIGGER || e.velocityX < -400) {
        runOnJS(open)();
      } else {
        runOnJS(close)();
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translation.value }],
  }));

  // The trash glyph grows into place as the drag commits — the row's one
  // authored motion, tracked on the UI thread.
  const glyphStyle = useAnimatedStyle(() => {
    const progress = clamp(0, 1, -translation.value / ACTION_WIDTH);
    return {
      opacity: 0.35 + 0.65 * progress,
      transform: [{ scale: 0.8 + 0.2 * progress }],
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          {
            borderRadius: t.radii.md,
            overflow: "hidden",
          },
          style,
        ]}
      >
        {/* Trash lane — under the row, revealed by the drag. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete transaction"
          onPress={handleTrash}
          onPressIn={() => setTrashPressed(true)}
          onPressOut={() => setTrashPressed(false)}
          pointerEvents={revealed ? "auto" : "none"}
          style={{
            ...styles.lane,
            width: ACTION_WIDTH,
            borderTopRightRadius: t.radii.md,
            borderBottomRightRadius: t.radii.md,
            backgroundColor: `${t.colors.negative}1F`,
            opacity: trashPressed ? 0.7 : 1,
          }}
        >
          <Animated.View style={glyphStyle}>
            <PlatformIcon
              ios="trash"
              lucide="Trash"
              size={20}
              color={t.colors.negative}
            />
          </Animated.View>
          <Text variant="caption" style={{ color: t.colors.negative }}>
            Delete
          </Text>
        </Pressable>

        {/* Row content slides left over the lane. */}
        <Animated.View style={[styles.row, rowStyle]}>
          <Pressable
            accessibilityLabel={`${accessibilityLabel}. Swipe left to delete.`}
            accessibilityHint="Reveals a delete button"
            onLongPress={
              onLongPressDelete ? () => onLongPressDelete() : undefined
            }
            delayLongPress={400}
          >
            {children}
          </Pressable>
        </Animated.View>

        {/* Tap the row itself to put it away. */}
        {revealed ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close delete action"
            onPress={close}
            style={{ ...styles.overlay, right: ACTION_WIDTH }}
          />
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  lane: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  row: {
    // Relative keeps the row above the lane in paint order.
    zIndex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 2,
  },
});
