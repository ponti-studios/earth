import type { Meta, StoryObj } from "@storybook/react-vite";
import { ScrollArea } from "./scroll-area";

const meta = {
  title: "Layout/ScrollArea",
  component: ScrollArea,
  tags: ["autodocs"],
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const placeholderItems = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  label: `Item ${i + 1}`,
  bg: `hsl(${i * 45}, 70%, 80%)`,
}));

export const Default: Story = {
  args: {
    className: "gap-4 p-4 max-w-lg",
    children: placeholderItems.map((item) => (
      <div
        key={item.id}
        className="flex size-40 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: item.bg }}
      >
        <span className="font-medium" style={{ color: "#171714" }}>
          {item.label}
        </span>
      </div>
    )),
  },
};

export const WithSnap: Story = {
  args: {
    className: "gap-4 p-4 max-w-lg",
    snap: "start",
    children: placeholderItems.map((item) => (
      <div
        key={item.id}
        className="flex size-48 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: item.bg }}
      >
        <span className="font-medium" style={{ color: "#171714" }}>
          {item.label}
        </span>
      </div>
    )),
  },
};

export const Vertical: Story = {
  args: {
    orientation: "vertical",
    className: "gap-3 p-4 max-h-64",
    children: placeholderItems.map((item) => (
      <div
        key={item.id}
        className="flex h-24 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: item.bg }}
      >
        <span className="font-medium" style={{ color: "#171714" }}>
          {item.label}
        </span>
      </div>
    )),
  },
};

export const ScreenshotsGallery: Story = {
  render: () => (
    <div className="flex max-w-2xl flex-col gap-3">
      <h2 className="text-lg font-semibold">Screenshots</h2>
      <ScrollArea className="gap-4" snap="start">
        {placeholderItems.map((item) => (
          <div
            key={item.id}
            className="flex aspect-video w-72 shrink-0 items-center justify-center overflow-hidden rounded-xl border"
            style={{ backgroundColor: item.bg }}
          >
            <span className="text-sm" style={{ color: "#171714" }}>
              {item.label}
            </span>
          </div>
        ))}
      </ScrollArea>
    </div>
  ),
};
