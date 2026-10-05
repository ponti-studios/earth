import type { Meta, StoryObj } from "@storybook/react-vite";

import { Progress } from "./progress";

const meta = {
  title: "Feedback/Progress",
  component: Progress,
  tags: ["autodocs"],
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 60,
    "aria-label": "Upload progress",
  },
  render: (args) => (
    <div className="w-64">
      <Progress {...args} />
    </div>
  ),
};

export const Empty: Story = {
  args: { value: 0, "aria-label": "Upload progress" },
  render: (args) => (
    <div className="w-64">
      <Progress {...args} />
    </div>
  ),
};

export const Complete: Story = {
  args: { value: 100, "aria-label": "Upload progress" },
  render: (args) => (
    <div className="w-64">
      <Progress {...args} />
    </div>
  ),
};

export const Partial: Story = {
  args: { value: 60 },
  render: () => (
    <div className="flex w-64 flex-col gap-4">
      <Progress value={10} aria-label="Upload progress" />
      <Progress value={33} aria-label="Upload progress" />
      <Progress value={66} aria-label="Upload progress" />
      <Progress value={90} aria-label="Upload progress" />
    </div>
  ),
};
