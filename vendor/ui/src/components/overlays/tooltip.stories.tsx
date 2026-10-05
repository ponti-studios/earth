import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../primitives/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const meta = {
  title: "Overlays/Tooltip",
  component: TooltipContent,
  tags: ["autodocs"],
} satisfies Meta<typeof TooltipContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "Save changes" },
  render: (args) => (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="outline" size="sm">
            Hover me
          </Button>
        }
      />
      <TooltipContent {...args} />
    </Tooltip>
  ),
};
