import type { Meta, StoryObj } from "@storybook/react-vite";

import { Separator } from "./separator";

const meta = {
  title: "Primitives/Separator",
  component: Separator,
  tags: ["autodocs"],
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  args: {},
  render: () => (
    <div className="w-64">
      <p className="text-sm">Above</p>
      <Separator className="my-2" />
      <p className="text-sm">Below</p>
    </div>
  ),
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: () => (
    <div className="flex h-8 items-center gap-2">
      <p className="text-sm">Left</p>
      <Separator orientation="vertical" />
      <p className="text-sm">Right</p>
    </div>
  ),
};
