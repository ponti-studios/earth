import darkTokens from "./generated/dark.colors.generated";
import foundations from "./generated/foundations.generated";
import lightTokens from "./generated/light.colors.generated";

const toPixels = (value: string) => {
  if (value.endsWith("rem")) return Number.parseFloat(value) * 16;
  if (value.endsWith("px")) return Number.parseFloat(value);
  throw new Error(`Unsupported foundation dimension: ${value}`);
};

const toMilliseconds = (value: string) => Number.parseFloat(value);
const toBezier = (value: number[]) => `cubic-bezier(${value.join(", ")})`;
type NormalizedSpacingKey<Key> = Key extends number
  ? `${Key}`
  : Key extends `${infer Whole}-${infer Fraction}`
    ? `${Whole}.${Fraction}`
    : Key;
export type SpacingToken = NormalizedSpacingKey<keyof (typeof foundations)["spacing-scale"]>;

export const colorTokenNames = Object.keys(lightTokens) as Array<keyof typeof lightTokens>;
export type ColorToken = keyof typeof lightTokens;
export type ColorMode = "light" | "dark";
export type ColorTheme = Readonly<Record<ColorToken, string>>;

export const colorThemes = {
  light: lightTokens,
  dark: darkTokens,
} as const satisfies Record<ColorMode, ColorTheme>;

export const spacing = Object.fromEntries(
  Object.entries(foundations["spacing-scale"]).map(([key, value]) => [
    key.replace("-", "."),
    toPixels(value),
  ]),
) as Record<SpacingToken, number>;

export const fontFamilies = Object.fromEntries(
  Object.entries(foundations.font).map(([key, value]) => [key, value.join(", ")]),
) as Record<keyof typeof foundations.font, string>;

export const textSizes = Object.fromEntries(
  Object.entries(foundations.text).map(([key, value]) => [key, toPixels(value)]),
) as Record<keyof typeof foundations.text, number>;
export const textLineHeights = foundations["text-line-height"];
export const fontWeights = Object.fromEntries(
  Object.entries(foundations["font-weight"]).map(([key, value]) => [key, String(value)]),
) as Record<keyof (typeof foundations)["font-weight"], string>;
export const tracking = foundations.tracking;
export const leading = foundations.leading;
export const radii = Object.fromEntries(
  Object.entries(foundations.radius).map(([key, value]) => [key, toPixels(value)]),
) as Record<keyof typeof foundations.radius, number>;
export const shadows = foundations.shadow;
export const breakpoints = foundations.breakpoint;
export const containers = foundations.container;
export const zIndices = foundations["z-index"];
export const easing = Object.fromEntries(
  Object.entries(foundations.ease).map(([key, value]) => [key, toBezier(value)]),
) as Record<keyof typeof foundations.ease, string>;
export const transitionDurations = Object.fromEntries(
  Object.entries(foundations.duration).map(([key, value]) => [key, toMilliseconds(value)]),
) as Record<keyof typeof foundations.duration, number>;
export const animations = foundations.animate;

export type RadiusToken = keyof typeof radii;
export type TextSizeToken = keyof typeof textSizes;
export type FontWeightToken = keyof typeof fontWeights;
export type TrackingToken = keyof typeof tracking;
export type LeadingToken = keyof typeof leading;
export type ShadowToken = keyof typeof shadows;
