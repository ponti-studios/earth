import type { Meta, StoryObj } from "@storybook/react-vite";

import { SurfacePanel } from "./surface-panel";

const meta = {
  title: "Layout/SurfacePanel",
  component: SurfacePanel,
  tags: ["autodocs"],
} satisfies Meta<typeof SurfacePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-80">
      <SurfacePanel>
        <p className="text-muted-foreground text-sm">Panel content goes here.</p>
      </SurfacePanel>
    </div>
  ),
};

export const AsSection: Story = {
  render: () => (
    <div className="w-80">
      <SurfacePanel as="section" aria-label="Example panel">
        <p className="text-muted-foreground text-sm">Rendered as a semantic &lt;section&gt;.</p>
      </SurfacePanel>
    </div>
  ),
};
