import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";

import { Slider } from "./slider";

const meta: Meta<typeof Slider> = {
  title: "Forms/Slider",
  component: Slider,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-80 px-1">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    disabled: { control: "boolean" },
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultValue: [50],
    min: 0,
    max: 100,
    "aria-label": "Volume",
  },
};

export const WithStep: Story = {
  args: {
    defaultValue: [0],
    min: 0,
    max: 100,
    step: 10,
    "aria-label": "Volume",
  },
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = React.useState([33]);
    return (
      <div className="w-80 space-y-4 px-1">
        <Slider aria-label="Volume" value={value} onValueChange={setValue} min={0} max={100} />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Volume</span>
          <span className="font-medium tabular-nums">{value[0]}%</span>
        </div>
      </div>
    );
  },
};

export const Disabled: Story = {
  args: {
    value: [40],
    disabled: true,
    min: 0,
    max: 100,
    "aria-label": "Volume",
  },
};
