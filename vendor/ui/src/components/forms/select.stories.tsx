import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, within } from "storybook/test";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./select";

const meta = {
  title: "Forms/Select",
  component: Select,
  tags: ["autodocs"],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[180px]" aria-label="Select a fruit">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="blueberry">Blueberry</SelectItem>
        <SelectItem value="grapes">Grapes</SelectItem>
        <SelectItem value="pineapple">Pineapple</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const SelectedValue: Story = {
  render: () => (
    <Select defaultValue="banana">
      <SelectTrigger className="w-[180px]" aria-label="Selected fruit">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
      </SelectContent>
    </Select>
  ),
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("combobox", { name: "Selected fruit" }),
    ).toHaveTextContent("Banana");
  },
};

export const ExplicitItems: Story = {
  render: () => (
    <Select
      defaultValue="us"
      items={[
        { value: "us", label: "United States" },
        { value: "ca", label: "Canada" },
      ]}
    >
      <SelectTrigger aria-label="Country">
        <SelectValue placeholder="Select a country" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="us">US</SelectItem>
        <SelectItem value="ca">CA</SelectItem>
      </SelectContent>
    </Select>
  ),
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("combobox", { name: "Country" }),
    ).toHaveTextContent("United States");
  },
};

export const NullItem: Story = {
  render: () => (
    <Select defaultValue={null} items={[{ value: null, label: "All options" }]}>
      <SelectTrigger aria-label="Filter">
        <SelectValue placeholder="Choose a filter" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem>All options</SelectItem>
        <SelectItem value="active">Active</SelectItem>
      </SelectContent>
    </Select>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("combobox", { name: "Filter" })).toHaveTextContent(
      "All options",
    );
  },
};

function ControlledNullSelection() {
  const [value, setValue] = React.useState<string | null>("active");
  const [lastChange, setLastChange] = React.useState<string | null>("active");

  return (
    <div>
      <Select
        value={value}
        onValueChange={(nextValue) => {
          setValue(nextValue);
          setLastChange(nextValue);
        }}
        items={[
          { value: null, label: "All options" },
          { value: "active", label: "Active" },
        ]}
      >
        <SelectTrigger aria-label="Controlled filter">
          <SelectValue placeholder="Choose a filter" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem>All options</SelectItem>
          <SelectItem value="active">Active</SelectItem>
        </SelectContent>
      </Select>
      <output aria-label="Last selected value">{lastChange ?? "null"}</output>
    </div>
  );
}

export const ControlledNullChange: Story = {
  render: () => <ControlledNullSelection />,
  parameters: { a11y: { test: "off" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", { name: "Controlled filter" });

    await userEvent.click(trigger);
    await userEvent.click(
      await within(document.body).findByRole("option", { name: "All options" }),
    );
    await expect(trigger).toHaveTextContent("All options");
    await expect(canvas.getByRole("status", { name: "Last selected value" })).toHaveTextContent(
      "null",
    );
    await userEvent.keyboard("{Escape}");
  },
};

export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[200px]" aria-label="Select timezone">
        <SelectValue placeholder="Select timezone" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>North America</SelectLabel>
          <SelectItem value="est">Eastern Standard Time (EST)</SelectItem>
          <SelectItem value="cst">Central Standard Time (CST)</SelectItem>
          <SelectItem value="pst">Pacific Standard Time (PST)</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Europe</SelectLabel>
          <SelectItem value="gmt">Greenwich Mean Time (GMT)</SelectItem>
          <SelectItem value="cet">Central European Time (CET)</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-[180px]" aria-label="Select a fruit">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
      </SelectContent>
    </Select>
  ),
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("combobox", { name: "Select a fruit" }),
    ).toBeDisabled();
  },
};

export const Small: Story = {
  render: () => (
    <Select>
      <SelectTrigger size="sm" className="w-[160px]" aria-label="Select an option">
        <SelectValue placeholder="Select" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="1">Option 1</SelectItem>
        <SelectItem value="2">Option 2</SelectItem>
        <SelectItem value="3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  ),
};
