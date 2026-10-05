import type { Meta, StoryObj } from "@storybook/react-vite";

import { LucideAlertCircle, LucideDiamond, LucideNut } from "lucide-react";
import { Badge } from "./badge";

const meta = {
  title: "Primitives/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline"],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "Badge" },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="default">
        <LucideDiamond className="size-3" />
        Default
      </Badge>
      <Badge variant="secondary">
        <LucideNut className="size-3" />
        Secondary
      </Badge>
      <Badge variant="destructive">
        <LucideAlertCircle className="size-3" />
        Destructive
      </Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};
