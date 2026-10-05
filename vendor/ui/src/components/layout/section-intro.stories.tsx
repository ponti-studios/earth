import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../primitives/button";
import { SectionIntro } from "./section-intro";

const meta = {
  title: "Layout/SectionIntro",
  component: SectionIntro,
  tags: ["autodocs"],
} satisfies Meta<typeof SectionIntro>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Accounts",
    description: "Connect and manage the accounts you track.",
  },
};

export const WithEyebrowAndActions: Story = {
  args: {
    eyebrow: "Settings",
    title: "Security",
    description: "Manage how you sign in and keep your account secure.",
    actions: <Button variant="outline">Add passkey</Button>,
  },
};
