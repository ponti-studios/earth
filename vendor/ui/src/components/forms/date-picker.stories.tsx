import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import { useState } from "react";

import { DatePicker } from "./date-picker";

const meta = {
  title: "Forms/DatePicker",
  component: DatePicker,
  tags: ["autodocs"],
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

function dateValue(canvasElement: HTMLElement, name: string): string {
  const input = canvasElement.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  return input?.value ?? "";
}

// The native date input owns the picker UI, so stories assert on the input's
// "YYYY-MM-DD" value — the same string a form would submit.
export const Default: Story = {
  args: {
    name: "startDate",
    defaultValue: "2020-01-15",
    label: "Start date",
  },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input[name="startDate"]');
    await expect(input?.value).toBe("2020-01-15");
  },
};

export const WithDateObjectDefault: Story = {
  args: {
    name: "endDate",
    defaultValue: new Date(2020, 0, 15),
    label: "End date",
  },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input[name="endDate"]');
    await expect(input?.value).toBe("2020-01-15");
  },
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>("2026-08-20");
    return (
      <div className="flex flex-col gap-2">
        <DatePicker
          mode="single"
          label="Due date"
          value={value}
          onValueChange={setValue}
          helpText="Controlled — pick a new date"
        />
        <p className="text-sm">value: {value ?? "(none)"}</p>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toContain("2026-08-20");
  },
};

export const Disabled: Story = {
  args: {
    name: "startDate",
    defaultValue: "2020-01-15",
    label: "Locked date",
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input[name="startDate"]');
    await expect(input?.disabled).toBe(true);
    await expect(input?.value).toBe("2020-01-15");
  },
};

export const WithHelpText: Story = {
  args: {
    name: "startDate",
    label: "Start date",
    helpText: "Format is YYYY-MM-DD.",
  },
};

export const WithError: Story = {
  args: {
    name: "startDate",
    label: "Start date",
    error: "A start date is required.",
  },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input[name="startDate"]');
    await expect(input?.getAttribute("aria-invalid")).toBe("true");
    await expect(canvasElement.textContent).toContain("A start date is required.");
  },
};

export const Range: Story = {
  args: {
    mode: "range",
    startName: "startDate",
    endName: "endDate",
    defaultValue: { from: "2020-01-15", to: "2020-06-30" },
    label: "Active period",
  },
  play: async ({ canvasElement }) => {
    await expect(dateValue(canvasElement, "startDate")).toBe("2020-01-15");
    await expect(dateValue(canvasElement, "endDate")).toBe("2020-06-30");
  },
};

export const RangeEmpty: Story = {
  args: {
    mode: "range",
    startName: "startDate",
    endName: "endDate",
    label: "Active period",
  },
  play: async ({ canvasElement }) => {
    await expect(dateValue(canvasElement, "startDate")).toBe("");
    await expect(dateValue(canvasElement, "endDate")).toBe("");
  },
};

export const RangeControlled: Story = {
  render: () => {
    const [range, setRange] = useState<{ from: string | null; to: string | null }>({
      from: "2026-08-01",
      to: "2026-08-15",
    });
    return (
      <div className="flex flex-col gap-2">
        <DatePicker
          mode="range"
          label="Stay dates"
          startName="stayStart"
          endName="stayEnd"
          value={range}
          onValueChange={setRange}
          fromLabel="Check-in"
          toLabel="Check-out"
        />
        <p className="text-sm">
          from: {range.from ?? "(none)"} · to: {range.to ?? "(none)"}
        </p>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toContain("from: 2026-08-01");
    await expect(canvasElement.textContent).toContain("to: 2026-08-15");

    const end = canvasElement.querySelector<HTMLInputElement>('input[name="stayEnd"]');
    await userEvent.clear(end!);
    await userEvent.type(end!, "0002-08-01");
    await expect(end?.value).toBe("0002-08-01");
    await expect(canvasElement.textContent).toContain("to: 0002-08-01");
  },
};

// Two independent fields cross-wired via min/max: the end field can't go
// before the start, and the start field can't go after the end.
export const RangeMinMax: Story = {
  args: {
    mode: "range",
    startName: "startDate",
    endName: "endDate",
    min: "2026-01-01",
    max: "2026-12-31",
    label: "Active period",
  },
  play: async ({ canvasElement }) => {
    const start = canvasElement.querySelector<HTMLInputElement>('input[name="startDate"]');
    const end = canvasElement.querySelector<HTMLInputElement>('input[name="endDate"]');
    await expect(start?.min).toBe("2026-01-01");
    await expect(end?.max).toBe("2026-12-31");

    await userEvent.type(start!, "2026-03-15");
    await expect(start?.value).toBe("2026-03-15");
    // End field's floor is now the chosen start date.
    await expect(end?.min).toBe("2026-03-15");
  },
};
