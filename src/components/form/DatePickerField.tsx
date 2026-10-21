import { useState } from "react";
import { Pressable, View, type ViewStyle } from "react-native";

import { PlatformIcon } from "@components/icons";
import { Box, Text } from "@components/primitives";
import { formatDateFull, startOfDay } from "@lib/utils";
import { useTheme } from "@/theme";

export type DatePickerFieldProps = {
  value: Date;
  onChange: (date: Date) => void;
  /** Days after this are unselectable — defaults to today. */
  maximumDate?: Date;
  style?: ViewStyle;
};

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * Form-tier DatePicker (DESIGN.md component inventory): a quiet L1 trigger
 * row that expands an inline month grid below it. No third-party picker —
 * the grid is built from the same tokens as everything else, so both
 * schemes and the elevation recipe carry over. Day cells land at 44 pt.
 */
export function DatePickerField({
  value,
  onChange,
  maximumDate,
  style,
}: DatePickerFieldProps) {
  const t = useTheme();
  const cap = startOfDay(maximumDate ?? new Date());

  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(
    () => new Date(value.getFullYear(), value.getMonth(), 1),
  );

  const atCapMonth =
    viewMonth.getFullYear() * 12 + viewMonth.getMonth() >=
    cap.getFullYear() * 12 + cap.getMonth();

  const toggle = () => {
    if (!open) {
      setViewMonth(new Date(value.getFullYear(), value.getMonth(), 1));
    }
    setOpen((v) => !v);
  };

  const shiftMonth = (delta: number) => {
    if (delta > 0 && atCapMonth) return;
    setViewMonth(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1),
    );
  };

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstWeekday = viewMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Week rows built without mutation so the React Compiler can track them.
  const slotCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const weeks: (number | null)[][] = Array.from(
    { length: slotCount / 7 },
    (_, wi) =>
      Array.from({ length: 7 }, (_, di) => {
        const day = wi * 7 + di - firstWeekday + 1;
        return day >= 1 && day <= daysInMonth ? day : null;
      }),
  );

  const todayTime = startOfDay().getTime();
  const valueTime = startOfDay(value).getTime();

  return (
    <View style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={toggle}
        style={{ borderRadius: t.radii.md }}
      >
        <Box surface="surface" level="L1" radius="md" padX={4}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: t.spacing[3],
              paddingVertical: t.spacing[3],
              minHeight: 52,
            }}
          >
            <PlatformIcon
              ios="calendar"
              lucide="CalendarDays"
              size={18}
              color={t.colors.inkMuted}
            />
            <View style={{ flex: 1 }}>
              <Text variant="body" tone="ink">
                {formatDateFull(value)}
              </Text>
            </View>
            <Text variant="caption" tone="subtle">
              {open ? "Close" : "Change"}
            </Text>
          </View>
        </Box>
      </Pressable>

      {open ? (
        <Box surface="surface" level="L2" radius="lg" pad={4} style={{ marginTop: t.spacing[2] }}>
          {/* Month navigation */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: t.spacing[2],
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              onPress={() => shiftMonth(-1)}
              hitSlop={8}
              style={navButton(t.radii.sm, t.colors.hairline)}
            >
              <View style={{ transform: [{ scaleX: -1 }] }}>
                <PlatformIcon
                  ios="chevron.right"
                  lucide="ChevronRight"
                  size={16}
                  color={t.colors.inkMuted}
                />
              </View>
            </Pressable>
            <Text variant="subhead" tone="ink">
              {viewMonth.toLocaleString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next month"
              onPress={() => shiftMonth(1)}
              disabled={atCapMonth}
              hitSlop={8}
              style={[
                navButton(t.radii.sm, t.colors.hairline),
                atCapMonth && { opacity: 0.35 },
              ]}
            >
              <PlatformIcon
                ios="chevron.right"
                lucide="ChevronRight"
                size={16}
                color={t.colors.inkMuted}
              />
            </Pressable>
          </View>

          {/* Weekday header */}
          <View style={{ flexDirection: "row" }}>
            {WEEKDAY_LETTERS.map((letter, i) => (
              <View key={`w-${letter}-${i}`} style={cellSlot}>
                <Text variant="caption" tone="subtle" align="center">
                  {letter}
                </Text>
              </View>
            ))}
          </View>

          {/* Day grid */}
          {weeks.map((week, wi) => (
            <View key={`wk-${wi}`} style={{ flexDirection: "row" }}>
              {week.map((day, di) => {
                if (day === null) {
                  return <View key={`e-${di}`} style={cellSlot} />;
                }
                const cell = new Date(year, month, day);
                const cellTime = startOfDay(cell).getTime();
                const selected = cellTime === valueTime;
                const isToday = cellTime === todayTime;
                const disabled = cellTime > cap.getTime();

                return (
                  <Pressable
                    key={`d-${day}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected, disabled }}
                    accessibilityLabel={formatDateFull(cell)}
                    disabled={disabled}
                    onPress={() => {
                      onChange(cell);
                      setOpen(false);
                    }}
                    style={[cellSlot, disabled && { opacity: 0.35 }]}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: selected
                          ? t.colors.accent
                          : "transparent",
                        ...(isToday && !selected
                          ? {
                              borderWidth: 1,
                              borderColor: t.colors.hairlineStrong,
                            }
                          : null),
                      }}
                    >
                      <Text
                        variant="numericM"
                        style={{
                          color: selected
                            ? t.colors.inkInverse
                            : t.colors.ink,
                        }}
                      >
                        {day}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </Box>
      ) : null}
    </View>
  );
}

const cellSlot: ViewStyle = {
  width: "14.28%",
  alignItems: "center",
  paddingVertical: 3,
};

function navButton(radius: number, border: string): ViewStyle {
  return {
    width: 36,
    height: 36,
    borderRadius: radius,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: border,
  };
}
