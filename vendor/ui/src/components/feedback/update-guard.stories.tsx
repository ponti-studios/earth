import type { Meta, StoryObj } from "@storybook/react-vite";

import { UpdateGuard } from "./update-guard";

const meta = {
  title: "Feedback/UpdateGuard",
  component: UpdateGuard,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Surfaces an update-available notification. Service-worker registration and update activation are owned by the consuming application.",
      },
    },
  },
} satisfies Meta<typeof UpdateGuard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    needRefresh: true,
    onRefresh: () => undefined,
    onDismiss: () => undefined,
  },
};
