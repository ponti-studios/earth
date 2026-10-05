import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { fn } from "storybook/test";

import { ActiveFiltersBar } from "./active-filters-bar";

const meta = {
  title: "Filters/ActiveFiltersBar",
  component: ActiveFiltersBar,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[600px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ActiveFiltersBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    filters: [
      { id: "1", label: "Status: Active", onRemove: fn() },
      { id: "2", label: "Created after Jan 1", onRemove: fn() },
    ],
    onClearAll: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole("list");
    await expect(list).toBeInTheDocument();
    const items = within(list).getAllByRole("listitem");
    expect(items.length).toBe(2);
    await expect(canvas.getByText("Status: Active")).toBeInTheDocument();
    await expect(canvas.getByText("Created after Jan 1")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Clear all" })).toBeInTheDocument();
  },
};

export const WithClearAll: Story = {
  args: {
    filters: [
      { id: "1", label: "Status: Active", onRemove: fn() },
      { id: "2", label: "Role: Engineer", onRemove: fn() },
    ],
    onClearAll: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items.length).toBe(2);
    const clearButton = canvas.getByRole("button", { name: "Clear all" });
    await expect(clearButton).toBeInTheDocument();
    await userEvent.click(clearButton);
    await expect(args.onClearAll).toHaveBeenCalledTimes(1);
  },
};

export const WithSortOnly: Story = {
  args: {
    filters: [{ id: "1", label: "Date", onRemove: fn(), variant: "sort", direction: "desc" }],
    onClearAll: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items.length).toBe(1);
    await expect(canvas.getByText("Date")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Clear all" })).toBeInTheDocument();
  },
};

export const WithSortAndFilter: Story = {
  args: {
    filters: [
      { id: "filter-1", label: "Status: Active", onRemove: fn(), variant: "filter" },
      { id: "sort-1", label: "Date", onRemove: fn(), variant: "sort", direction: "desc" },
    ],
    onClearAll: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items.length).toBe(2);
    await expect(canvas.getByText("Status: Active")).toBeInTheDocument();
    await expect(canvas.getByText("Date")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Clear all" })).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: { filters: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.queryByRole("list")).toBeNull();
  },
};

export const WithClassName: Story = {
  args: {
    filters: [{ id: "1", label: "Status: Active", onRemove: fn() }],
    className: "mt-4",
  },
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector(".mt-4");
    await expect(container).not.toBeNull();
  },
};
