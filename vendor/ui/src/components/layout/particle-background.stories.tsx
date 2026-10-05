import type { Meta, StoryObj } from "@storybook/react-vite";

import { ParticleBackground } from "./particle-background";

const meta = {
  title: "Layout/ParticleBackground",
  component: ParticleBackground,
  tags: ["autodocs"],
} satisfies Meta<typeof ParticleBackground>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="bg-background relative h-80 w-[640px] overflow-hidden">
      <ParticleBackground {...args} />
    </div>
  ),
};

export const Static: Story = {
  args: { interactive: false },
  render: (args) => (
    <div className="bg-background relative h-80 w-[640px] overflow-hidden">
      <ParticleBackground {...args} />
    </div>
  ),
};

export const Disabled: Story = {
  args: { enabled: false },
  render: (args) => (
    <div className="bg-background relative h-80 w-[640px] overflow-hidden">
      <ParticleBackground {...args} />
    </div>
  ),
};
