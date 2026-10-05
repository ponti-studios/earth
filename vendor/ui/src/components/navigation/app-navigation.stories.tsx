import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { userEvent, within } from "storybook/test";

import { Button } from "../primitives/button";
import { Navigation } from "./app-navigation";

const meta: Meta<typeof Navigation> = {
  title: "Navigation/AppNavigation",
  component: Navigation,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const defaultLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
];

/** Adds a little page content so the navigation can be viewed in context. */
function PageContent({
  message = "Page content appears below the sticky nav.",
}: {
  message?: string;
}) {
  return (
    <div className="p-8">
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => (
    <>
      <Navigation>
        <Navigation.Brand>
          <a href="/">Acme</a>
        </Navigation.Brand>

        <Navigation.List>
          {defaultLinks.map((link) => (
            <Navigation.Item key={link.href} href={link.href}>
              {link.label}
            </Navigation.Item>
          ))}
        </Navigation.List>

        <Navigation.Action>
          <Button size="md" asChild>
            <a href="/get-started">Get started</a>
          </Button>
        </Navigation.Action>
      </Navigation>
      <PageContent />
    </>
  ),
};

export const NoCta: Story = {
  render: () => (
    <>
      <Navigation>
        <Navigation.Brand>
          <a href="/">Acme</a>
        </Navigation.Brand>
        <Navigation.List>
          {defaultLinks.map((link) => (
            <Navigation.Item key={link.href} href={link.href}>
              {link.label}
            </Navigation.Item>
          ))}
        </Navigation.List>
      </Navigation>
      <PageContent message="Same nav, no Action content." />
    </>
  ),
};

/**
 * `Navigation.Item` (and any of the other pieces) support the same
 * `asChild` composition as `Button`: pass your router's `Link` (or
 * anything else) as the single child. This story stands in for a router
 * `Link` with a plain anchor that no-ops on click, since Storybook has no
 * router.
 */
export const WithCustomRouterLink: Story = {
  render: () => {
    const activeHref = "/pricing";
    return (
      <>
        <Navigation>
          <Navigation.Brand>
            <a href="/" data-router-link="stand-in" onClick={(e) => e.preventDefault()}>
              Acme
            </a>
          </Navigation.Brand>

          <Navigation.List>
            {defaultLinks.map((link) => (
              <Navigation.Item key={link.href} asChild active={link.href === activeHref}>
                <a href={link.href} data-router-link="stand-in" onClick={(e) => e.preventDefault()}>
                  {link.label}
                </a>
              </Navigation.Item>
            ))}
          </Navigation.List>

          <Navigation.Action>
            <Button size="md" asChild>
              <a
                href="/get-started"
                data-router-link="stand-in"
                onClick={(e) => e.preventDefault()}
              >
                Get started
              </a>
            </Button>
          </Navigation.Action>
        </Navigation>
        <PageContent message="Every link here is a custom element composed via asChild - open the elements panel to see data-router-link on each one, and the /pricing item's data-active/aria-current." />
      </>
    );
  },
};

/**
 * Composition means arbitrary content can sit alongside the link list and
 * action area without any prop-shape changes to `Navigation` itself.
 */
export const WithExtraContent: Story = {
  render: () => (
    <>
      <Navigation>
        <Navigation.Brand>
          <a href="/">Acme</a>
        </Navigation.Brand>

        <Navigation.List>
          {defaultLinks.slice(0, 2).map((link) => (
            <Navigation.Item key={link.href} href={link.href}>
              {link.label}
            </Navigation.Item>
          ))}
        </Navigation.List>

        <input
          type="search"
          placeholder="Search..."
          className="h-9 w-40 rounded-md border bg-background px-3 text-sm"
        />

        <Navigation.Action>
          <Button size="md" variant="outline" asChild>
            <a href="/get-started">Get started</a>
          </Button>
        </Navigation.Action>
      </Navigation>
      <PageContent message="A search input sits directly between the link list and the action area — no endContent prop needed." />
    </>
  ),
};

/**
 * `@internal` — undocumented Nokia 3310-style LCD skin for the mobile Sheet
 * menu, opted into via `variant="nokia"`. Only affects the mobile Sheet, so
 * this story forces a mobile viewport and auto-opens the menu trigger.
 */
export const Nokia: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile1" },
    chromatic: { viewports: [375] },
  },
  render: () => (
    <>
      <Navigation variant="nokia">
        <Navigation.Brand>
          <a href="/">Acme</a>
        </Navigation.Brand>

        <Navigation.List>
          {defaultLinks.map((link) => (
            <Navigation.Item key={link.href} href={link.href} active={link.href === "/pricing"}>
              {link.label}
            </Navigation.Item>
          ))}
        </Navigation.List>

        <Navigation.Action>
          <Button size="md" asChild>
            <a href="/get-started">Get started</a>
          </Button>
        </Navigation.Action>
      </Navigation>
      <PageContent message="Open the menu button to see the Nokia 3310-style LCD skin." />
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /open menu/i });
    await userEvent.click(trigger);
  },
};
