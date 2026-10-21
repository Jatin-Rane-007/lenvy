import { SymbolView, type SymbolViewProps } from "expo-symbols";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Briefcase,
  Building,
  CalendarDays,
  Car,
  ChartPie,
  Check,
  ChevronDown,
  ChevronRight,
  Coins,
  Download,
  Film,
  Gauge,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Inbox,
  Keyboard,
  Landmark,
  Laptop,
  Mic,
  Package,
  PieChart,
  Plane,
  Plus,
  Receipt,
  ReceiptText,
  RefreshCw,
  ScanLine,
  Scissors,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  SquarePen,
  Trash,
  TrendingUp,
  User,
  Utensils,
  Wallet,
  X,
  Zap,
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
  ChartPie,
  Download,
  Settings,
  ChevronRight,
  TrendingUp,
  Coins,
  CalendarDays,
  Inbox,
  Gauge,
  Landmark,
  Check,
  ChevronDown,
  SquarePen,
  Banknote,
  Trash,
  X,
  // Category glyphs — see @components/data/categoryVisuals
  Utensils,
  ShoppingCart,
  Car,
  ShoppingBag,
  Film,
  HeartPulse,
  Zap,
  GraduationCap,
  Plane,
  Shield,
  RefreshCw,
  Scissors,
  Package,
  Briefcase,
  Laptop,
  Building,
  Gift,
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
