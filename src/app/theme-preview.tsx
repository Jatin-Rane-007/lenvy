import { ScrollView, View } from 'react-native';

import {
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Text,
} from '@components/primitives';
import { useTheme } from '@/theme';

/**
 * A living tour of the Lenvy design system: every token, every primitive,
 * both schemes. Reachable from `/theme-preview` (bypasses the auth gate
 * since it lives outside the `(root)` group). Delete or hide once features
 * have replaced the need for it.
 */
export default function ThemePreview() {
  const t = useTheme();

  return (
    <ScrollView
      contentContainerStyle={{
        backgroundColor: t.colors.canvas,
        padding: t.spacing[5],
        gap: t.spacing[7],
        paddingBottom: t.spacing[11],
      }}
    >
      <Header />

      <Section title="Color — surfaces">
        <Swatch role="canvas" />
        <Swatch role="surface" />
        <Swatch role="surfaceRaised" />
        <Swatch role="surfaceSunken" />
      </Section>

      <Section title="Color — ink">
        <Swatch role="ink" />
        <Swatch role="inkMuted" />
        <Swatch role="inkSubtle" />
        <Swatch role="inkInverse" />
      </Section>

      <Section title="Color — accent & states">
        <Swatch role="accent" />
        <Swatch role="accentSoft" />
        <Swatch role="accentInk" />
        <Swatch role="positive" />
        <Swatch role="negative" />
        <Swatch role="caution" />
        <Swatch role="info" />
      </Section>

      <Section title="Category swatches">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing[2] }}>
          {Object.entries(t.categories).map(([name, hex]) => (
            <View
              key={name}
              style={{
                width: 44,
                height: 44,
                borderRadius: t.radii.xs,
                backgroundColor: hex,
                borderWidth: 1,
                borderColor: t.colors.hairline,
              }}
            />
          ))}
        </View>
      </Section>

      <Section title="Typography">
        <Text variant="displayXl" tone="ink">
          ₹ 1,24,500
        </Text>
        <Text variant="displayL" tone="ink">
          Every number has a purpose.
        </Text>
        <Text variant="heading" tone="ink">
          Accounts
        </Text>
        <Text variant="subhead" tone="ink">
          Monthly budget
        </Text>
        <Text variant="body" tone="ink">
          Body copy reads at 15 pt with a 22 pt leading. Long-form sentences
          stay comfortable without crowding.
        </Text>
        <Text variant="bodyStrong" tone="ink">
          Emphasised body weight for inline labels and short answers.
        </Text>
        <Text variant="caption" tone="muted">
          Caption — timestamps, meta, chart axis labels.
        </Text>
        <Text variant="numericL" tone="positive">
          + ₹ 4,200.00
        </Text>
        <Text variant="numericM" tone="ink">
          ₹ 82,140 / ₹ 1,00,000
        </Text>
        <Text variant="mono" tone="muted">
          **** 4821
        </Text>
      </Section>

      <Section title="Spacing">
        <View style={{ gap: 4 }}>
          {(['4', '8', '12', '16', '20', '24', '32', '40', '56', '80'] as const).map((k) => {
            const size = t.spacing[k as unknown as 4];
            return (
              <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: size, height: 8, backgroundColor: t.colors.accent }} />
                <Text variant="caption" tone="muted">
                  {k} · {size} px
                </Text>
              </View>
            );
          })}
        </View>
      </Section>

      <Section title="Radius">
        <View style={{ flexDirection: 'row', gap: t.spacing[3], flexWrap: 'wrap' }}>
          {(['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((r) => (
            <View
              key={r}
              style={{
                width: 60,
                height: 60,
                borderRadius: t.radii[r],
                backgroundColor: t.colors.accentSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text variant="caption" tone="accent">
                {r}
              </Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Elevation">
        <Box surface="surface" level="L1" pad={4} radius="lg">
          <Text variant="body" tone="ink">L1 — quiet card</Text>
        </Box>
        <Box surface="surfaceRaised" level="L2" pad={4} radius="lg">
          <Text variant="body" tone="ink">L2 — raised / filter bar</Text>
        </Box>
        <Box surface="surfaceRaised" level="L3" pad={4} radius="xl">
          <Text variant="body" tone="ink">L3 — floating (sheet, FAB)</Text>
        </Box>
        <Box surface="surfaceRaised" level="L4" pad={4} radius="2xl">
          <Text variant="body" tone="ink">L4 — overlay (dialog, scan frame)</Text>
        </Box>
      </Section>

      <Section title="Button">
        <Button variant="primary" label="Primary" onPress={() => {}} />
        <Button variant="secondary" label="Secondary" onPress={() => {}} />
        <Button variant="ghost" label="Ghost" onPress={() => {}} />
        <Button variant="destructive" label="Delete account" onPress={() => {}} />
        <Button variant="link" label="Read the policy" onPress={() => {}} />
        <Button variant="primary" size="sm" label="Small" onPress={() => {}} />
        <Button variant="primary" size="lg" label="Large" onPress={() => {}} />
        <Button variant="primary" label="Loading" loading onPress={() => {}} />
        <Button variant="primary" label="Disabled" disabled onPress={() => {}} />
        <Button variant="primary" label="Full width" fullWidth onPress={() => {}} />
      </Section>

      <Section title="Chip">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing[2] }}>
          <Chip label="All" selected onPress={() => {}} />
          <Chip label="Income" onPress={() => {}} />
          <Chip label="Expenses" onPress={() => {}} />
          <Chip label="Transfers" onPress={() => {}} />
          <Chip label="Groceries" variant="category" swatch={t.categories.terracotta} selected onPress={() => {}} />
          <Chip label="Rent" variant="category" swatch={t.categories.harbor} onPress={() => {}} />
          <Chip label="Travel" variant="category" swatch={t.categories.periwinkle} onPress={() => {}} />
        </View>
      </Section>

      <Section title="Badge">
        <View style={{ gap: t.spacing[2] }}>
          <Badge label="On track" tone="positive" dot />
          <Badge label="84% used" tone="caution" dot />
          <Badge label="Over budget" tone="negative" dot />
          <Badge label="AI draft" tone="info" />
          <Badge label="Default" tone="accent" size="md" />
        </View>
      </Section>

      <Section title="Divider">
        <Divider />
        <Divider variant="sunken" thickness={4} />
        <Text variant="caption" tone="subtle">
          {'Space divider (variant="space") gives room without a line.'}
        </Text>
        <Divider variant="space" />
        <Text variant="body" tone="muted">
          Above this line: 16 px of pure gap.
        </Text>
      </Section>

      <Section title="Avatar">
        <View style={{ flexDirection: 'row', gap: t.spacing[3], alignItems: 'center' }}>
          <Avatar name="Jatin Sharma" size="sm" />
          <Avatar name="Jatin Sharma" size="md" />
          <Avatar name="Jatin Sharma" size="lg" />
          <Avatar name="Kestrel Bank" size="lg" initials="KB" />
        </View>
      </Section>

      <Section title="IconButton (label-only stubs — real icons land with feature screens)">
        <View style={{ flexDirection: 'row', gap: t.spacing[3] }}>
          <IconButton accessibilityLabel="Add" size="sm">
            <Text variant="bodyStrong" tone="ink">+</Text>
          </IconButton>
          <IconButton accessibilityLabel="Menu" variant="secondary">
            <Text variant="bodyStrong" tone="ink">⋯</Text>
          </IconButton>
          <IconButton accessibilityLabel="Capture" variant="primary" size="lg">
            <Text variant="subhead" tone="inverse">◉</Text>
          </IconButton>
        </View>
        <Text variant="caption" tone="subtle">
          Placeholder glyphs shown here so the shape and press state are
          visible. Replace with SF Symbols / Lucide when feature screens
          start shipping — DESIGN.md forbids Unicode as final icons.
        </Text>
      </Section>

      <View style={{ height: t.spacing[8] }} />
    </ScrollView>
  );
}

function Header() {
  const t = useTheme();
  return (
    <Box surface="surface" level="L2" pad={5} radius="xl" gap={2}>
      <Text variant="displayL" tone="ink">
        Lenvy
      </Text>
      <Text variant="body" tone="muted">
        Every number has a purpose.
      </Text>
      <Text variant="caption" tone="subtle">
        Current scheme: {t.scheme} · toggle via OS appearance
      </Text>
    </Box>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ gap: t.spacing[3] }}>
      <Text variant="heading" tone="ink">
        {title}
      </Text>
      <View style={{ gap: t.spacing[2] }}>{children}</View>
    </View>
  );
}

function Swatch({ role }: { role: keyof ReturnType<typeof useTheme>['colors'] }) {
  const t = useTheme();
  const value = t.colors[role];
  const onSwatch =
    role === 'ink' || role === 'accent' || role === 'info' || role === 'negative'
      ? t.colors.inkInverse
      : t.colors.ink;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing[3],
        padding: t.spacing[3],
        borderRadius: t.radii.md,
        backgroundColor: t.colors.surface,
        borderWidth: 1,
        borderColor: t.colors.hairline,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: t.radii.sm,
          backgroundColor: value,
          borderWidth: 1,
          borderColor: t.colors.hairline,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text variant="micro" style={{ color: onSwatch }}>
          {role.slice(0, 3).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" tone="ink">
          {role}
        </Text>
        <Text variant="caption" tone="muted">
          {value}
        </Text>
      </View>
    </View>
  );
}
