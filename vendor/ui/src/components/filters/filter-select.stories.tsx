import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { FilterSelect } from "./filter-select";

const meta = {
  title: "Filters/FilterSelect",
  component: FilterSelect,
  tags: ["autodocs"],
  args: {
    options: [
      { value: "active", label: "Active" },
      { value: "interview", label: "Interview" },
      { value: "offer", label: "Offer" },
      { value: "rejected", label: "Rejected" },
      { value: "archived", label: "Archived" },
    ],
    placeholder: "All statuses",
    label: "Status",
    onChange: () => {},
  },
} satisfies Meta<typeof FilterSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", { name: "Status" });
    await expect(trigger).toBeInTheDocument();
    await expect(trigger).toHaveTextContent("All statuses");
  },
};

export const WithValue: Story = {
  args: { value: "active" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", { name: "Status" });
    await expect(trigger).toHaveTextContent("Active");
  },
};

export const Loading: Story = {
  args: { value: null, isLoading: true, options: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("combobox", { name: "Status" })).toBeInTheDocument();
    await expect(canvas.getByText("Status")).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: { value: null, options: [], emptyLabel: "No statuses found" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("combobox", { name: "Status" })).toBeInTheDocument();
    await expect(canvas.getByText("Status")).toBeInTheDocument();
  },
};

export const Disabled: Story = {
  args: { value: "active", disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", { name: "Status" });
    await expect(trigger).toBeDisabled();
  },
};
