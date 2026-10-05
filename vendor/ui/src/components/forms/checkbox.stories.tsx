import type { Meta, StoryObj } from "@storybook/react-vite";

import { Checkbox } from "./checkbox";
import { Label } from "./label";

const meta = {
  title: "Forms/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { "aria-label": "Accept terms" },
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox {...args} id="terms" />
      <Label htmlFor="terms">Accept terms</Label>
    </div>
  ),
};

export const Checked: Story = {
  args: { "aria-label": "Checked", defaultChecked: true },
};

export const Indeterminate: Story = {
  args: { "aria-label": "Partially selected", indeterminate: true },
};

export const Disabled: Story = {
  args: { "aria-label": "Disabled", disabled: true },
};
