import type { Meta, StoryObj } from "@storybook/react-vite";

import { MetricCard } from "./metric-card";

const meta = {
  title: "DataDisplay/MetricCard",
  component: MetricCard,
  tags: ["autodocs"],
} satisfies Meta<typeof MetricCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Net worth",
    value: "$48,210",
  },
};

export const WithChange: Story = {
  args: {
    label: "Monthly spend",
    value: "$3,120",
    change: "+4.2% vs last month",
  },
};

export const Empty: Story = {
  args: {
    label: "Runway",
    value: undefined,
  },
};

export const Grid: Story = {
  args: {
    label: "Net worth",
    value: "$48,210",
  },
  render: () => (
    <div className="grid w-[520px] grid-cols-3 gap-3">
      <MetricCard label="Net worth" value="$48,210" change="+2.1%" />
      <MetricCard label="Income" value="$6,400" />
      <MetricCard label="Expenses" value="$3,120" change="-1.4%" />
    </div>
  ),
};
