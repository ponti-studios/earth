import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme, type TextStyle } from "react-native";
import { colorThemes, fontWeights, radii, spacing, textLineHeights, textSizes, type ColorMode, type ColorTheme } from "../styles/tokens";

export type NativeColorPreference = ColorMode | "system";

export interface NativeTheme {
  mode: ColorMode;
  colors: ColorTheme;
  spacing: typeof spacing;
  textSizes: typeof textSizes;
  textLineHeights: typeof textLineHeights;
  fontWeights: Readonly<Record<keyof typeof fontWeights, NonNullable<TextStyle["fontWeight"]>>>;
  radii: typeof radii;
}

function nativeFontWeight(token: keyof typeof fontWeights): NonNullable<TextStyle["fontWeight"]> {
  switch (fontWeights[token]) {
    case "100": return "100";
    case "200": return "200";
    case "300": return "300";
    case "400": return "400";
    case "500": return "500";
    case "600": return "600";
    case "700": return "700";
    case "800": return "800";
    case "900": return "900";
    default: throw new Error(`Unsupported native font-weight token: ${fontWeights[token]}`);
  }
}

const nativeFontWeights: NativeTheme["fontWeights"] = {
  thin: nativeFontWeight("thin"),
  extralight: nativeFontWeight("extralight"),
  light: nativeFontWeight("light"),
  normal: nativeFontWeight("normal"),
  medium: nativeFontWeight("medium"),
  semibold: nativeFontWeight("semibold"),
  bold: nativeFontWeight("bold"),
  extrabold: nativeFontWeight("extrabold"),
  black: nativeFontWeight("black"),
};

const NativeThemeContext = createContext<NativeTheme>({
  mode: "light",
  colors: colorThemes.light,
  spacing,
  textSizes,
  textLineHeights,
  fontWeights: nativeFontWeights,
  radii,
});

export interface NativeThemeProviderProps {
  children: React.ReactNode;
  colorPreference?: NativeColorPreference;
}

export function NativeThemeProvider({ children, colorPreference = "system" }: NativeThemeProviderProps) {
  const systemMode = useColorScheme();
  const mode: ColorMode = colorPreference === "system" ? (systemMode === "dark" ? "dark" : "light") : colorPreference;
  const value = useMemo<NativeTheme>(() => ({ mode, colors: colorThemes[mode], spacing, textSizes, textLineHeights, fontWeights: nativeFontWeights, radii }), [mode]);

  return <NativeThemeContext.Provider value={value}>{children}</NativeThemeContext.Provider>;
}

export function useNativeTheme(): NativeTheme {
  return useContext(NativeThemeContext);
}
