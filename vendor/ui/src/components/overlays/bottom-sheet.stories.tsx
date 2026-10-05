import type { Meta, StoryObj } from "@storybook/react-vite";

import { BottomSheet } from "./bottom-sheet";

const meta = {
  title: "Overlays/BottomSheet",
  component: BottomSheet,
  tags: ["autodocs"],
} satisfies Meta<typeof BottomSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Example panel",
    children: "Panel content",
  },
  render: () => (
    <div className="bg-muted relative h-105 w-120 overflow-hidden rounded-xl border">
      <BottomSheet
        label="Example panel"
        defaultExpanded
        className="bg-card absolute inset-x-4 bottom-4 max-h-[70%] rounded-2xl border shadow-lg"
        scrollClassName="p-4"
      >
        <p className="text-sm font-semibold">Drag the handle or press it to collapse.</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Non-modal persistent panel. Positioning and sizing are app-owned via className.
        </p>
      </BottomSheet>
    </div>
  ),
};

export const Collapsed: Story = {
  args: {
    label: "Example panel",
    children: "Panel content",
  },
  render: () => (
    <div className="bg-muted relative h-105 w-120 overflow-hidden rounded-xl border">
      <BottomSheet
        label="Example panel"
        className="bg-card absolute inset-x-4 bottom-4 max-h-[70%] rounded-2xl border shadow-lg"
        scrollClassName="p-4"
      >
        <p className="text-sm font-semibold">Starts collapsed to its 48px peek.</p>
      </BottomSheet>
    </div>
  ),
};
