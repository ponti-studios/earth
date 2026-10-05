import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { booleanControl, hiddenControl, numberControl } from "../../storybook/controls";
import { Stepper } from "./stepper";

const meta = {
  title: "Forms/Stepper",
  component: Stepper,
  tags: ["autodocs"],
  argTypes: {
    value: numberControl("Current value", { defaultValue: 1 }),
    min: numberControl("Minimum allowed value", { defaultValue: 0 }),
    max: numberControl("Maximum allowed value", { defaultValue: 100 }),
    step: numberControl("Amount to change per click", { defaultValue: 1 }),
    disabled: booleanControl("Prevents user interaction", false),
    onChange: hiddenControl,
  },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

function StepperPreview({
  value,
  min,
  max,
  step,
  disabled,
  format,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  format?: (value: number) => string;
}) {
  const [currentValue, setCurrentValue] = useState(value);

  return (
    <Stepper
      value={currentValue}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      format={format}
      onChange={setCurrentValue}
    />
  );
}

export const Default: Story = {
  args: {
    value: 1,
    min: 0,
    max: 10,
    step: 1,
    onChange: () => {},
  },
  render: (args) => (
    <StepperPreview value={args.value} min={args.min} max={args.max} step={args.step} />
  ),
};

export const AtMin: Story = {
  args: {
    value: 0,
    min: 0,
    max: 10,
    onChange: () => {},
  },
  render: (args) => <StepperPreview value={args.value} min={args.min} max={args.max} />,
};

export const AtMax: Story = {
  args: {
    value: 10,
    min: 0,
    max: 10,
    onChange: () => {},
  },
  render: (args) => <StepperPreview value={args.value} min={args.min} max={args.max} />,
};

export const Disabled: Story = {
  args: {
    value: 3,
    disabled: true,
    onChange: () => {},
  },
  render: (args) => <StepperPreview value={args.value} disabled={args.disabled} />,
};

export const CustomFormat: Story = {
  args: {
    value: 5,
    min: 0,
    max: 20,
    onChange: () => {},
  },
  render: (args) => (
    <StepperPreview
      value={args.value}
      min={args.min}
      max={args.max}
      format={(value) => `${value} guests`}
    />
  ),
};
