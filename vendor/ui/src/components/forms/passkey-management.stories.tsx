import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { PasskeyManagement, type PasskeyRecord } from "./passkey-management";

const meta = {
  title: "Forms/PasskeyManagement",
  component: PasskeyManagement,
  tags: ["autodocs"],
} satisfies Meta<typeof PasskeyManagement>;

export default meta;
type Story = StoryObj<typeof meta>;

const initialPasskeys: PasskeyRecord[] = [
  { id: "1", name: "MacBook Pro", createdAt: "2025-01-15T00:00:00.000Z" },
  { id: "2", name: "iPhone", createdAt: "2025-03-02T00:00:00.000Z" },
];

function PasskeyManagementPreview({ withDeleteError = false }: { withDeleteError?: boolean }) {
  const [passkeys, setPasskeys] = useState(initialPasskeys);

  return (
    <div className="w-96">
      <PasskeyManagement
        passkeys={passkeys}
        onAdd={async () => {
          setPasskeys((prev) => [
            ...prev,
            {
              id: String(prev.length + 1),
              name: "New device",
              createdAt: new Date().toISOString(),
            },
          ]);
          return true;
        }}
        onDelete={async (id) => {
          if (withDeleteError && id === "2") return false;
          setPasskeys((prev) => prev.filter((pk) => pk.id !== id));
          return true;
        }}
      />
    </div>
  );
}

export const Default: Story = {
  args: {
    passkeys: initialPasskeys,
    onAdd: async () => true,
    onDelete: async () => true,
  },
  render: () => <PasskeyManagementPreview />,
};

export const Empty: Story = {
  args: {
    passkeys: [],
    onAdd: async () => true,
    onDelete: async () => true,
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    onAdd: async () => true,
    onDelete: async () => true,
  },
  render: (args) => (
    <div className="w-[calc(100vw-2rem)] max-w-md">
      <PasskeyManagement {...args} />
    </div>
  ),
};

export const WithError: Story = {
  args: {
    passkeys: initialPasskeys,
    onAdd: async () => true,
    onDelete: async () => true,
  },
  render: () => <PasskeyManagementPreview withDeleteError />,
};
