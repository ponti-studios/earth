import type { Meta, StoryObj } from "@storybook/react-vite";

import { fontFamilies, fontWeights, textLineHeights, textSizes, tracking } from "./index";

const meta: Meta = { title: "Foundations/Typography", parameters: { layout: "fullscreen" } };
export default meta;
type Story = StoryObj<typeof meta>;

const sizeTokens = Object.keys(textSizes) as Array<keyof typeof textSizes>;
const weightTokens = Object.keys(fontWeights) as Array<keyof typeof fontWeights>;
const trackingTokens = Object.keys(tracking) as Array<keyof typeof tracking>;
const familyTokens = Object.keys(fontFamilies) as Array<keyof typeof fontFamilies>;

export const TypeScale: Story = {
  render: () => (
    <main className="bg-background text-foreground grid min-h-screen gap-10 p-6 md:p-10">
      <header className="grid gap-2">
        <h1 className="text-2xl font-semibold">Typography</h1>
        <p className="text-muted-foreground max-w-prose text-sm">
          Font sizes, weights, tracking, and families as defined by the shared design tokens (
          <code className="font-mono">src/styles/tokens</code>).
        </p>
      </header>

      <section className="grid gap-4">
        <h2 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Type scale
        </h2>
        <div className="border-border divide-border grid divide-y rounded-md border">
          {sizeTokens.map((token) => (
            <div key={token} className="grid grid-cols-[6rem_5rem_1fr] items-baseline gap-4 p-4">
              <span className="text-muted-foreground font-mono text-xs">text-{token}</span>
              <span className="text-muted-foreground font-mono text-xs tabular-nums">
                {textSizes[token]}px / {textLineHeights[token]?.toFixed(2)}
              </span>
              <span
                className="truncate"
                style={{ fontSize: textSizes[token], lineHeight: textLineHeights[token] }}
              >
                The quick brown fox jumps
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Font weights
        </h2>
        <div className="border-border divide-border grid divide-y rounded-md border">
          {weightTokens.map((token) => (
            <div key={token} className="grid grid-cols-[8rem_1fr] items-baseline gap-4 p-4">
              <span className="text-muted-foreground font-mono text-xs">
                {token} / {fontWeights[token]}
              </span>
              <span className="text-lg" style={{ fontWeight: fontWeights[token] }}>
                The quick brown fox jumps over the lazy dog
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Tracking
        </h2>
        <div className="border-border divide-border grid divide-y rounded-md border">
          {trackingTokens.map((token) => (
            <div key={token} className="grid grid-cols-[8rem_1fr] items-baseline gap-4 p-4">
              <span className="text-muted-foreground font-mono text-xs">
                {token} / {tracking[token]}
              </span>
              <span className="text-lg" style={{ letterSpacing: tracking[token] }}>
                The quick brown fox jumps over the lazy dog
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Font families
        </h2>
        <div className="border-border divide-border grid divide-y rounded-md border">
          {familyTokens.map((token) => (
            <div key={token} className="grid gap-2 p-4">
              <span className="text-muted-foreground font-mono text-xs">--font-{token}</span>
              <span className="text-2xl" style={{ fontFamily: fontFamilies[token] }}>
                The quick brown fox jumps over the lazy dog. 0123456789
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  ),
};

const headingSpecimens = [
  { tag: "h1" as const, className: "text-4xl" },
  { tag: "h2" as const, className: "text-3xl" },
  { tag: "h3" as const, className: "text-2xl" },
  { tag: "h4" as const, className: "text-xl" },
  { tag: "h5" as const, className: "text-lg" },
  { tag: "h6" as const, className: "text-base" },
];

export const Headings: Story = {
  render: () => (
    <main className="bg-background text-foreground grid min-h-screen gap-10 p-6 md:p-10">
      <header className="grid gap-2">
        <h1 className="text-2xl font-semibold">Headings</h1>
        <p className="text-muted-foreground max-w-prose text-sm">
          `h1`–`h6` only carry font-family, weight, and tracking from the base layer — size is unset
          by tag, so components pair a heading element with an explicit{" "}
          <code className="font-mono">text-*</code> utility. The sizes below match this
          codebase&apos;s own usage, not an enforced per-level scale.
        </p>
      </header>

      <section className="grid gap-4">
        <h2 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Display utilities
        </h2>
        <div className="border-border divide-border grid divide-y rounded-md border">
          <div className="grid gap-2 p-4">
            <span className="text-muted-foreground font-mono text-xs">display-1</span>
            <p className="display-1">Display one</p>
          </div>
          <div className="grid gap-2 p-4">
            <span className="text-muted-foreground font-mono text-xs">display-2</span>
            <p className="display-2">Display two</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Semantic headings
        </h2>
        <div className="border-border divide-border grid divide-y rounded-md border">
          {headingSpecimens.map(({ tag: Tag, className }) => (
            <div key={Tag} className="grid grid-cols-[6rem_1fr] items-baseline gap-4 p-4">
              <span className="text-muted-foreground font-mono text-xs">
                {Tag} / {className}
              </span>
              <Tag className={className}>The quick brown fox jumps over the lazy dog</Tag>
            </div>
          ))}
        </div>
      </section>
    </main>
  ),
};
