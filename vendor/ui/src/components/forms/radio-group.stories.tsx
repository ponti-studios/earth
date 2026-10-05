import type { Meta, StoryObj } from "@storybook/react-vite";

import { RadioGroup, RadioGroupItem } from "./radio-group";

const meta: Meta<typeof RadioGroup> = {
  title: "Forms/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const options = [
  { value: "default", label: "Default" },
  { value: "comfortable", label: "Comfortable" },
  { value: "compact", label: "Compact" },
];

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="default" className="gap-3">
      {options.map(({ value, label }) => (
        <div key={value} className="flex items-center gap-3">
          <RadioGroupItem value={value} id={`opt-${value}`} />
          <label htmlFor={`opt-${value}`} className="cursor-pointer">
            {label}
          </label>
        </div>
      ))}
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="default" disabled className="gap-3">
      {options.map(({ value, label }) => (
        <div key={value} className="flex items-center gap-3">
          <RadioGroupItem value={value} id={`dis-${value}`} />
          <label htmlFor={`dis-${value}`}>{label}</label>
        </div>
      ))}
    </RadioGroup>
  ),
};
