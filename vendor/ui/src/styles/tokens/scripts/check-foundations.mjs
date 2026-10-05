import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const tailwindTheme = require.resolve("tailwindcss/theme.css");
const tailwind = readFileSync(tailwindTheme, "utf8");
const sourceTokens = JSON.parse(
  readFileSync(new URL("../source/foundations.tokens.json", import.meta.url), "utf8"),
);
const generated = readFileSync(new URL("../generated/foundations.css", import.meta.url), "utf8");

const declarations = (css) =>
  [...css.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]);
const expected = declarations(tailwind);
const actual = declarations(generated);
const failures = [];
const normalize = (value) =>
  value
    .replaceAll(/\b0px\b/g, "0")
    .replaceAll(/ 0 0 (rgb\()/g, " $1")
    .replaceAll(/\s+/g, " ")
    .trim();
const expectedValues = new Map(expected);
const generatedNames = new Set();

const requiredNames = [
  "--spacing",
  "--font-sans",
  "--font-serif",
  "--font-mono",
  ...[
    "xs",
    "sm",
    "base",
    "lg",
    "xl",
    "2xl",
    "3xl",
    "4xl",
    "5xl",
    "6xl",
    "7xl",
    "8xl",
    "9xl",
  ].flatMap((name) => [`--text-${name}`, `--text-line-height-${name}`]),
  ...[
    "thin",
    "extralight",
    "light",
    "normal",
    "medium",
    "semibold",
    "bold",
    "extrabold",
    "black",
  ].map((name) => `--font-weight-${name}`),
  ...["tighter", "tight", "normal", "wide", "wider", "widest"].map((name) => `--tracking-${name}`),
  ...["tight", "snug", "normal", "relaxed", "loose"].map((name) => `--leading-${name}`),
  ...["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "full"].map((name) => `--radius-${name}`),
  ...["2xs", "xs", "sm", "md", "lg", "xl", "2xl", "none"].map((name) => `--shadow-${name}`),
  ...["sm", "md", "lg", "xl", "2xl"].map((name) => `--breakpoint-${name}`),
  ...["3xs", "2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl"].map(
    (name) => `--container-${name}`,
  ),
  ...["auto", "0", "10", "20", "30", "40", "50"].map((name) => `--z-index-${name}`),
  ...["in", "out", "in-out"].map((name) => `--ease-${name}`),
  ...["75", "100", "150", "200", "300", "500", "700", "1000"].map((name) => `--duration-${name}`),
  ...["spin", "ping", "pulse", "bounce"].map((name) => `--animate-${name}`),
];

const sourceNames = new Set();
const collectSourceNames = (node, path = []) => {
  if (!node || typeof node !== "object") return;
  if (Object.hasOwn(node, "$value")) {
    sourceNames.add(`--${path.join("-")}`);
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    if (!key.startsWith("$")) collectSourceNames(value, [...path, key]);
  }
};
collectSourceNames(sourceTokens);

// Font families use our own system-ui stack ordering rather than Tailwind's
// exact default wording — every other foundation name is meant to stay
// aligned with Tailwind's own scale, but font-* is exempt from that check.
const brandOverrideNames = new Set(["--font-sans", "--font-serif", "--font-mono"]);

for (const [name, value] of actual) {
  if (generatedNames.has(name)) failures.push(`duplicate generated foundation variable: ${name}`);
  generatedNames.add(name);

  if (brandOverrideNames.has(name)) continue;

  const tailwindValue = expectedValues.get(name);
  if (tailwindValue !== undefined && normalize(value) !== normalize(tailwindValue)) {
    failures.push(`${name}: generated ${value}; Tailwind ${tailwindValue}`);
  }
}

for (const name of requiredNames) {
  if (!generatedNames.has(name))
    failures.push(`required Tailwind foundation variable is missing: ${name}`);
}

for (const name of sourceNames) {
  if (!generatedNames.has(name)) failures.push(`missing generated foundation variable: ${name}`);
}
for (const name of generatedNames) {
  if (!sourceNames.has(name))
    failures.push(`generated foundation variable has no source token: ${name}`);
}

if (/--[\w-]+:\s*var\(--[\w-]+\)/.test(generated))
  failures.push("generated foundations contain a custom-property alias");
if (/--tracking-[\w-]+:\s*-?\d+(?:\.\d+)?\s*;/.test(generated))
  failures.push("tracking values must carry a CSS unit");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(
  `Foundation conformance passed (${actual.length} generated variables; ${expectedValues.size} Tailwind variables available for comparison).`,
);
