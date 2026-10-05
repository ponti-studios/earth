import { colorTokenNames, type ColorToken } from "./index";

/**
 * Color tokens as CSS `var()` references, for consumers whose runtime resolves
 * the CSS cascade (i.e. web). Kept out of `./tokens` because React Native has
 * no cascade — a `var(--token)` string there fails silently, rendering as an
 * unparseable color rather than throwing.
 */
export const colors = colorTokenNames.reduce(
  (accumulator, token) => {
    accumulator[token] = `var(--${token})`;
    return accumulator;
  },
  {} as Record<ColorToken, `var(--${string})`>,
);
