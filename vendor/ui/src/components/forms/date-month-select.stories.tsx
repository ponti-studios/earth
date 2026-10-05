import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { DateMonthSelect, getCurrentMonthYear } from "./date-month-select";

const meta = {
  title: "Forms/DateMonthSelect",
  component: DateMonthSelect,
  tags: ["autodocs"],
} satisfies Meta<typeof DateMonthSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

function DateMonthSelectPreview() {
  const [value, setValue] = useState(getCurrentMonthYear());
  return <DateMonthSelect selectedMonthYear={value} onMonthChange={setValue} />;
}

export const Default: Story = {
  args: {
    selectedMonthYear: getCurrentMonthYear(),
    onMonthChange: () => {},
  },
  render: () => <DateMonthSelectPreview />,
};
