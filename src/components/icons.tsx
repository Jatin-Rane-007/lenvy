import { SymbolView, type SymbolViewProps } from "expo-symbols";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Coins,
  Download,
  Gauge,
  House,
  Inbox,
  Keyboard,
  Landmark,
  Mic,
  PieChart,
  Plus,
  Receipt,
  ReceiptText,
  ScanLine,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react-native";
import { Platform } from "react-native";

/**
 * DESIGN.md icon rule: SF Symbols on iOS, Lucide on Android/Web.
 * expo-symbols renders nothing outside Apple platforms, so every screen
 * goes through this component instead of SymbolView directly.
 */
const lucideIcons = {
  House,
  Receipt,
  ReceiptText,
  Plus,
  Sparkles,
  User,
  Wallet,
  ScanLine,
  Search,
  Mic,
  Keyboard,
  ArrowDownLeft,
  ArrowUpRight,
  PieChart,
  Download,
  Settings,
  ChevronRight,
  TrendingUp,
  Coins,
  CalendarDays,
  Inbox,
  Gauge,
  Landmark,
} satisfies Record<string, LucideIcon>;

export type LucideIconName = keyof typeof lucideIcons;

export type PlatformIconProps = {
  /** SF Symbol name — used on iOS only. Cast because the Expo type union is a generated literal set. */
  ios: string;
  /** Lucide icon key — used on Android/Web. */
  lucide: LucideIconName;
  size?: number;
  color: string;
  /** Stroke width for the Lucide branch (SF Symbols have their own weight). */
  strokeWidth?: number;
};

export function PlatformIcon({
  ios,
  lucide,
  size = 24,
  color,
  strokeWidth = 1.75,
}: PlatformIconProps) {
  if (Platform.OS === "ios") {
    return (
      <SymbolView
        name={ios as unknown as SymbolViewProps["name"]}
        tintColor={color}
        size={size}
      />
    );
  }
  const Icon = lucideIcons[lucide];
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}
