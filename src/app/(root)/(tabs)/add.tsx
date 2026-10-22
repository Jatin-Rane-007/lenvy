import { useUser } from "@clerk/expo";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ReceiptScannerModal, type ReceiptCapture } from "@components/ai/ReceiptScannerModal";
import { VoiceRecorderModal } from "@components/ai/VoiceRecorderModal";
import { useTheme } from "@/theme";
import type {
  ExtractedTransaction,
  InputMethod,
  TransactionType,
} from "@/types/transaction";
import { Dip, Enter, Float, Pulse, useReduceMotion } from "@components/animated";
import { getCategoryLabel, getCategoryVisual } from "@components/data/categoryVisuals";
import { DatePickerField } from "@components/form/DatePickerField";
import { SegmentedControl } from "@components/form/SegmentedControl";
import { PlatformIcon, type PlatformIconProps } from "@components/icons";
import { Badge, Box, Chip, Screen, Text } from "@components/primitives";
import {
  CATEGORIES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type CategoryKey,
} from "@constants/categories";
import { currencySymbol } from "@constants/currencies";
import { useCreateTransaction } from "@hooks/mutations/useTransactionMutaion";
import { useAccountsQuery } from "@hooks/queries/useAccountsQuery";
import { extractTransactionFromReceipt } from "@lib/services/extractTransaction";
import { formatDayLabel, formatPrice, parseAmount, startOfDay } from "@lib/utils";
import {
  hasDraftSignal,
  parseVoiceDraft,
} from "@lib/utils/voiceParser";
import { useUserStore } from "@store/userStore";

const TYPE_OPTIONS = [
  { key: "EXPENSE" as const, label: "Expense" },
  { key: "INCOME" as const, label: "Income" },
];

function yesterday(): Date {
  const d = startOfDay();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
}

export default function AddTransactionScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const { user } = useUser();
  const currency = useUserStore((s) => s.currency);

  const {
    data: accounts = [],
    isLoading: loadingAccounts,
    isError: accountsError,
    refetch: refetchAccounts,
  } = useAccountsQuery();
  const { mutateAsync: createTransaction, isPending: saving } =
    useCreateTransaction();

  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryKey>("food");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [date, setDate] = useState(() => startOfDay(new Date()));
  const [description, setDescription] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // ── AI capture state ──────────────────────────────────────────
  // inputMethod records which capture path produced the content and is
  // tagged onto the row at save time; the modals are the AI tier, the
  // inline transcript stage below is the no-key/no-mic fallback.
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voiceHint, setVoiceHint] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [inputMethod, setInputMethod] = useState<InputMethod>("MANUAL");
  const [extractionHint, setExtractionHint] = useState<string | null>(null);

  // Home-screen capture cards deep-link in as /add?action=scan|voice.
  // Deferred a tick so the tab navigation settles (and to keep the
  // React Compiler's no-sync-setState-in-effect rule happy).
  const params = useLocalSearchParams<{ action?: string }>();
  useEffect(() => {
    const action = params.action;
    if (action !== "scan" && action !== "voice") return;
    const id = setTimeout(() => {
      if (action === "scan") setScannerOpen(true);
      else setVoiceModalOpen(true);
      router.setParams({ action: undefined });
    }, 0);
    return () => clearTimeout(id);
  }, [params.action, router]);

  const categories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const symbol = currencySymbol(currency.toUpperCase());
  const gutter = t.spacing[5];
  // Derived default — falls back to the first (default) account until the
  // user picks one, so no state synchronization effect is needed.
  const activeAccountId = accountId ?? accounts[0]?.id ?? null;

  const handleType = (next: TransactionType) => {
    setType(next);
    setCategory(
      (next === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0].key,
    );
  };

  // AI filled the form (PRODUCT.md: extractions are reviewable, never
  // final). Every field lands only when confidently present; whatever the
  // model couldn't read is called out in a hint instead of guessed.
  const applyExtraction = (result: ExtractedTransaction) => {
    const categoryList =
      result.type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const isValidCategory = (key: CategoryKey | null): key is CategoryKey =>
      !!key && categoryList.some((c) => c.key === key);

    if (result.type) setType(result.type);
    if (isValidCategory(result.category)) {
      setCategory(result.category);
    } else if (result.type && CATEGORIES[category]?.type !== result.type) {
      // Type flipped and no valid category came back — keep the chips
      // honest by selecting the new type's first key.
      setCategory(categoryList[0].key);
    }
    if (result.amount != null) {
      setAmount(String(result.amount));
      setAmountError(null);
    }
    if (result.description) setDescription(result.description);
    if (result.date) {
      // Parse YYYY-MM-DD component-wise so the day never shifts a TZ.
      const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(result.date);
      if (parts) {
        const parsed = new Date(
          Number(parts[1]),
          Number(parts[2]) - 1,
          Number(parts[3]),
        );
        if (!Number.isNaN(parsed.getTime()) && parsed <= new Date()) {
          setDate(parsed);
        }
      }
    }

    const missing = [
      result.amount == null && "amount",
      !isValidCategory(result.category) && "category",
    ].filter(Boolean) as string[];
    setExtractionHint(
      missing.length > 0
        ? `Couldn't confidently read the ${missing.join(" and ")} \u2014 fill it in below.`
        : null,
    );
    setFormError(null);
  };

  // Camera capture → Gemini → prefilled form. The photo stays attached
  // even when extraction fails (missing key, offline) so manual entry
  // keeps the receipt in view.
  const handleReceiptCaptured = async (capture: ReceiptCapture) => {
    setScannerOpen(false);
    setReceiptUri(capture.uri);
    setVoiceOpen(false);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScanning(true);
    try {
      const extracted = await extractTransactionFromReceipt(
        capture.base64,
        capture.mimeType,
      );
      applyExtraction(extracted);
      setInputMethod("RECEIPT_SCAN");
    } catch {
      setExtractionHint("Couldn't read that receipt \u2014 enter the details below.");
    } finally {
      setScanning(false);
    }
  };

  const handleVoiceExtracted = (result: ExtractedTransaction) => {
    applyExtraction(result);
    setTranscript(result.transcript ?? "");
    setVoiceOpen(true);
    setInputMethod("VOICE");
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Local rule-based parse of the spoken line — every field it fills stays
  // editable below (PRODUCT.md: AI drafts are reviewable, never final).
  const parseDraft = () => {
    const spoken = transcript.trim();
    if (!spoken) {
      setVoiceHint("Say something first — e.g. \u201Cspent 400 on groceries yesterday\u201D.");
      return;
    }
    const draft = parseVoiceDraft(spoken);
    if (!hasDraftSignal(draft)) {
      setVoiceHint("Couldn't read an amount from that. Fill the fields below — the transcript is still saved.");
      return;
    }
    if (draft.type) {
      setType(draft.type);
      // The current category may belong to the other type — reset it so the
      // chips always show a selected, type-valid key.
      if (CATEGORIES[category]?.type !== draft.type) {
        setCategory(
          (draft.type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0]
            .key,
        );
      }
    }
    if (draft.amount !== null) {
      setAmount(String(draft.amount));
      setAmountError(null);
    }
    if (
      draft.category &&
      CATEGORIES[draft.category]?.type === (draft.type ?? type)
    ) {
      setCategory(draft.category);
    }
    if (draft.date) setDate(startOfDay(new Date(draft.date)));
    if (draft.description && !description.trim()) {
      setDescription(draft.description);
    }

    const found: string[] = [];
    if (draft.amount !== null) found.push(formatPrice(draft.amount, currency));
    if (draft.category) found.push(getCategoryLabel(draft.category));
    if (draft.date) found.push(formatDayLabel(new Date(draft.date)));
    setVoiceHint(`Draft filled: ${found.join(" \u00B7 \u2014 ")} review below.`);
    setFormError(null);
    setExtractionHint(null);
    setInputMethod("VOICE");
    void Haptics.selectionAsync();
  };

  const save = async () => {
    if (!user || saving) return;

    setFormError(null);
    const parsedAmount = parseAmount(amount);
    if (parsedAmount === null) {
      setAmountError("Enter an amount greater than zero.");
      return;
    }
    if (!activeAccountId) {
      setFormError("Pick an account first.");
      return;
    }

    const { error } = await createTransaction({
      user_id: user.id,
      account_id: activeAccountId,
      type,
      amount: parsedAmount,
      category,
      description: description.trim() || null,
      date: date.toISOString(),
      input_method: inputMethod,
      voice_transcript:
        inputMethod === "VOICE" ? transcript.trim() || null : null,
    });

    if (error) {
      setFormError("Something went wrong. Please try again.");
      return;
    }

    // Reset for the next entry before leaving the tab.
    setAmount("");
    setDescription("");
    setDate(startOfDay(new Date()));
    setReceiptUri(null);
    setTranscript("");
    setVoiceOpen(false);
    setVoiceHint(null);
    setScannerOpen(false);
    setVoiceModalOpen(false);
    setScanning(false);
    setInputMethod("MANUAL");
    setExtractionHint(null);
    handleType("EXPENSE");

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/transactions");
    }
  };

  const todaySelected = startOfDay(date).getTime() === startOfDay().getTime();
  const yesterdaySelected =
    startOfDay(date).getTime() === yesterday().getTime();

  let body: ReactNode;
  if (loadingAccounts) {
    body = (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="small" color={t.colors.accent} />
      </View>
    );
  } else if (accountsError) {
    body = (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: t.spacing[3],
        }}
      >
        <PlatformIcon
          ios="arrow.triangle.2.circlepath"
          lucide="RefreshCw"
          size={30}
          color={t.colors.inkSubtle}
        />
        <Text variant="body" tone="muted" align="center">
          Couldn&apos;t load your accounts.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void refetchAccounts()}
          style={{
            borderRadius: t.radii.md,
            borderWidth: 1,
            borderColor: t.colors.hairlineStrong,
            paddingHorizontal: t.spacing[4],
            paddingVertical: t.spacing[2],
          }}
        >
          <Text variant="bodyStrong" tone="accent">
            Try again
          </Text>
        </Pressable>
      </View>
    );
  } else if (accounts.length === 0) {
    body = (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: gutter,
          gap: t.spacing[2],
        }}
      >
        <Float>
          <PlatformIcon
            ios="tray"
            lucide="Inbox"
            size={44}
            color={t.colors.inkSubtle}
          />
        </Float>
        <Text variant="subhead" tone="ink" align="center">
          No accounts yet
        </Text>
        <Text variant="caption" tone="muted" align="center">
          Create an account before adding a transaction.
        </Text>
      </View>
    );
  } else {
    body = (
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: gutter,
          paddingTop: t.spacing[2],
          // Clear the floating tab bar plus a breath of space.
          paddingBottom: 66 + t.spacing[7] + Math.max(insets.bottom, 8),
          gap: t.spacing[5],
        }}
      >
        {/* ── Title ── */}
        <Enter>
          <Text variant="heading" tone="ink">
            Add transaction
          </Text>
        </Enter>

        {/* ── AI capture doors: scan or say it, manual stays below ── */}
        <Enter delay={reduce ? 0 : 60}>
          <View style={{ flexDirection: "row", gap: t.spacing[3] }}>
            <CaptureTile
              iosIcon="viewfinder"
              lucideIcon="ScanLine"
              label="Scan receipt"
              hint="Snap a photo"
              tint="info"
              ai
              active={Boolean(receiptUri)}
              onPress={() => {
                setScannerOpen(true);
                void Haptics.selectionAsync();
              }}
            />
            <CaptureTile
              iosIcon="mic"
              lucideIcon="Mic"
              label="Voice log"
              hint="Just say it"
              tint="caution"
              ai
              active={voiceModalOpen || voiceOpen}
              onPress={() => {
                setVoiceModalOpen(true);
                void Haptics.selectionAsync();
              }}
            />
          </View>
        </Enter>

        {/* ── AI extraction notes — what the model couldn't read ── */}
        {extractionHint ? (
          <Text variant="caption" tone="info" style={{ marginTop: -t.spacing[3] }}>
            {extractionHint}
          </Text>
        ) : null}

        {/* ── Attached receipt photo, removable ── */}
        {receiptUri ? (
          <Enter>
            <Box surface="surface" level="L1" radius="md" pad={t.spacing[3]}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: t.spacing[3],
                }}
              >
                <Image
                  source={{ uri: receiptUri }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: t.radii.sm,
                    backgroundColor: t.colors.surfaceSunken,
                  }}
                  contentFit="cover"
                  transition={150}
                  accessibilityLabel="Attached receipt photo"
                />
                <Box style={{ flex: 1 }} gap={2}>
                  <Text variant="bodyStrong" tone="ink">
                    Receipt attached
                  </Text>
                  <Text variant="caption" tone="muted">
                    Check the fields below before saving.
                  </Text>
                </Box>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove receipt photo"
                  hitSlop={10}
                  onPress={() => setReceiptUri(null)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: t.radii.full,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: t.colors.surfaceSunken,
                  }}
                >
                  <PlatformIcon
                    ios="xmark"
                    lucide="X"
                    size={14}
                    color={t.colors.inkMuted}
                  />
                </Pressable>
              </View>
            </Box>
          </Enter>
        ) : null}

        {/* ── Voice stage: breathe, speak, parse into a reviewable draft ── */}
        {voiceOpen ? (
          <Enter>
            <Box
              surface="surfaceRaised"
              level="L2"
              radius="xl"
              pad={t.spacing[5]}
              gap={t.spacing[4]}
            >
              <View style={{ alignItems: "center", gap: t.spacing[3] }}>
                <Pulse>
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: t.radii.full,
                      backgroundColor: t.colors.accentSoft,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <PlatformIcon
                      ios="mic.fill"
                      lucide="Mic"
                      size={24}
                      color={t.colors.accent}
                    />
                  </View>
                </Pulse>
                <Text variant="caption" tone="muted" align="center">
                  Say it or type it — {"\u201C"}spent 400 on groceries
                  yesterday{"\u201D"}. Your keyboard{`\u2019`}s mic key dictates.
                </Text>
              </View>

              <Box
                surface="surfaceSunken"
                level="L1"
                radius="md"
                padX={4}
              >
                <TextInput
                  value={transcript}
                  onChangeText={(v) => {
                    setTranscript(v);
                    setVoiceHint(null);
                  }}
                  placeholder="What did you spend or earn?"
                  placeholderTextColor={t.colors.inkSubtle}
                  multiline
                  style={[
                    t.typography.body,
                    {
                      color: t.colors.ink,
                      minHeight: 72,
                      paddingTop: t.spacing[3],
                      paddingBottom: t.spacing[3],
                      paddingHorizontal: t.spacing[3],
                      textAlignVertical: "top",
                    },
                  ]}
                />
              </Box>

              {voiceHint ? (
                <Text variant="caption" tone="info">
                  {voiceHint}
                </Text>
              ) : null}

              <View style={{ flexDirection: "row", gap: t.spacing[3] }}>
                <QuietButton
                  label="Parse draft"
                  onPress={parseDraft}
                  style={{ flex: 1 }}
                />
                <QuietButton
                  label="Done"
                  onPress={() => {
                    setVoiceOpen(false);
                    setVoiceHint(null);
                  }}
                  filled
                  style={{ flex: 1 }}
                />
              </View>
            </Box>
          </Enter>
        ) : null}

        {/* ── Type ─ */}
        <Enter delay={reduce ? 0 : 120}>
          <SegmentedControl
            options={TYPE_OPTIONS}
            value={type}
            onChange={handleType}
          />
        </Enter>

        {/* ── Amount: the loudest field on the screen ── */}
        <Enter delay={reduce ? 0 : 180} style={{ gap: t.spacing[2] }}>
          <Text variant="bodyStrong" tone="ink">
            Amount
          </Text>
          <Box surface="surface" level="L1" radius="md" padX={4}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: t.spacing[2],
                paddingVertical: t.spacing[2],
              }}
            >
              <Text variant="numericL" tone="subtle">
                {symbol}
              </Text>
              <TextInput
                value={amount}
                onChangeText={(v) => {
                  setAmount(v.replace(/[^0-9.,]/g, ""));
                  setAmountError(null);
                  setFormError(null);
                }}
                placeholder="0.00"
                placeholderTextColor={t.colors.inkSubtle}
                keyboardType="numeric"
                returnKeyType="done"
                style={[
                  t.typography.numericL,
                  {
                    flex: 1,
                    color: t.colors.ink,
                    paddingVertical: t.spacing[2],
                  },
                ]}
              />
            </View>
          </Box>
          {amountError ? (
            <Text variant="caption" tone="negative">
              {amountError}
            </Text>
          ) : null}
        </Enter>

        {/* ── Category: glyph chips with the swatch glow from DESIGN.md ── */}
        <Enter delay={reduce ? 0 : 240} style={{ gap: t.spacing[2] }}>
          <Text variant="bodyStrong" tone="ink">
            Category
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: t.spacing[2],
            }}
          >
            {categories.map((c) => {
              const visual = getCategoryVisual(c.key);
              const swatch = t.categories[visual.swatch];
              const selected = category === c.key;
              return (
                <Chip
                  key={c.key}
                  label={c.label}
                  variant="category"
                  swatch={swatch}
                  selected={selected}
                  onPress={() => setCategory(c.key)}
                  style={{ minHeight: 40 }}
                  icon={
                    <PlatformIcon
                      ios={visual.ios}
                      lucide={visual.lucide}
                      size={14}
                      color={selected ? swatch : t.colors.inkSubtle}
                    />
                  }
                />
              );
            })}
          </View>
        </Enter>

        {/* ── Account ── */}
        <Enter delay={reduce ? 0 : 300} style={{ gap: t.spacing[2] }}>
          <Text variant="bodyStrong" tone="ink">
            Account
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: t.spacing[2],
            }}
          >
            {accounts.map((a) => (
              <Chip
                key={a.id}
                label={a.name}
                selected={activeAccountId === a.id}
                onPress={() => {
                  setAccountId(a.id);
                  setFormError(null);
                }}
                style={{ minHeight: 40 }}
              />
            ))}
          </View>
        </Enter>

        {/* ── Date: quick picks first, full calendar behind them ── */}
        <Enter delay={reduce ? 0 : 360} style={{ gap: t.spacing[2] }}>
          <Text variant="bodyStrong" tone="ink">
            Date
          </Text>
          <View style={{ flexDirection: "row", gap: t.spacing[2] }}>
            <Chip
              label="Today"
              selected={todaySelected}
              onPress={() => setDate(startOfDay(new Date()))}
              style={{ minHeight: 40 }}
            />
            <Chip
              label="Yesterday"
              selected={yesterdaySelected}
              onPress={() => setDate(yesterday())}
              style={{ minHeight: 40 }}
            />
          </View>
          <DatePickerField value={date} onChange={setDate} />
        </Enter>

        {/* ── Description ── */}
        <Enter delay={reduce ? 0 : 420} style={{ gap: t.spacing[2] }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: t.spacing[2],
            }}
          >
            <Text variant="bodyStrong" tone="ink">
              Description
            </Text>
            <Text variant="caption" tone="subtle">
              Optional
            </Text>
          </View>
          <Box surface="surface" level="L1" radius="md" padX={4}>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add a note"
              placeholderTextColor={t.colors.inkSubtle}
              returnKeyType="done"
              style={[
                t.typography.body,
                {
                  color: t.colors.ink,
                  paddingVertical: t.spacing[3],
                  minHeight: 48,
                },
              ]}
            />
          </Box>
        </Enter>

        {/* ── Save: thumb-zone CTA, static style (React-Compiler-safe) ── */}
        <Enter delay={reduce ? 0 : 480} style={{ gap: t.spacing[3] }}>
          {formError ? (
            <Text variant="caption" tone="negative">
              {formError}
            </Text>
          ) : null}
          <SaveButton onPress={() => void save()} loading={saving} />
        </Enter>
      </ScrollView>
    );
  }

  return (
    <Screen edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {body}
      </KeyboardAvoidingView>

      {/* Receipt scanner — live camera with the corner-tick frame */}
      <ReceiptScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onCaptured={(capture) => void handleReceiptCaptured(capture)}
      />

      {/* Voice stage — record, Gemini transcribes and extracts */}
      <VoiceRecorderModal
        visible={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onExtracted={handleVoiceExtracted}
        onFallback={() => {
          setVoiceModalOpen(false);
          setVoiceOpen(true);
        }}
      />

      {/* Reading-receipt overlay while Gemini works */}
      {scanning ? (
        <View
          style={{
            position: "absolute",
            inset: 0,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: t.colors.overlay,
          }}
        >
          <Box
            surface="surfaceRaised"
            level="L3"
            radius="lg"
            pad={t.spacing[5]}
            style={{ alignItems: "center", gap: t.spacing[3] }}
          >
            <ActivityIndicator size="small" color={t.colors.accent} />
            <Text variant="caption" tone="muted">
              Reading receipt…
            </Text>
          </Box>
        </View>
      ) : null}
    </Screen>
  );
}

/**
 * AI capture tile — the home-screen CaptureCard's editorial language
 * (tinted glyph tile, hairline L1 surface, hue-topped border, AI badge),
 * compacted to a wide two-up row so the form stays the hero. `flex: 1`
 * lives on a plain View because Dip's Pressable function-style drops
 * layout props under React Compiler.
 */
function CaptureTile({
  iosIcon,
  lucideIcon,
  label,
  hint,
  tint,
  ai,
  active,
  onPress,
}: {
  iosIcon: string;
  lucideIcon: PlatformIconProps["lucide"];
  label: string;
  hint: string;
  tint: "info" | "caution";
  ai?: boolean;
  active?: boolean;
  onPress?: () => void;
}) {
  const t = useTheme();
  const hue = t.colors[tint];
  return (
    <View style={{ flex: 1 }}>
      <Dip onPress={onPress}>
        <Box
          surface={active ? "surfaceRaised" : "surface"}
          level={active ? "L2" : "L1"}
          radius="lg"
          pad={t.spacing[4]}
          gap={t.spacing[4]}
          style={{
            minHeight: 118,
            justifyContent: "space-between",
            borderTopWidth: 2,
            borderTopColor: `${hue}55`,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: t.radii.md,
                backgroundColor: `${hue}1F`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PlatformIcon
                ios={iosIcon}
                lucide={lucideIcon}
                size={20}
                color={hue}
              />
            </View>
            {ai ? <Badge label="AI" tone="accent" /> : null}
          </View>

          <Box gap={2}>
            <Text variant="bodyStrong" tone="ink" numberOfLines={1}>
              {label}
            </Text>
            <Text variant="caption" tone="subtle" numberOfLines={1}>
              {hint}
            </Text>
          </Box>
        </Box>
      </Dip>
    </View>
  );
}

/**
 * Secondary full-width action used inside the voice stage — outline idiom
 * from the error-state "Try again" button; `filled` flips to the accent
 * surface with inkInverse text. Static styles only (React-Compiler-safe).
 */
function QuietButton({
  label,
  onPress,
  filled,
  style,
}: {
  label: string;
  onPress: () => void;
  filled?: boolean;
  style?: { flex?: number };
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        alignItems: "center",
        justifyContent: "center",
        minHeight: 48,
        borderRadius: t.radii.md,
        borderWidth: filled ? 0 : 1,
        borderColor: t.colors.hairlineStrong,
        backgroundColor: filled ? t.colors.accent : "transparent",
        ...style,
      }}
    >
      <Text
        variant="bodyStrong"
        tone={filled ? "inverse" : "accent"}
        style={filled ? { color: t.colors.inkInverse } : undefined}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Filled accent CTA in the static-Pressable idiom established by
 * auth-submit.tsx: the Button primitive's render-prop style is dropped by
 * the experimental React Compiler on native, and a filled accent surface
 * takes inkInverse for contrast (accentInk is darker than accent).
 */
function SaveButton({
  onPress,
  loading,
}: {
  onPress: () => void;
  loading: boolean;
}) {
  const t = useTheme();
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: loading }}
      onPress={loading ? undefined : onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: t.spacing[2],
        minHeight: 56,
        paddingHorizontal: t.spacing[6],
        borderRadius: t.radii.lg,
        backgroundColor: t.colors.accent,
        opacity: loading ? 0.6 : pressed ? 0.9 : 1,
        transform: [{ scale: pressed && !loading ? 0.985 : 1 }],
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={t.colors.inkInverse} />
      ) : (
        <Text variant="subhead" style={{ color: t.colors.inkInverse }}>
          Save transaction
        </Text>
      )}
    </Pressable>
  );
}
