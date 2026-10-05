import React, { type ReactNode } from "react";
import { Pressable, Text, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { useNativeTheme } from "./theme";

export type NativeButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type NativeButtonSize = "small" | "medium" | "large";

export interface NativeButtonProps {
  label: string;
  onPress: PressableProps["onPress"];
  variant?: NativeButtonVariant;
  size?: NativeButtonSize;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  leading?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function NativeButton({
  label,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  accessibilityLabel,
  accessibilityHint,
  leading,
  style,
}: NativeButtonProps) {
  const { colors, spacing, textSizes, fontWeights, radii } = useNativeTheme();
  const isDisabled = disabled || loading;
  const [backgroundColor, foregroundColor] = isDisabled
    ? [colors.muted, colors.tertiary]
    : buttonColors(variant, colors);
  const verticalPadding = size === "small" ? spacing["2"] : size === "large" ? spacing["4"] : spacing["3"];
  const horizontalPadding = size === "small" ? spacing["3"] : spacing["4"];
  const fontSize = size === "small" ? textSizes.sm : size === "large" ? textSizes.lg : textSizes.base;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={[
        {
          minHeight: size === "large" ? spacing["14"] : spacing["12"],
          paddingHorizontal: horizontalPadding,
          paddingVertical: verticalPadding,
          borderRadius: radii.lg,
          backgroundColor,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: spacing["2"],
        },
        style,
      ]}
    >
      {leading}
      <Text style={{ color: foregroundColor, fontSize, fontWeight: fontWeights.semibold }}>{label}</Text>
    </Pressable>
  );
}

function buttonColors(variant: NativeButtonVariant, colors: ReturnType<typeof useNativeTheme>["colors"]): [string, string] {
  switch (variant) {
    case "primary":
      return [colors.primary, colors["primary-foreground"]];
    case "destructive":
      return [colors.destructive, colors["destructive-foreground"]];
    case "secondary":
      return [colors.secondary, colors["text-primary"]];
    case "ghost":
      return ["transparent", colors["text-primary"]];
  }
}

export interface NativeSurfaceProps {
  children: ReactNode;
  tone?: "card" | "muted" | "background";
  style?: StyleProp<ViewStyle>;
}

export function NativeSurface({ children, tone = "card", style }: NativeSurfaceProps) {
  const { colors, spacing, radii } = useNativeTheme();
  const backgroundColor = tone === "muted" ? colors.muted : tone === "background" ? colors.background : colors.card;
  return (
    <View
      style={[
        {
          backgroundColor,
          borderColor: colors["border-default"],
          borderWidth: spacing.px,
          borderRadius: radii.xl,
          padding: spacing["4"],
          gap: spacing["2"],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export type NativeBadgeVariant = "default" | "secondary" | "accent" | "success" | "warning" | "destructive";

export interface NativeBadgeProps {
  label: string;
  variant?: NativeBadgeVariant;
  accessibilityLabel?: string;
}

export function NativeBadge({ label, variant = "default", accessibilityLabel }: NativeBadgeProps) {
  const { colors, spacing, textSizes, fontWeights, radii } = useNativeTheme();
  const [backgroundColor, foregroundColor] = badgeColors(variant, colors);
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? label}
      style={{ alignSelf: "flex-start", paddingHorizontal: spacing["2"], paddingVertical: spacing["1"], borderRadius: radii.full, backgroundColor }}
    >
      <Text style={{ color: foregroundColor, fontSize: textSizes.sm, fontWeight: fontWeights.medium }}>{label}</Text>
    </View>
  );
}

function badgeColors(variant: NativeBadgeVariant, colors: ReturnType<typeof useNativeTheme>["colors"]): [string, string] {
  switch (variant) {
    case "secondary":
      return [colors.secondary, colors["text-primary"]];
    case "accent":
      return [colors.accent, colors["text-primary"]];
    case "success":
      return [colors.success, colors["success-foreground"]];
    case "warning":
      return [colors.warning, colors["warning-foreground"]];
    case "destructive":
      return [colors.destructive, colors["destructive-foreground"]];
    case "default":
      return [colors.primary, colors["primary-foreground"]];
  }
}

export interface NativeTabItem<Value extends string = string> {
  value: Value;
  label: string;
  accessibilityLabel?: string;
}

export interface NativeTabBarProps<Value extends string> {
  items: readonly NativeTabItem<Value>[];
  value: Value;
  onChange: (value: Value) => void;
}

export function NativeTabBar<Value extends string>({ items, value, onChange }: NativeTabBarProps<Value>) {
  const { colors, spacing, textSizes, fontWeights, radii } = useNativeTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={{ flexDirection: "row", backgroundColor: colors.card, borderTopColor: colors["border-default"], borderTopWidth: spacing.px, padding: spacing["2"], gap: spacing["1"] }}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <Pressable
            key={item.value}
            accessibilityRole="tab"
            accessibilityLabel={item.accessibilityLabel ?? item.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(item.value)}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: spacing["12"],
              paddingHorizontal: spacing["2"],
              paddingVertical: spacing["2"],
              borderRadius: radii.lg,
              backgroundColor: selected ? colors.accent : pressed ? colors.secondary : colors.card,
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <Text style={{ color: selected ? colors["text-primary"] : colors["text-secondary"], fontSize: textSizes.sm, fontWeight: selected ? fontWeights.semibold : fontWeights.normal }}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
