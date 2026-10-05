import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../../components/primitives/button";
import { colors } from "./css-vars";
import type { ColorToken } from "./index";

const meta: Meta = { title: "Foundations/Colors", parameters: { layout: "fullscreen" } };
export default meta;
type Story = StoryObj<typeof meta>;

type Role = {
  token: ColorToken;
  purpose: string;
  foreground?: ColorToken;
};

const surfaces: Role[] = [
  { token: "background", purpose: "The page and app shell surface." },
  { token: "card", purpose: "Content containers and grouped information." },
  { token: "popover", purpose: "Dropdowns, dialogs, and floating panels." },
  { token: "muted", purpose: "Quiet, disabled, and loading surfaces." },
  { token: "secondary", purpose: "Secondary actions and selectable chips." },
  {
    token: "accent",
    purpose: "Tinted emphasis and hover surfaces.",
    foreground: "accent-foreground",
  },
];

const text: Role[] = [
  { token: "text-primary", purpose: "Primary reading text." },
  { token: "text-secondary", purpose: "Supporting labels and descriptions." },
  { token: "tertiary", purpose: "Metadata, timestamps, and placeholders." },
  { token: "text-accent", purpose: "Standalone links and accent affordances." },
  { token: "text-success", purpose: "Standalone positive status text and icons." },
  { token: "text-warning", purpose: "Standalone cautionary status text and icons." },
  { token: "text-destructive", purpose: "Standalone error and destructive text." },
];

const actions: Role[] = [
  {
    token: "primary",
    purpose: "The strongest action on a screen.",
    foreground: "primary-foreground",
  },
  {
    token: "destructive",
    purpose: "Irreversible or dangerous actions.",
    foreground: "destructive-foreground",
  },
  {
    token: "success",
    purpose: "Positive indicators and confirmed states.",
    foreground: "success-foreground",
  },
  {
    token: "warning",
    purpose: "Caution indicators and attention states.",
    foreground: "warning-foreground",
  },
];

const system: Role[] = [
  { token: "border-default", purpose: "Default borders, inputs, and dividers." },
  { token: "focus-ring", purpose: "Keyboard focus indication." },
  { token: "overlay-scrim", purpose: "Backdrop behind modal surfaces." },
];

const charts: Role[] = [
  { token: "chart-1", purpose: "Categorical data series one." },
  { token: "chart-2", purpose: "Categorical data series two." },
  { token: "chart-3", purpose: "Categorical data series three." },
  { token: "chart-4", purpose: "Categorical data series four." },
  { token: "chart-5", purpose: "Categorical data series five." },
  { token: "chart-positive", purpose: "Positive trend in a visualization." },
  { token: "chart-negative", purpose: "Negative trend in a visualization." },
  { token: "chart-neutral", purpose: "Neutral or baseline trend." },
];

function RoleCard({ token, purpose, foreground }: Role) {
  const isText = token.startsWith("text-") || token === "tertiary";
  const isSurface = surfaces.some((role) => role.token === token);
  const swatchOnly = !isText && !isSurface && !foreground;
  const background = isText ? "background" : token;
  const contentColor = isText ? token : (foreground ?? "text-primary");

  return (
    <article className="border-border overflow-hidden rounded-md border bg-card">
      <div
        className="flex min-h-24 items-end p-3"
        style={{
          backgroundColor: colors[swatchOnly ? "card" : background],
          color: colors[swatchOnly ? "text-primary" : contentColor],
        }}
      >
        {swatchOnly ? (
          <span
            aria-hidden="true"
            className="h-full min-h-16 w-full rounded-sm"
            style={{ backgroundColor: colors[token] }}
          />
        ) : (
          <span className="font-mono text-xs">{token}</span>
        )}
      </div>
      <div className="grid gap-1 p-3">
        <code className="text-sm font-medium">--{token}</code>
        <p className="text-muted-foreground text-sm">{purpose}</p>
        {foreground && (
          <p className="text-muted-foreground text-xs">Paired content: --{foreground}</p>
        )}
      </div>
    </article>
  );
}

function RoleSection({
  title,
  description,
  roles,
}: {
  title: string;
  description: string;
  roles: Role[];
}) {
  return (
    <section className="grid gap-3">
      <div className="grid gap-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <RoleCard key={role.token} {...role} />
        ))}
      </div>
    </section>
  );
}

export const SystemAppearance: Story = {
  render: () => (
    <main className="bg-background text-foreground grid min-h-screen gap-10 p-6 md:p-10">
      <header className="grid max-w-3xl gap-2">
        <p className="text-accent-text text-xs font-medium uppercase tracking-widest">
          Foundations
        </p>
        <h1 className="text-2xl font-semibold">Color roles</h1>
        <p className="text-muted-foreground text-sm">
          Every color has a job. These roles resolve from the operating system’s light or dark
          appearance and are the only colors components should consume.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button>Primary action</Button>
          <Button variant="secondary">Secondary action</Button>
          <Button variant="outline">Outline action</Button>
          <Button variant="destructive">Delete item</Button>
        </div>
      </header>

      <div className="grid gap-10">
        <RoleSection
          title="Surfaces"
          description="Backgrounds establish hierarchy. Use the lightest appropriate surface and let spacing do the rest."
          roles={surfaces}
        />
        <RoleSection
          title="Text"
          description="Text roles describe hierarchy or state. Use a text role when content sits directly on a surface."
          roles={text}
        />
        <RoleSection
          title="Actions and status"
          description="Fill roles communicate action or state and always pair with their matching foreground."
          roles={actions}
        />
        <RoleSection
          title="System"
          description="Structural colors support boundaries, focus, and modal layering without competing with content."
          roles={system}
        />
        <RoleSection
          title="Charts"
          description="Chart roles are for data visualization only. They do not communicate interaction or severity in product UI."
          roles={charts}
        />
      </div>
    </main>
  ),
};
