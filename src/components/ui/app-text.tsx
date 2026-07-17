import {
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
  Platform,
} from "react-native";
import { cn } from "@/lib/utils";

export interface AppTextProps extends RNTextProps {
  variant?: "sans" | "serif" | "rounded" | "mono";
  weight?: "light" | "normal" | "medium" | "semibold" | "bold";
  className?: string;
}

/**
 * Global Font Family Configuration
 * Change these values to swap the font families across the entire application instantly.
 * Supports custom fonts loaded via expo-font.
 */
const GLOBAL_FONT_FAMILIES = {
  sans: {
    light: Platform.select({
      ios: "System",
      android: "sans-serif-light",
      default: "sans-serif",
    }),
    normal: Platform.select({
      ios: "System",
      android: "sans-serif",
      default: "sans-serif",
    }),
    medium: Platform.select({
      ios: "System",
      android: "sans-serif-medium",
      default: "sans-serif",
    }),
    semibold: Platform.select({
      ios: "System",
      android: "sans-serif-medium",
      default: "sans-serif",
    }),
    bold: Platform.select({
      ios: "System",
      android: "sans-serif-bold",
      default: "sans-serif",
    }),
  },
  serif: {
    light: Platform.select({
      ios: "Georgia",
      android: "serif",
      default: "serif",
    }),
    normal: Platform.select({
      ios: "Georgia",
      android: "serif",
      default: "serif",
    }),
    medium: Platform.select({
      ios: "Georgia",
      android: "serif",
      default: "serif",
    }),
    semibold: Platform.select({
      ios: "Georgia-Bold",
      android: "serif",
      default: "serif",
    }),
    bold: Platform.select({
      ios: "Georgia-Bold",
      android: "serif",
      default: "serif",
    }),
  },
  rounded: {
    // iOS system rounded font, falls back to sans-serif on Android
    light: Platform.select({
      ios: "System",
      android: "sans-serif-light",
      default: "sans-serif",
    }),
    normal: Platform.select({
      ios: "System",
      android: "sans-serif",
      default: "sans-serif",
    }),
    medium: Platform.select({
      ios: "System",
      android: "sans-serif-medium",
      default: "sans-serif",
    }),
    semibold: Platform.select({
      ios: "System",
      android: "sans-serif-medium",
      default: "sans-serif",
    }),
    bold: Platform.select({
      ios: "System",
      android: "sans-serif-bold",
      default: "sans-serif",
    }),
  },
  mono: {
    light: Platform.select({
      ios: "Courier New",
      android: "monospace",
      default: "monospace",
    }),
    normal: Platform.select({
      ios: "Courier",
      android: "monospace",
      default: "monospace",
    }),
    medium: Platform.select({
      ios: "Courier-Bold",
      android: "monospace",
      default: "monospace",
    }),
    semibold: Platform.select({
      ios: "Courier-Bold",
      android: "monospace",
      default: "monospace",
    }),
    bold: Platform.select({
      ios: "Courier-Bold",
      android: "monospace",
      default: "monospace",
    }),
  },
};

export function AppText({
  variant = "sans",
  weight = "normal",
  className,
  style,
  ...props
}: AppTextProps) {
  // Determine standard font weight property
  const fontWeightValue = (() => {
    switch (weight) {
      case "light":
        return "300";
      case "medium":
        return "500";
      case "semibold":
        return "600";
      case "bold":
        return "700";
      case "normal":
      default:
        return "400";
    }
  })();

  const fontFamily = GLOBAL_FONT_FAMILIES[variant][weight];

  const textStyle: TextStyle = {
    fontFamily,
    fontWeight: Platform.OS === "ios" ? fontWeightValue : undefined, // Android relies on fontFamily mapping
  };

  // Add specific system rounded design on iOS
  if (variant === "rounded" && Platform.OS === "ios") {
    // Use system rounded font configuration
    textStyle.fontFamily = "System";
    // Native fontVariant or design can be set via system attributes but since we're using React Native,
    // custom font weight matches standard system design.
  }

  return (
    <RNText
      className={cn("text-foreground", className)}
      style={[textStyle, style]}
      {...props}
    />
  );
}
