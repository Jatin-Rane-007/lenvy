import { useUser } from "@clerk/expo";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AiOrb } from "@components/ai/AiOrb";
import { ChatBubble, TypingBubble } from "@components/ai/ChatBubble";
import { Enter, useReduceMotion } from "@components/animated";
import { PlatformIcon } from "@components/icons";
import { Box, Button, Chip, Screen, Text } from "@components/primitives";
import { useBudgetQuery } from "@hooks/queries/useBudgetQuery";
import { useTransactionsQuery } from "@hooks/queries/useTransactionsQuery";
import { askAssistant } from "@lib/services/assistant";
import { useUserStore } from "@store/userStore";
import { useTheme } from "@/theme";

/**
 * Assistant — question answering over the user's own ledger (PRODUCT.md). The
 * breathing AiOrb from DESIGN.md signature moment 3 anchors the empty state as
 * the one saturated accent on screen; once a question is asked the screen
 * becomes a working conversation. Answers are grounded in a re-read of the last
 * 30 days of transactions plus the monthly budget — never invented. Voice
 * answering lands with a later pass, so this pass ships the text path honestly.
 */
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  failed?: boolean;
};

const SUGGESTIONS = [
  "Where did this month’s money go?",
  "Can I afford this?",
  "How did my balance change?",
];

export default function AssistantScreen() {
  const t = useTheme();
  const reduce = useReduceMotion();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const currency = useUserStore((s) => s.currency);

  const { refetch: refetchTransactions } = useTransactionsQuery();
  const { refetch: refetchBudget } = useBudgetQuery();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const listRef = useRef<FlatList<ChatMessage>>(null);
  const lastQuestion = useRef<string | null>(null);

  // Clear the floating LenvyTabBar (66 pt + bottom inset) plus the Add tab's
  // 22 pt FAB lift so the composer and the last bubble never hide behind it.
  const tabBarClear =
    66 +
    Math.max(insets.bottom, Platform.OS === "web" ? 12 : 8) +
    22 +
    t.spacing[2];

  const sendMessage = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || sending || !user) return;

      lastQuestion.current = text;
      setMessages((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: "user", content: text },
      ]);
      setInput("");
      setSending(true);

      try {
        const [{ data: transactions = [] }, { data: budget = null }] =
          await Promise.all([refetchTransactions(), refetchBudget()]);
        const reply = await askAssistant(text, transactions, budget, currency);
        setMessages((prev) => [
          ...prev,
          { id: `a-${Date.now() + 1}`, role: "assistant", content: reply },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `ae-${Date.now() + 1}`,
            role: "assistant",
            failed: true,
            content:
              "Couldn’t reach your ledger just now. Check your connection and try again.",
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [sending, user, refetchTransactions, refetchBudget, currency],
  );

  // Keep the newest turn in view as messages arrive or the typing dot shows.
  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      listRef.current?.scrollToEnd({ animated: !reduce }),
    );
    return () => cancelAnimationFrame(raf);
  }, [messages, sending, reduce]);

  const hasChat = messages.length > 0;
  const gutter = t.spacing[5];

  const retryLast = useCallback(() => {
    if (lastQuestion.current) void sendMessage(lastQuestion.current);
  }, [sendMessage]);

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <Box style={{ paddingHorizontal: gutter, paddingBottom: t.spacing[3] }}>
        <ChatBubble role={item.role} content={item.content} failed={item.failed} />
      </Box>
    ),
    [gutter, t.spacing],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  const composer = useMemo(
    () => (
      <Composer
        value={input}
        onChangeText={setInput}
        onSubmit={() => void sendMessage(input)}
        busy={sending}
        gutter={gutter}
        bottomClear={tabBarClear}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [input, sending, gutter, tabBarClear],
  );

  return (
    <Screen edges={["top"]}>
      {/* Header — quiet, so the orb keeps the single accent slot in the hero */}
      <Box
        style={{
          paddingHorizontal: gutter,
          paddingTop: t.spacing[2],
          paddingBottom: t.spacing[3],
          gap: 2,
        }}
      >
        <Text variant="heading" tone="ink">
          Assistant
        </Text>
        <Text variant="caption" tone="subtle">
          Answers from your own numbers
        </Text>
      </Box>

      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? tabBarClear : 0}
        style={{ flex: 1 }}
      >
        {hasChat ? (
          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={{
              paddingTop: t.spacing[2],
              paddingBottom: t.spacing[2],
            }}
            keyboardDismissMode="interactive"
            ListFooterComponent={
              <View style={{ paddingHorizontal: gutter, paddingBottom: t.spacing[3] }}>
                {sending ? (
                  <TypingBubble />
                ) : messages[messages.length - 1]?.failed ? (
                  <Button
                    label="Try again"
                    variant="secondary"
                    size="sm"
                    onPress={retryLast}
                    style={{ alignSelf: "flex-start" }}
                  />
                ) : null}
              </View>
            }
          />
        ) : (
          <EmptyHero
            gutter={gutter}
            reduce={reduce}
            onPick={(q) => void sendMessage(q)}
          />
        )}

        {composer}
      </KeyboardAvoidingView>
    </Screen>
  );
}

/**
 * First-run stage: the breathing orb hero, a display-serif invitation, and the
 * three questions the assistant will most often be asked. Chips are tappable
 * and send immediately.
 */
function EmptyHero({
  gutter,
  reduce,
  onPick,
}: {
  gutter: number;
  reduce: boolean;
  onPick: (question: string) => void;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: gutter,
        paddingBottom: t.spacing[8],
        gap: t.spacing[7],
      }}
    >
      <Enter delay={reduce ? 0 : 60}>
        <AiOrb size={108} />
      </Enter>

      <Box style={{ gap: t.spacing[3], alignItems: "center" }}>
        <Enter delay={reduce ? 40 : 140}>
          <Text variant="displayL" tone="ink" align="center">
            Ask about your money
          </Text>
        </Enter>
        <Enter delay={reduce ? 80 : 220}>
          <Text variant="body" tone="muted" align="center" style={{ maxWidth: 320 }}>
            Answers come straight from your own transactions and budget — nothing
            invented.
          </Text>
        </Enter>
      </Box>

      <Box style={{ gap: t.spacing[2], width: "100%", alignItems: "center" }}>
        {SUGGESTIONS.map((q, i) => (
          <Enter key={q} delay={reduce ? 120 + i * 40 : 300 + i * 80}>
            <Chip
              label={q}
              variant="suggestion"
              onPress={() => onPick(q)}
              style={{ maxWidth: "100%" }}
            />
          </Enter>
        ))}
      </Box>
    </View>
  );
}

/**
 * Bottom composer — an L3 pill holding the text field and the accent send
 * button. Stays pinned above the tab bar; the KeyboardAvoidingView lifts it
 * clear of the keyboard. Send is disabled until there is something to send.
 */
function Composer({
  value,
  onChangeText,
  onSubmit,
  busy,
  gutter,
  bottomClear,
}: {
  value: string;
  onChangeText: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
  gutter: number;
  bottomClear: number;
}) {
  const t = useTheme();
  const canSend = value.trim().length > 0 && !busy;

  return (
    <Box
      style={{
        paddingHorizontal: gutter,
        paddingTop: t.spacing[2],
        paddingBottom: bottomClear,
      }}
    >
      <Box
        surface="surfaceRaised"
        level="L3"
        radius="full"
        padX={t.spacing[3]}
        padY={t.spacing[2]}
        style={{ flexDirection: "row", alignItems: "center", gap: t.spacing[2] }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Ask about your money…"
          placeholderTextColor={t.colors.inkSubtle}
          editable={!busy}
          onSubmitEditing={onSubmit}
          returnKeyType="send"
          multiline
          accessibilityLabel="Ask the assistant"
          style={{
            flex: 1,
            ...t.typography.body,
            color: t.colors.ink,
            maxHeight: 120,
            minHeight: 28,
            paddingVertical: t.spacing[1],
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send question"
          disabled={!canSend}
          onPress={onSubmit}
          hitSlop={6}
          style={({ pressed }) => [
            {
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: canSend ? t.colors.accent : t.colors.surfaceSunken,
              opacity: pressed && canSend ? 0.85 : 1,
              transform: [{ scale: pressed && canSend ? 0.94 : 1 }],
            },
          ]}
        >
          <PlatformIcon
            ios="arrow.up"
            lucide="ArrowUpRight"
            size={20}
            color={canSend ? t.colors.inkInverse : t.colors.inkSubtle}
            strokeWidth={2.25}
          />
        </Pressable>
      </Box>
    </Box>
  );
}
